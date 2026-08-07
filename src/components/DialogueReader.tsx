'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { DialoguePreviewBody } from './DialoguePreviewBody';
import { BannerMenu } from './BannerMenu';
import { Paywall } from './Paywall';
import type { DialoguePreviewData } from './dialoguePreview.types';
import { useAudioPlayer, stopAllAudio } from '../hooks/useAudioPlayer';
import { protectAudioUrlSync } from '../lib/audio/token-client';
import { resolveTtsUrl } from '../utils/ttsAudio';
import { RubyText } from './RubyText';
import { alignPinyinToText } from '../utils/rubyText';
import { splitAligned } from '../utils/splitSentences';
import { usePersistedState } from '../hooks/usePersistedState';

/** revealedSeg sentinel: translate the entry as a whole, not one sentence. */
const WHOLE_ENTRY = -1;

/** Guards for restoring saved reader preferences — see usePersistedState. */
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isFontSize = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 80 && v <= 150;
import { voiceForWith } from '../utils/dialogueVoice';
import { PageFooter } from './PageFooter';
import { CoachMarkTour, dismissTip } from './CoachMark';
import type { TourStep } from './CoachMark';
import { DialogueRolePlay } from './DialogueRolePlay';
import type { DialogueLine } from './DialogueRolePlay';
import { DialogueDictation, type DictationLine } from './DialogueDictation';
import { DialogueVocab } from './DialogueVocab';
import { useStars } from '../hooks/useStars';

// ── Types ──────────────────────────────────────────────────────────────────

interface StoryWord {
  i: [number, number];
  p: string;
  t: string;
  tr: string;
  h?: number;
  l?: number;
}

interface Sentence {
  id: string;
  text_original: string;
  pinyin: string;
  text_translation: string;
  text_translation_ru: string;
  text_translation_en?: string;
  speaker?: string;
  words?: StoryWord[];
  audio_url?: string;
  start?: number;
  end?: number;
  /** Per-character HSK 3.0 level (server-attached). null = off-list. */
  charLvls?: (number | null)[];
}

interface VocabEntry {
  zh: string;
  py: string;
  uz: string;
  ru: string;
  en?: string;
}

interface PhraseEntry {
  zh: string;
  py: string;
  uz: string;
  ru: string;
  en?: string;
}

interface TimeOfDayEntry {
  zh: string;
  py: string;
  uz: string;
  ru: string;
  en?: string;
  icon: string;
}

interface DialogueData {
  id: string;
  level?: number;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  audio_url?: string;
  sections: { id: string; sentences: Sentence[]; audio_url?: string }[];
  vocab?: VocabEntry[];
  phrases?: PhraseEntry[];
  timeOfDay?: TimeOfDayEntry[];
}

export interface DialogueMeta {
  book: string;                 // 'hsk1'..'hsk6'
  slug: string;                 // dialogueId
  level?: number;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  /** Opt-in: dictation tiles are pinyin syllables instead of Han characters
   *  (HSK 1 prototype). Set per-dialogue via `dictationPinyin` in the JSON. */
  dictationPinyin?: boolean;
  /** Opt-in: dictation uses the fixed-key keyboard + backspace instead of the
   *  drag-tile tray. Independent of `dictationPinyin` — set this alone for a
   *  CHARACTER keyboard. Pinyin always uses the keyboard regardless. */
  dictationKeyboard?: boolean;
  /** Per-dialogue speaker→MiMo-voice override (e.g. swap A/B genders for one
   *  dialogue). Merged over the global DIALOGUE_VOICE map. Set via `voices`
   *  in the JSON. */
  voices?: Record<string, string>;
}

interface DialogueReaderProps {
  meta: DialogueMeta;
  bookPath: string;
  listPath?: string;
  preview: DialoguePreviewData;   // server-rendered public slice (always present)
  /** Where to fetch the gated content from. Defaults to the dialogue API; HSK
   *  course texts pass their own endpoint so they can reuse this whole reader
   *  (audio, progressive pinyin, vocab, dictation, role-play) unchanged. */
  contentPath?: string;
}

// ── Main component ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'dialog', uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  { id: 'vocab', uz: 'So\'zlar', ru: 'Слова', en: 'Words' },
  { id: 'dictation', uz: 'Diktant', ru: 'Диктант', en: 'Dictation' },
  { id: 'practice', uz: 'Mashq', ru: 'Практика', en: 'Practice' },
];


export function DialogueReader({ meta, bookPath, listPath, preview, contentPath }: DialogueReaderProps) {
  const { getAccessToken, user, isLoading: authLoading } = useAuth();
  const [language, , setLanguage] = useLanguage();

  // Resolve a sentence's TTS voice, honouring this dialogue's per-speaker override.
  const voiceFor = (s: { speaker?: string }) => voiceForWith(s, meta.voices);

  // Localized title translation — used as the preview's H2 heading.
  const titleTr = language === 'ru' ? meta.titleTranslation_ru
    : language === 'en' ? (meta.titleTranslation_en || meta.titleTranslation)
    : meta.titleTranslation;
  // Localized category label (kicker above the title). Absent → no label.
  const category = language === 'ru' ? preview.category_ru
    : language === 'en' ? (preview.category_en || preview.category_uz)
    : preview.category_uz;
  // Localized public description. Falls back to the title translation until a
  // real description_* is written for the dialogue, so the preview is never blank.
  const description = (language === 'ru' ? preview.description_ru
    : language === 'en' ? (preview.description_en || preview.description_uz)
    : preview.description_uz)
    || titleTr;
  const { saveStars: saveDialogueStars } = useStars('dialogue');

  // Reading controls live behind the ⋮ in the bottom tab bar.
  const [sheetOpen, setSheetOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);

  // Font size. Persisted: it is a property of the reader's eyes, not of the
  // dialogue — see the pinyin/translation toggles below.
  const [fontSize, setFontSize] = usePersistedState('blim-reader-font', 100, isFontSize);

  // Tab state
  const [activeTab, setActiveTab] = useState('dialog');

  // Dialog tab state.
  //
  // Pinyin and translation persist across dialogues: whether you need them is a
  // fact about your level, not about the dialogue you happen to have opened, so
  // re-toggling them on every one is pure friction.
  //
  // Focus mode deliberately does NOT persist. It shows one line at a time and
  // is a way to work through a specific dialogue, not a standing preference —
  // landing in it on a dialogue you just opened would look like a broken page.
  const [showPinyin, setShowPinyin] = usePersistedState('blim-reader-pinyin', true, isBool);
  const [showTranslation, setShowTranslation] = usePersistedState('blim-reader-translation', false, isBool);
  const [focusMode, setFocusMode] = useState(false);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const sentenceAudio = useAudioPlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop the shared (singleton) sentence player when the reader unmounts.
  // Client-side navigation away from the page does not fire `beforeunload`,
  // so without this the tapped-line audio keeps playing on the next page.
  // The full-track / TTS-sequence players are <Audio> elements cleaned up by
  // their own effects; only the global tap player needs this.
  useEffect(() => () => { stopAllAudio(); }, []);
  const firstLineRef = useRef<HTMLDivElement | null>(null);
  const trBarRef = useRef<HTMLDivElement | null>(null);
  // Font pill: flash visible on adjust, then fade fully out when idle (once the
  // user has used it at least once — keeps it discoverable until then).
  const [fontActive, setFontActive] = useState(false);
  const [fontEngaged, setFontEngaged] = useState(false);
  const fontTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashFont = useCallback(() => {
    setFontEngaged(true);
    setFontActive(true);
    if (fontTimerRef.current) clearTimeout(fontTimerRef.current);
    fontTimerRef.current = setTimeout(() => setFontActive(false), 1500);
  }, []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioActive, setAudioActive] = useState(false);

  // ── Fetch state ────────────────────────────────────────────────────────────
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  // The public preview shows until the user clicks "Read & Listen". The full
  // dialogue is fetched only on that explicit request (no auto-advance flash).
  const [revealRequested, setRevealRequested] = useState(false);

  useEffect(() => {
    // Only fetch the gated full dialogue after the user asks for it, and once
    // auth has resolved (so getAccessToken() returns the real token).
    if (authLoading || !revealRequested) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      setDialogue(null);
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(contentPath ?? `/api/content/dialogue/${meta.book}/${meta.slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        if (cancelled) return;
        setDialogue(data.dialogue as DialogueData);
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [meta.book, meta.slug, getAccessToken, reloadKey, authLoading, revealRequested]);

  // ── Null-safe derived data (hooks must always run — dialogue may be null) ──

  const allSentences = useMemo(() => (dialogue?.sections ?? []).flatMap(s => s.sentences), [dialogue]);
  // This dialogue's HSK level — words below it get their pinyin hidden (progressive pinyin).
  const dialogueLevel = meta.level ?? 1;

  const trOf = useCallback((s: Sentence) => (
    language === 'ru' ? s.text_translation_ru
      : language === 'en' ? (s.text_translation_en || s.text_translation)
      : s.text_translation
  ), [language]);

  /**
   * Playback units — SENTENCES, not JSON entries.
   *
   * "Play all" used to walk entries, and an entry routinely holds several
   * sentences (5% of HSK 1 dialogue entries, 74% of HSK 6). One entry meant one
   * TTS clip covering all of them, so the translation bar froze on the first
   * sentence for the length of the whole clip and the rest were never shown.
   *
   * HSK text-1 looked like it worked only because that one text happens to be
   * authored one sentence per entry — texts 2-4 of the same lesson are not, and
   * behaved exactly like the dialogues.
   *
   * Nothing here has recorded audio (only karaoke does); every clip is TTS
   * resolved from text. So splitting is free — ask for the sentence instead of
   * the paragraph and you get a clip for the sentence.
   *
   * Single-sentence entries keep the entry's own id as their key, so the ids
   * are unchanged for the overwhelming majority of lines.
   */
  const units = useMemo(() => allSentences.flatMap(s => {
    const segs = splitAligned(s.text_original ?? '', trOf(s) ?? '');
    return segs.map((sg, i) => ({
      sentence: s,
      seg: segs.length > 1 ? i : WHOLE_ENTRY,
      zh: sg.zh,
      key: segs.length > 1 ? `${s.id}#${i}` : s.id,
    }));
  }), [allSentences, trOf]);

  // Per-sentence MiMo TTS fallback. Dialogues without recorded audio (e.g.
  // HSK 2) have no `audio_url`; we resolve a playable URL from /api/tts
  // (Supabase-cached, generated once) for each such sentence. Prefetching
  // on mount warms the cache so a tap plays instantly inside the user
  // gesture; a tap before the prefetch lands falls back to async resolve.
  const [ttsUrls, setTtsUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const missing = units.filter(u => !u.sentence.audio_url && u.zh.trim());
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const u of missing) {
        const url = await resolveTtsUrl(u.zh, voiceFor(u.sentence));
        if (cancelled) return;
        if (url) setTtsUrls(prev => (prev[u.key] ? prev : { ...prev, [u.key]: url }));
      }
    })();
    return () => { cancelled = true; };
  }, [units]);

  // Whether the bottom-right "play all" FAB should drive a TTS sequence
  // (no single recorded file to play, but sentences are TTS-playable).
  const ttsPlayable = useMemo(
    () => !dialogue?.audio_url && allSentences.some(s => !!s.text_original?.trim()),
    [dialogue, allSentences],
  );

  /** A sentence's translation in the current UI language, Uzbek as fallback. */

  // ── Sequential "play all" for dialogues without a single recording ──
  // HSK 1 plays one recorded file with timestamp highlighting; HSK 2 has
  // none, so we walk the sentences, playing each one's TTS audio in order
  // and highlighting it — giving the same bottom-right play FAB.
  const seqAudioRef = useRef<HTMLAudioElement | null>(null);
  const seqActiveRef = useRef(false);
  const seqIdxRef = useRef(0);

  useEffect(() => {
    if (dialogue?.audio_url) return; // recorded full-audio path owns playback
    const a = new Audio();
    a.preload = 'none';
    seqAudioRef.current = a;
    return () => { seqActiveRef.current = false; a.onended = null; a.pause(); a.src = ''; };
  }, [dialogue?.audio_url]);

  const stopSeq = useCallback(() => {
    if (!seqActiveRef.current) return;
    seqActiveRef.current = false;
    const a = seqAudioRef.current;
    if (a) { a.onended = null; a.pause(); }
    setIsPlaying(false);
    setIsAudioLoading(false);
    setAudioActive(false);
  }, []);

  const playSeqFrom = useCallback(async (idx: number) => {
    if (!seqActiveRef.current) return;
    const u = units[idx];
    // End of dialogue (or every sentence skipped because TTS couldn't
    // resolve) — clear ALL playback state, including the loading spinner,
    // so the FAB never gets stuck mid-load.
    if (!u) { seqActiveRef.current = false; setIsPlaying(false); setIsAudioLoading(false); setAudioActive(false); setActiveSentenceId(null); return; }
    const s = u.sentence;
    seqIdxRef.current = idx;
    // Point the bar at THIS sentence. Set directly as well as through the ref:
    // consecutive units of one entry leave activeSentenceId unchanged, so the
    // render-time block that reads the ref never runs for them.
    pendingSegRef.current = u.seg;
    curSegRef.current = u.seg;
    setRevealedSeg(u.seg);
    setActiveSentenceId(s.id);
    // A recorded file would cover the whole entry, so it can only stand in for
    // a unit that IS the whole entry.
    const recorded = u.seg === WHOLE_ENTRY ? s.audio_url : undefined;
    const url = recorded ?? ttsUrls[u.key] ?? await resolveTtsUrl(u.zh, voiceFor(s));
    if (!seqActiveRef.current) return;
    const a = seqAudioRef.current;
    if (!a) return;
    if (!url) { void playSeqFrom(idx + 1); return; } // skip un-resolvable sentence
    a.onended = () => { if (seqActiveRef.current) void playSeqFrom(seqIdxRef.current + 1); };
    a.src = url;
    try { await a.play(); setIsAudioLoading(false); setIsPlaying(true); }
    catch { /* autoplay rejected — leave state as-is */ }
  }, [units, ttsUrls]);

  const handlePlayAll = useCallback(() => {
    if (seqActiveRef.current) { stopSeq(); return; } // toggle: pause
    sentenceAudio.stop();
    seqActiveRef.current = true;
    setAudioActive(true);
    setIsAudioLoading(true);
    const start = allSentences.findIndex(s => s.id === activeSentenceId);
    void playSeqFrom(start >= 0 ? start : 0);
  }, [stopSeq, sentenceAudio, allSentences, activeSentenceId, playSeqFrom]);

  // Resolve + play a single sentence's audio: recorded `audio_url` when
  // present, otherwise the (possibly already-prefetched) MiMo TTS URL.
  /**
   * Play one unit — a single sentence, matching what the bar translates.
   *
   * A tap used to play the whole entry while the bar showed just the tapped
   * sentence, so on a two-sentence line you heard both and read one.
   */
  const playUnit = useCallback((u: typeof units[number] | undefined) => {
    if (!u) return;
    stopSeq(); // a manual sentence tap cancels any running "play all"
    if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); setAudioActive(false); }
    // A recorded file covers the whole entry, so it can only stand in for a
    // unit that IS the whole entry.
    const ready = (u.seg === WHOLE_ENTRY ? u.sentence.audio_url : undefined) ?? ttsUrls[u.key];
    if (ready) { sentenceAudio.play(u.key, ready); return; }
    sentenceAudio.stop();
    void resolveTtsUrl(u.zh, voiceFor(u.sentence)).then(url => {
      if (!url) return;
      setTtsUrls(prev => (prev[u.key] ? prev : { ...prev, [u.key]: url }));
      sentenceAudio.play(u.key, url);
    });
    // voiceFor is derived from props and stable for a given dialogue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsUrls, isPlaying, sentenceAudio, stopSeq]);

  /** Whole-entry playback — focus mode shows the entry as one card. */
  const playSentence = useCallback((s: Sentence | undefined | null) => {
    if (!s) return;
    stopSeq(); // a manual sentence tap cancels any running "play all"
    if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); setAudioActive(false); }
    const ready = s.audio_url ?? ttsUrls[s.id];
    if (ready) { sentenceAudio.play(s.id, ready); return; }
    // No URL yet (TTS not prefetched — slow connection or first load): stop the
    // current clip NOW so it doesn't keep playing while we resolve the new URL.
    // A line that's actually playing always has a resolved URL, so it never
    // reaches here — the tap-same-line toggle in play() is preserved.
    sentenceAudio.stop();
    void resolveTtsUrl(s.text_original, voiceFor(s)).then(url => {
      if (!url) return;
      setTtsUrls(prev => (prev[s.id] ? prev : { ...prev, [s.id]: url }));
      sentenceAudio.play(s.id, url);
    });
  }, [ttsUrls, isPlaying, sentenceAudio, stopSeq]);

  const timedSentences = useMemo(
    () => allSentences.filter((s): s is Sentence & { start: number; end: number } => s.start !== undefined && s.end !== undefined),
    [allSentences]
  );

  const audioSentenceId = useMemo(() => {
    if (!isPlaying || !timedSentences.length) return null;
    return timedSentences.find(s => currentTime >= s.start && currentTime < s.end)?.id ?? null;
  }, [isPlaying, currentTime, timedSentences]);

  const displaySentenceId = audioSentenceId ?? activeSentenceId;
  const activeSentence = displaySentenceId ? allSentences.find(s => s.id === displaySentenceId) : null;

  // The per-line aid reveal is "sticky": it follows the active/playing line and
  // PERSISTS — it does not clear when audio stops or when an aid is toggled off.
  // So toggling pinyin/translation back on while the same line is still active
  // re-shows it for that line (each aid's own toggle gates whether it renders).
  // Drives BOTH the translation and pinyin per-line reveal. Uses React's "adjust
  // state during render" pattern so it never lags a frame.
  const [revealedId, setRevealedId] = useState<string | null>(null);
  // Which sentence WITHIN the revealed entry to translate. Half the entries
  // hold more than one sentence, and translating the whole entry for a tap on
  // one of them puts three lines in the bar to explain five characters.
  //
  // WHOLE_ENTRY (-1) means "no single sentence is selected — show all of it".
  // That is the state audio playback lands in: one recording covers every
  // sentence in the entry with no timings inside it, so there is no honest way
  // to say which one is being spoken. Showing all of them is right; showing
  // only the first hides the rest for the whole clip.
  const [revealedSeg, setRevealedSeg] = useState<number>(WHOLE_ENTRY);
  // Set by a tap, read once by the block below. Without it an entry reached by
  // audio (play-all walking forward) would inherit the previous tap's segment.
  const pendingSegRef = useRef<number | null>(null);
  // Mirrors revealedSeg for the click handler, which needs the CURRENT segment
  // synchronously to tell "tap on the same sentence" from "tap on the entry's
  // other sentence" without re-creating itself every segment change.
  const curSegRef = useRef(0);
  const [prevDisplayId, setPrevDisplayId] = useState<string | null>(displaySentenceId);
  if (displaySentenceId !== prevDisplayId) {
    setPrevDisplayId(displaySentenceId);
    if (displaySentenceId) {
      setRevealedId(displaySentenceId);
      // No pending segment means this entry was reached by audio, not by a tap
      // — play-all walking forward. Translate all of it.
      const seg = pendingSegRef.current ?? WHOLE_ENTRY;
      setRevealedSeg(seg);
      curSegRef.current = seg;
      pendingSegRef.current = null;
    }
  }

  // When a tapped line's audio finishes, drop its highlight so the line
  // returns to its resting colour. We watch the per-sentence player for a
  // playing → stopped transition and clear the matching selection. Focus mode
  // keeps the selection so its ‹/› nav and replay button still have a target.
  const sentencePlayingId = sentenceAudio.state.playingSentenceId;
  const prevSentencePlayingRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevSentencePlayingRef.current;
    prevSentencePlayingRef.current = sentencePlayingId;
    if (prev && !sentencePlayingId && !focusMode) {
      setActiveSentenceId(curr => (curr === prev ? null : curr));
    }
  }, [sentencePlayingId, focusMode]);

  const toggleFocusMode = useCallback(() => {
    if (!focusMode) {
      // Entering focus mode — stop full track, start sentence audio
      if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); setAudioActive(false); }
      const targetId = activeSentenceId ?? allSentences[0]?.id ?? null;
      setActiveSentenceId(targetId);
      if (targetId) {
        const s = allSentences.find(s => s.id === targetId);
        playSentence(s);
      }
    } else {
      // Exiting focus mode — stop sentence audio
      sentenceAudio.stop();
    }
    setFocusMode(v => !v);
  }, [focusMode, isPlaying, activeSentenceId, allSentences, sentenceAudio, playSentence]);

  /**
   * Bring a tapped line up under the translation bar.
   *
   * The bar is pinned at the top, so a line tapped low on the screen puts its
   * translation a screen away from the line it belongs to — with nothing to
   * say which line that was. Karaoke never has this problem because audio
   * drives the active line and scrolls it to centre; here the tap is the
   * driver, so the tap has to do the scrolling.
   *
   * Only runs while the bar is actually on screen. With translations off,
   * tapping is just "play this line" and moving the page under the reader
   * would be pure annoyance.
   */
  const trTextRef = useRef<HTMLParagraphElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  /** What the top bar says: the revealed sentence's translation, else the title. */
  const barText = useMemo(() => {
    const active = showTranslation ? allSentences.find(s => s.id === revealedId) : undefined;
    const whole = active ? trOf(active) : '';
    // An entry holding several sentences translates only the one that was
    // tapped; splitAligned falls back to the whole entry when the two sides
    // don't split evenly, and WHOLE_ENTRY means no single sentence is selected.
    const segs = active ? splitAligned(active.text_original, whole) : [];
    const tr = (segs.length && revealedSeg !== WHOLE_ENTRY)
      ? (segs[Math.min(revealedSeg, segs.length - 1)]?.tr || whole)
      : whole;
    return { text: tr || `${meta.title} · ${titleTr}`, isTranslation: !!tr };
  }, [showTranslation, allSentences, revealedId, revealedSeg, trOf, meta.title, titleTr]);

  const pendingScrollRef = useRef<HTMLElement | null>(null);
  const [scrollTick, setScrollTick] = useState(0);

  const scrollLineUnderBar = useCallback((el: HTMLElement) => {
    const line = el.closest('.dr-line');
    if (!line) return;
    const barBottom = trBarRef.current?.getBoundingClientRect().height ?? 0;
    const gap = 12;
    const delta = line.getBoundingClientRect().top - barBottom - gap;
    // A line already sitting in the band under the bar doesn't need moving —
    // scrolling it a few pixels reads as a twitch, not as help.
    if (Math.abs(delta) < 24) return;
    window.scrollBy({ top: delta, behavior: 'smooth' });
  }, []);

  const handleSentenceClick = useCallback((id: string, el?: HTMLElement, seg = 0) => {
    dismissTip('dialogue-tour');
    // Tap-again-to-deselect only counts a tap on the SAME sentence. Before
    // segments existed, entry === sentence and prev === id was enough; now a
    // tap on the entry's other sentence must move the highlight, not clear it.
    const sameSeg = curSegRef.current === seg;
    curSegRef.current = seg;
    // Both: the ref for when this tap changes the entry (the render-time block
    // reads it), the state for when it doesn't — re-tapping a different
    // sentence of the entry you are already on must still move the bar.
    pendingSegRef.current = seg;
    setRevealedSeg(seg);
    setActiveSentenceId(prev => focusMode ? id : (prev === id && sameSeg) ? null : id);
    if (focusMode) playSentence(allSentences.find(s => s.id === id));
    else playUnit(units.find(u => u.sentence.id === id && u.seg === seg));
    // Deferred to the effect below, not run here: on the first tap the bar does
    // not exist yet, so measuring now would size the gap against a bar that is
    // about to appear and push the line back down.
    if (el && showTranslation && !focusMode) {
      pendingScrollRef.current = el;
      setScrollTick(t => t + 1);
    }
  }, [focusMode, allSentences, units, playSentence, playUnit, showTranslation]);

  /**
   * Shrink the bar's text until it fits the fixed band.
   *
   * The band is a constant height, so on a narrow phone a long translation can
   * need more lines than it has room for. Rather than clip it or let the box
   * grow, step the type down from 18px — down to 12px, below which it stops
   * being worth reading and the text just wraps.
   *
   * Deliberately in px and set here rather than inherited: the A-/A+ control
   * scales .dialogue-reader, and the translation is chrome, not content — it
   * should not resize with the Chinese.
   */
  useEffect(() => {
    const el = trTextRef.current, box = trBarRef.current;
    if (!el || !box) return;
    const fit = () => {
      // Match the dialogue column exactly. It is width:fit-content, so it
      // differs per dialogue and per viewport — the only way to line the
      // translation up with the Chinese is to measure it. Both are centred,
      // so equal widths means flush left AND right edges.
      const body = bodyRef.current;
      if (body) {
        const cs = getComputedStyle(body);
        el.style.width = `${body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)}px`;
      }
      let px = 18;
      el.style.fontSize = `${px}px`;
      // Reserve only a thin breathing strip, not the full CSS padding: the
      // padding exists so short text isn't flush against the edges, but for
      // long text that reserve was triggering a shrink while the band still
      // had room.
      const room = box.clientHeight - 12;
      while (px > 12 && el.scrollHeight > room) {
        px -= 0.5;
        el.style.fontSize = `${px}px`;
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [barText, activeTab, focusMode]);

  // Runs once the bar is in the DOM, so the geometry is final. Deliberately an
  // effect rather than requestAnimationFrame: rAF is starved whenever the tab
  // isn't compositing, and this is a correctness step, not an animation.
  useEffect(() => {
    const el = pendingScrollRef.current;
    if (!el) return;
    pendingScrollRef.current = null;
    scrollLineUnderBar(el);
  }, [scrollTick, scrollLineUnderBar]);

  const handleFocusNav = useCallback((dir: 'prev' | 'next') => {
    const idx = allSentences.findIndex(s => s.id === displaySentenceId);
    if (idx === -1) return;
    const next = allSentences[dir === 'next' ? idx + 1 : idx - 1];
    if (next) {
      setActiveSentenceId(next.id);
      playSentence(next);
    }
  }, [allSentences, displaySentenceId, playSentence]);

  // Focus mode is a swipeable card deck (same gesture as the My Vocabulary
  // review): swipe left → next line, right → previous. That replaced the ‹ ›
  // arrows. `focusSwiped` suppresses the click that fires at the end of a
  // swipe, so a swipe never also triggers tap-to-play.
  const focusSwipeStart = useRef<{ x: number; y: number } | null>(null);
  const focusSwiped = useRef(false);
  const onFocusPointerDown = (e: React.PointerEvent) => {
    focusSwipeStart.current = { x: e.clientX, y: e.clientY };
    focusSwiped.current = false;
  };
  const onFocusPointerUp = (e: React.PointerEvent) => {
    const s = focusSwipeStart.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    focusSwipeStart.current = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      focusSwiped.current = true;
      handleFocusNav(dx < 0 ? 'next' : 'prev');
    }
  };
  const onFocusCardClick = () => {
    if (focusSwiped.current) return;
    if (activeSentence) handleSentenceClick(activeSentence.id);
  };
  // Arrow keys keep the deck navigable without the removed buttons.
  const onFocusKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); handleFocusNav('next'); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); handleFocusNav('prev'); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocusCardClick(); }
  };

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !dialogue?.audio_url) return;
    sentenceAudio.stop();
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else if (audioActive) { audio.play(); }
    else {
      setIsAudioLoading(true); setAudioActive(true);
      audio.src = protectAudioUrlSync(dialogue.audio_url);
      audio.play().catch(() => { setIsAudioLoading(false); setIsPlaying(false); setAudioActive(false); });
    }
  }, [isPlaying, audioActive, dialogue, sentenceAudio]);

  useEffect(() => {
    if (!dialogue?.audio_url) return;
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;
    // Use property handlers (not addEventListener) so cleanup can null them out
    // — otherwise a re-created element's stale 'ended'/'playing' handlers keep
    // firing and clobber the new dialogue's state.
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onplaying = () => { setIsAudioLoading(false); setIsPlaying(true); if (timedSentences.length > 0) setActiveSentenceId(null); };
    audio.onended = () => {
      setIsPlaying(false); setCurrentTime(0); setAudioActive(false);
      const lastId = allSentences[allSentences.length - 1]?.id ?? null;
      setFocusMode(fm => { if (fm) setActiveSentenceId(lastId); return fm; });
    };
    audio.onerror = () => { setIsAudioLoading(false); setIsPlaying(false); setAudioActive(false); };
    return () => {
      audio.ontimeupdate = null; audio.onplaying = null; audio.onended = null; audio.onerror = null;
      audio.pause(); audio.src = '';
    };
  }, [dialogue?.audio_url, allSentences, timedSentences.length]);

  // Vocab: use authored vocab if present, else auto-extract from sentences
  const vocabList = useMemo(() => {
    if (dialogue?.vocab && dialogue.vocab.length > 0) {
      return dialogue.vocab.map(v => ({ zh: v.zh, py: v.py, uz: v.uz, ru: v.ru, en: v.en || '' }));
    }
    const seen = new Set<string>();
    const words: Array<{ zh: string; py: string; uz: string; ru: string; en: string }> = [];
    for (const s of allSentences) {
      if (!s.words) continue;
      for (const w of s.words) {
        const zh = s.text_original.slice(w.i[0], w.i[1]);
        if (seen.has(zh) || !zh.trim() || /[，。？！、""''：；]/.test(zh)) continue;
        seen.add(zh);
        words.push({ zh, py: w.p, uz: w.t, ru: w.tr, en: '' });
      }
    }
    return words;
  }, [dialogue, allSentences]);

  // Dictation lines: one per sentence with ≥2 Han characters (worth scrambling).
  const dictationLines: DictationLine[] = useMemo(() => {
    const trOf = (s: typeof allSentences[number]) =>
      language === 'ru' ? s.text_translation_ru
      : language === 'en' ? (s.text_translation_en || s.text_translation)
      : s.text_translation;
    return allSentences
      .filter(s => (s.text_original.match(/[㐀-鿿]/g)?.length ?? 0) >= 2)
      .map(s => ({
        id: s.id,
        zh: s.text_original,
        pinyin: s.pinyin,
        translation: trOf(s),
        audioUrl: s.audio_url ?? ttsUrls[s.id],
      }));
  }, [allSentences, language, ttsUrls]);

  // Extract DialogueLine[] for role-play practice. Merge consecutive
  // sentences from the same speaker so one A or B turn becomes one chat
  // bubble even when the JSON splits the turn across multiple sentence
  // entries. getTestUnits inside DialogueRolePlay re-splits on punctuation
  // so per-sentence grading still works.
  const rolePlayLines: DialogueLine[] = useMemo(() => {
    const filtered = allSentences.filter(s => s.speaker === 'A' || s.speaker === 'B');
    const trOf = (s: typeof filtered[number]) =>
      language === 'ru' ? s.text_translation_ru
      : language === 'en' ? (s.text_translation_en || s.text_translation)
      : s.text_translation;
    const merged: DialogueLine[] = [];
    for (const s of filtered) {
      const last = merged[merged.length - 1];
      if (last && last.speaker === s.speaker) {
        last.zh = `${last.zh}${s.text_original}`;
        last.pinyin = `${last.pinyin} ${s.pinyin}`.trim();
        last.uz = `${last.uz} ${trOf(s)}`.trim();
        // Keep the existing audio_url; first sentence's audio (when
        // present) drives the app-line playback for the whole bubble.
        last.audio_url = last.audio_url ?? s.audio_url;
      } else {
        merged.push({
          speaker: s.speaker as 'A' | 'B',
          zh: s.text_original,
          pinyin: s.pinyin,
          uz: trOf(s),
          audio_url: s.audio_url,
        });
      }
    }
    return merged;
  }, [allSentences, language]);

  return (
    <>
      <div className="dialogue-reader dr-nav" style={{ fontSize: `${fontSize}%` }}>

        {/* ── Classic banner hero — same across the app ──
            Hidden once the reader opens: it costs ~150px of every screen to
            repeat the title you just tapped, and back/menu move into the ⋮.
            It stays for the teaser, which IS public and needs the h1. */}
        <div className={`dr-hero${status === 'loaded' ? ' dr-hero--hidden' : ''}`}>
          <div className="dr-hero__watermark">对话</div>
          <div className="dr-hero__top-row">
            <Link href={listPath || `${bookPath}/dialogues`} className="dr-back-btn" aria-label={({ uz: 'Orqaga', ru: 'Назад', en: 'Back' } as Record<string, string>)[language]}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK {meta.level ?? 1} · {({ uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' } as Record<string, string>)[language]}</div>
            <h1 className="dr-hero__title">{meta.title}</h1>
            <div className="dr-hero__pinyin">{meta.pinyin}</div>
            <div className="dr-hero__translation">— {language === 'ru' ? meta.titleTranslation_ru : language === 'en' ? (meta.titleTranslation_en || meta.titleTranslation) : meta.titleTranslation} —</div>
          </div>
        </div>


        {/* ── Public preview — until the user clicks "Read & Listen" ── */}
        {status !== 'loaded' && status !== 'error' && !(status === 'locked' && revealRequested) && (
          <DialoguePreviewBody
            preview={preview}
            language={language}
            title={titleTr}
            category={category}
            description={description}
            isAuthed={!!user}
            onReveal={() => setRevealRequested(true)}
            revealing={revealRequested && status === 'loading'}
          />
        )}

        {/* ── Signed in but not subscribed: paywall after a reveal attempt ── */}
        {status === 'locked' && revealRequested && <Paywall />}

        {/* ── Status: error ── */}
        {status === 'error' && (
          <div className="page__audio-error" role="status" style={{ position: 'static', margin: '24px auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            {({ uz: 'Yuklab bo\'lmadi.', ru: 'Не удалось загрузить.', en: 'Could not load.' } as Record<string, string>)[language]}
            <button type="button" className="dr-tabs__tab" onClick={() => setReloadKey(k => k + 1)}>
              {({ uz: 'Qayta urinish', ru: 'Повторить', en: 'Retry' } as Record<string, string>)[language]}
            </button>
          </div>
        )}

        {/* ── Body — only when loaded ── */}
        {status === 'loaded' && dialogue && (
          <>
            {/* ── Top tab bar ── */}
            <div className="dr-tabs">
              <div className="dr-tabs__inner">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    className={`dr-tabs__tab ${activeTab === t.id ? 'dr-tabs__tab--active' : ''}`}
                    onClick={() => {
                      setActiveTab(t.id);
                      if (t.id !== 'dialog') {
                        setFocusMode(false);
                        sentenceAudio.stop();
                      }
                    }}
                    type="button"
                    aria-pressed={activeTab === t.id}
                    aria-label={(t as Record<string, string>)[language] ?? t.uz}
                  >
                    {(t as Record<string, string>)[language] ?? t.uz}
                  </button>
                ))}
                {(
                  <button
                    ref={moreBtnRef}
                    className="dr-tabs__tab dr-more"
                    onClick={(e) => { e.stopPropagation(); setSheetOpen(o => !o); }}
                    type="button"
                    aria-label="More"
                    aria-expanded={sheetOpen}
                  >⋮</button>
                )}
              </div>
            </div>

            {/* ── DIALOG TAB ── */}
            {activeTab === 'dialog' && (
              <>
                {/* The reader's only top chrome — the hero is hidden once
                    content loads, and this replaces it.

                    A sibling of .dr-dialog-body, not a child: that column is
                    centred fit-content, so a full-bleed width measured from it
                    lands off-centre. Out here the viewport is the reference.

                    Fixed height in every state so the page never shifts, and
                    never blank — with no line selected it shows the title. */}
                {!focusMode && (
                  <div className={`dr-trbar${barText.isTranslation ? '' : ' dr-trbar--idle'}`} ref={trBarRef} aria-live="polite">
                    <p className="dr-trbar__text" ref={trTextRef}>{barText.text}</p>
                  </div>
                )}
                <div ref={bodyRef} className={`dr-dialog-body ${audioActive ? 'dr-dialog-body--with-audio' : ''}`}>
                  {focusMode && activeSentence ? (
                    <div className="story__focus">
                      {/* Swipeable card deck (same gesture as My Vocabulary):
                          swipe left → next line, right → previous. Tap plays the
                          line; the ‹ › arrows were replaced by the gesture and
                          audio moved to the shared FAB. */}
                      <div
                        className="story__focus-card"
                        onPointerDown={onFocusPointerDown}
                        onPointerUp={onFocusPointerUp}
                        onClick={onFocusCardClick}
                        onKeyDown={onFocusKeyDown}
                        role="button"
                        tabIndex={0}
                        aria-label={({ uz: 'Gapni tinglash — chapga/oʻngga suring', ru: 'Прослушать строку — свайп влево/вправо', en: 'Play line — swipe left/right' } as Record<string, string>)[language]}
                      >
                        <div className="story__text story__focus-text">
                          <div className="story__focus-line">
                            <span className="story__sentence story__sentence--active">
                              <RubyText text={activeSentence.text_original} pinyin={activeSentence.pinyin} showPinyin={showPinyin} />
                            </span>
                          </div>
                          {/* No translation here on purpose: focus mode is for
                              working a line out from the Chinese and its full
                              pinyin. The Tarjima switch is disabled while it is
                              on, so the state is visible rather than ignored. */}
                        </div>
                      </div>
                      <span className="story__focus-counter">{allSentences.findIndex(s => s.id === displaySentenceId) + 1} / {allSentences.length}</span>
                    </div>
                  ) : (
                  <>
                    {dialogue.sections.map(section => {
                      // Group consecutive sentences that share a speaker so
                      // they flow as one wrapping row of characters instead
                      // of breaking onto a new line per sentence.
                      const groups: Sentence[][] = [];
                      for (const s of section.sentences) {
                        const last = groups[groups.length - 1];
                        if (last && last[0].speaker && last[0].speaker === s.speaker) last.push(s);
                        else groups.push([s]);
                      }
                      return (
                        <div key={section.id} className="dr-lines">
                          {groups.map((group, gi) => {
                            const speaker = group[0].speaker;
                            return (
                              <div key={`${section.id}-g${gi}`} className={`dr-line dr-line--sp${(speaker || 'a').toLowerCase()}`}>
                                <div className="dr-line-main">
                                  <div ref={group[0].id === allSentences[0]?.id ? firstLineRef : undefined} className="dr-line-chars">
                                    {group.map((s, si) => {
                                      const pairs = alignPinyinToText(s.text_original, s.pinyin);
                                      const sActive = displaySentenceId === s.id;
                                      const sPlaying = audioSentenceId === s.id;
                                      // Pinyin follows the global toggle. When on, it's
                                      // shown PROGRESSIVELY: words below the dialogue's
                                      // HSK level (which the learner already knows) render
                                      // bare; words at-or-above level + off-list keep it.
                                      const sPinyin = showPinyin;
                                      // char-index → HSK 3.0 level (server-attached charLvls)
                                      const charLvl = s.charLvls ?? [];
                                      // Sentence boundaries within this entry, so a tap
                                      // knows WHICH sentence it landed in and the bar can
                                      // translate that one alone.
                                      const segs = splitAligned(s.text_original, trOf(s));
                                      // With the bar showing one sentence of several, the
                                      // highlight has to narrow to match — a highlight
                                      // spanning both sentences implies the bar covers both,
                                      // and the translation then reads as truncated. Only
                                      // when translations are on: with the bar gone there is
                                      // nothing for a narrower highlight to point at.
                                      const narrowHl = showTranslation && segs.length > 1 && revealedSeg !== WHOLE_ENTRY;
                                      let charOff = 0;
                                      return pairs.map((pair, ci) => {
                                        const wl = charLvl[charOff];
                                        // Attribute by the pair's LAST character. Alignment
                                        // sometimes emits one token spanning a sentence break
                                        // ("。AI"), and its visible letters belong to the
                                        // sentence that starts, not the one that ended.
                                        const lastOff = charOff + [...pair.char].length - 1;
                                        charOff += [...pair.char].length;
                                        const segAt = segs.findIndex(sg => sg.end > lastOff);
                                        // Match the playback unit's own numbering, so a tap
                                        // resolves to exactly one unit.
                                        const segIdx = segs.length > 1
                                          ? (segAt === -1 ? segs.length - 1 : segAt)
                                          : WHOLE_ENTRY;
                                        // hide pinyin for a word whose level < this dialogue's level
                                        const hidePy = typeof wl === 'number' && wl < dialogueLevel;
                                        const isPunct = /[，。？！、,.\s]/.test(pair.char);
                                        // Reserve the pinyin row even when pinyin is OFF, so
                                        // toggling it changes what you see and not where the
                                        // characters sit. Rows were 70px apart with it on and
                                        // 47px off — every toggle reflowed the whole dialogue.
                                        const reservePy = !isPunct;
                                        const pyText = (sPinyin && !hidePy && pair.pinyin) ? pair.pinyin : null;
                                        return (
                                          <div
                                            key={`${si}-${ci}`}
                                            className={`dr-char ${sActive && (!narrowHl || segIdx === revealedSeg) ? 'dr-char--active' : ''} ${sPlaying ? 'dr-char--playing' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleSentenceClick(s.id, e.currentTarget, segIdx); }}
                                          >
                                            {/* NBSP, not a plain space: a plain space collapses, the
                                                div gets no line box, and the row loses the pinyin's
                                                height — so lines whose words are all below level
                                                would sit tighter than lines that show pinyin. */}
                                            {reservePy && (pyText
                                              ? <div className="dr-char-py">{pyText}</div>
                                              : <div className="dr-char-py dr-char-py--empty">{'\u00A0'}</div>)}
                                            <div className="dr-char-zh">{pair.char}</div>
                                          </div>
                                        );
                                      });
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                  )}
                </div>

                {/* Focus mode: same FAB, same placement as the Dialog tab, but it
                    plays the CURRENT line (the inline play button between the old
                    ‹ › arrows is gone). */}
                {focusMode && activeSentence && (
                  <button
                    className="story__play-fab"
                    onClick={() => playSentence(activeSentence)}
                    type="button"
                    aria-label={sentenceAudio.isPlaying(activeSentence.id)
                      ? ({ uz: 'Toxtatish', ru: 'Пауза', en: 'Pause' } as Record<string, string>)[language]
                      : ({ uz: 'Tinglash', ru: 'Слушать', en: 'Play' } as Record<string, string>)[language]}
                  >
                    {sentenceAudio.isPlaying(activeSentence.id)
                      ? <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      : <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>}
                  </button>
                )}

                {!focusMode && (dialogue.audio_url || ttsPlayable) && (
                  <button className={`story__play-fab ${isAudioLoading ? 'story__play-fab--loading' : ''}`} onClick={dialogue.audio_url ? handlePlay : handlePlayAll} type="button" aria-label={isAudioLoading ? ({ uz: 'Yuklanmoqda', ru: 'Загрузка', en: 'Loading' } as Record<string, string>)[language] : isPlaying ? ({ uz: 'Toxtatish', ru: 'Пауза', en: 'Pause' } as Record<string, string>)[language] : ({ uz: 'Tinglash', ru: 'Слушать', en: 'Play' } as Record<string, string>)[language]}>
                    {isAudioLoading ? <span className="story__play-fab-spinner" /> :
                      isPlaying
                        ? <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        : <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>}
                  </button>
                )}

                {/* Tarjima / Fokus / Pinyin bottom bar — unchanged */}
                {(
                  <>
                    {sheetOpen && <div className="dr-scrim" onClick={() => setSheetOpen(false)} />}
                    <div className={`dr-ctl dr-ctl--dots${sheetOpen ? ' dr-ctl--open' : ''}`}>
                      <div className="dr-ctl__body">
                        {/* The hamburger held the only language switch inside the
                            reader, and it went with the hero — so it lives here now. */}
                        <div className="dr-ctl__row">
                          <span>{({ uz: 'Til', ru: 'Язык', en: 'Language' } as Record<string, string>)[language]}</span>
                          <span>
                            {(['uz', 'ru', 'en'] as const).map(code => (
                              <button
                                key={code}
                                className={`dr-ctl__sz${language === code ? ' dr-ctl__sz--on' : ''}`}
                                onClick={() => setLanguage(code)}
                                type="button"
                                aria-pressed={language === code}
                              >{code.toUpperCase()}</button>
                            ))}
                          </span>
                        </div>
                        <div className="dr-ctl__sep" />
                        <button className={`dr-ctl__item${showTranslation ? ' is-on' : ''}${focusMode ? ' is-disabled' : ''}`} onClick={() => setShowTranslation(v => !v)} type="button" aria-pressed={showTranslation} disabled={focusMode}>
                          <span>{({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language]}</span><i className="dr-sw" aria-hidden="true" />
                        </button>
                        <button className={`dr-ctl__item${showPinyin ? ' is-on' : ''}`} onClick={() => setShowPinyin(v => !v)} type="button" aria-pressed={showPinyin}>
                          <span>Pinyin</span><i className="dr-sw" aria-hidden="true" />
                        </button>
                        <button className={`dr-ctl__item${focusMode ? ' is-on' : ''}`} onClick={toggleFocusMode} type="button" aria-pressed={focusMode}>
                          <span>{({ uz: 'Fokus', ru: 'Фокус', en: 'Focus' } as Record<string, string>)[language]}</span><i className="dr-sw" aria-hidden="true" />
                        </button>
                        <div className="dr-ctl__sep" />
                        <div className="dr-ctl__row">
                          <span>{({ uz: 'Shrift', ru: 'Шрифт', en: 'Text size' } as Record<string, string>)[language]}</span>
                          <span>
                            <button className="dr-ctl__sz" onClick={() => setFontSize(s => Math.max(s - 10, 80))} type="button">A−</button>
                            <button className="dr-ctl__sz" onClick={() => setFontSize(s => Math.min(s + 10, 150))} type="button">A+</button>
                          </span>
                        </div>
                        <div className="dr-ctl__sep" />
                        {/* Same destination as the hero's ‹ — a second way out for
                            anyone already in this menu at the bottom of the screen,
                            rather than reaching back up to the top corner. */}
                        <Link
                          href={listPath || `${bookPath}/dialogues`}
                          className="dr-ctl__item dr-ctl__exit"
                          onClick={() => setSheetOpen(false)}
                        >
                          <span>{({ uz: 'Chiqish', ru: 'Выйти', en: 'Exit' } as Record<string, string>)[language]}</span>
                          <svg className="dr-ctl__exit-icon" viewBox="0 0 100 100" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="m67.188 83.328v6.7812c0 2.9219-1.7656 5.2031-4.0312 5.2031h-54.438c-2.2656 0-4.0312-2.2812-4.0312-5.2031v-80.219c0-2.9219 1.7656-5.2031 4.0312-5.2031h54.438c2.2656 0 4.0312 2.2812 4.0312 5.2031v6.7812c0 0.86328-0.69922 1.5625-1.5625 1.5625s-1.5625-0.69922-1.5625-1.5625v-6.7812c0-1.2969-0.64062-2.0781-0.90625-2.0781h-54.438c-0.26562 0-0.90625 0.78125-0.90625 2.0781v80.219c0 1.2969 0.64062 2.0781 0.90625 2.0781h54.438c0.26562 0 0.90625-0.78125 0.90625-2.0781v-6.7812c0-0.86328 0.69922-1.5625 1.5625-1.5625s1.5625 0.69922 1.5625 1.5625zm28.125-33.328c0 0.46484-0.20703 0.90625-0.5625 1.2031l-14.062 11.578-14.062 11.562c-0.28125 0.23438-0.63672 0.35938-1 0.35938-0.22656 0-0.45312-0.050781-0.65625-0.15625-0.54688-0.25391-0.90234-0.80078-0.90625-1.4062v-10.156h-25.562c-0.86328 0-1.5625-0.69922-1.5625-1.5625v-22.844c0-0.86328 0.69922-1.5625 1.5625-1.5625h25.656v-10.156c0.003906-0.60547 0.35938-1.1523 0.90625-1.4062 0.54688-0.25781 1.1914-0.17969 1.6562 0.20312l28.031 23.141c0.35547 0.29688 0.5625 0.73828 0.5625 1.2031zm-4.0156 0-24.016-19.828v8.4062c0 0.41406-0.16406 0.8125-0.45703 1.1055-0.29297 0.29297-0.69141 0.45703-1.1055 0.45703h-25.656v19.719h25.656c0.41406 0 0.8125 0.16406 1.1055 0.45703 0.29297 0.29297 0.45703 0.69141 0.45703 1.1055v8.4062z"/></svg>
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── SO'ZLAR TAB ── */}
            {activeTab === 'vocab' && (
              <div className="dr-panel">
                {vocabList.length === 0 && !dialogue.phrases?.length && !dialogue.timeOfDay?.length ? (
                  <div className="dr-empty">
                    <div className="dr-empty__icon">📖</div>
                    <div>{({ uz: 'So\'zlar topilmadi', ru: 'Слова не найдены', en: 'No words found' } as Record<string, string>)[language]}</div>
                  </div>
                ) : (
                  <>
                    {vocabList.length > 0 && <DialogueVocab words={vocabList} language={language} />}


                    {dialogue.phrases && dialogue.phrases.length > 0 && (
                      <div className="dr-card">
                        <div className="dr-label">{({ uz: 'Foydali iboralar', ru: 'Полезные фразы', en: 'Useful Phrases' } as Record<string, string>)[language]}</div>
                        <div className="dr-phrases-grid">
                          {dialogue.phrases.map((p, i) => (
                            <div key={i} className="dr-phrase-card">
                              <div className="dr-phrase-zh">{p.zh}</div>
                              <div className="dr-phrase-py">{p.py}</div>
                              <div className="dr-phrase-tr">{language === 'ru' ? p.ru : language === 'en' ? (p.en || p.uz) : p.uz}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dialogue.timeOfDay && dialogue.timeOfDay.length > 0 && (
                      <div className="dr-card">
                        <div className="dr-label">{({ uz: 'Kun vaqtlari', ru: 'Время суток', en: 'Times of Day' } as Record<string, string>)[language]}</div>
                        <div className="dr-tod-row">
                          {dialogue.timeOfDay.map((t, i) => (
                            <div key={i} className="dr-tod-item">
                              <div className="dr-tod-icon">{t.icon}</div>
                              <div className="dr-tod-zh">{t.zh}</div>
                              <div className="dr-tod-py">{t.py}</div>
                              <div className="dr-tod-tr">{language === 'ru' ? t.ru : language === 'en' ? (t.en || t.uz) : t.uz}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── GRAMMATIKA TAB ── */}
            {activeTab === 'dictation' && (
              <div className="dr-panel">
                <DialogueDictation lines={dictationLines} language={language} level={meta.level} pinyinTiles={meta.dictationPinyin} keyboard={meta.dictationKeyboard} />
              </div>
            )}

            {/* ── PRACTICE TAB ── */}
            {activeTab === 'practice' && (
              <div className="dr-panel">
                {rolePlayLines.length >= 2 ? (
                  <DialogueRolePlay
                    lines={rolePlayLines}
                    dialogueId={dialogue.id}
                    accentColor="#dc2626"
                    language={language}
                    voices={meta.voices}
                    onComplete={(stars) => saveDialogueStars(dialogue.id, stars)}
                  />
                ) : (
                  <div className="dr-empty">
                    <div className="dr-empty__icon">🚧</div>
                    <div>{({ uz: 'Tez kunda', ru: 'Скоро будет', en: 'Coming soon' } as Record<string, string>)[language]}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
      <CoachMarkTour
        tourId="dialogue-tour"
        lang={language}
        steps={[
          { tipId: 'tour-tap', targetRef: firstLineRef, text: { uz: "Audioni eshitish uchun gapni bosing", ru: "Нажмите на предложение чтобы услышать аудио", en: "Tap any sentence to hear audio" } },
          { tipId: 'tour-more', targetRef: moreBtnRef, forceAbove: true, text: { uz: "Tarjima, pinyin, fokus va shrift — shu yerda", ru: "Перевод, пиньинь, фокус и шрифт — здесь", en: "Translation, pinyin, focus and text size live here" } },
        ] as TourStep[]}
      />
      <PageFooter />
    </>
  );
}
