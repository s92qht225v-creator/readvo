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
  /** [start, end) char ranges per word, from the same server-side segmentation
   *  as charLvls. Drives long-press lookup so pressing 白 selects 白天. */
  wordSpans?: [number, number][];
}

/** Bundled word glosses for long-press lookup — see lib/dialogueGlosses.ts.
 *  Shipped with the dialogue so a press costs no network. */
interface Gloss {
  py: string;
  uz: string;
  ru: string;
  en: string;
  hsk: number | null;
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
  glosses?: Record<string, Gloss>;
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
}

// ── Main component ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'dialog', uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  { id: 'vocab', uz: 'So\'zlar', ru: 'Слова', en: 'Words' },
  { id: 'dictation', uz: 'Diktant', ru: 'Диктант', en: 'Dictation' },
  { id: 'practice', uz: 'Mashq', ru: 'Практика', en: 'Practice' },
];


export function DialogueReader({ meta, bookPath, listPath, preview }: DialogueReaderProps) {
  const { getAccessToken, user, isLoading: authLoading } = useAuth();
  const [language] = useLanguage();

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

  // Font size
  const [fontSize, setFontSize] = useState(100);

  // Tab state
  const [activeTab, setActiveTab] = useState('dialog');

  // Dialog tab state
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
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
  const translationBtnRef = useRef<HTMLButtonElement | null>(null);
  const focusBtnRef = useRef<HTMLButtonElement | null>(null);
  const pinyinBtnRef = useRef<HTMLButtonElement | null>(null);
  const fontControlsRef = useRef<HTMLDivElement | null>(null);
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
        const res = await fetch(`/api/content/dialogue/${meta.book}/${meta.slug}`, {
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

  // Per-sentence MiMo TTS fallback. Dialogues without recorded audio (e.g.
  // HSK 2) have no `audio_url`; we resolve a playable URL from /api/tts
  // (Supabase-cached, generated once) for each such sentence. Prefetching
  // on mount warms the cache so a tap plays instantly inside the user
  // gesture; a tap before the prefetch lands falls back to async resolve.
  const [ttsUrls, setTtsUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const missing = allSentences.filter(s => !s.audio_url && s.text_original?.trim());
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const s of missing) {
        const url = await resolveTtsUrl(s.text_original, voiceFor(s));
        if (cancelled) return;
        if (url) setTtsUrls(prev => (prev[s.id] ? prev : { ...prev, [s.id]: url }));
      }
    })();
    return () => { cancelled = true; };
  }, [allSentences]);

  // Whether the bottom-right "play all" FAB should drive a TTS sequence
  // (no single recorded file to play, but sentences are TTS-playable).
  const ttsPlayable = useMemo(
    () => !dialogue?.audio_url && allSentences.some(s => !!s.text_original?.trim()),
    [dialogue, allSentences],
  );

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
    const s = allSentences[idx];
    // End of dialogue (or every sentence skipped because TTS couldn't
    // resolve) — clear ALL playback state, including the loading spinner,
    // so the FAB never gets stuck mid-load.
    if (!s) { seqActiveRef.current = false; setIsPlaying(false); setIsAudioLoading(false); setAudioActive(false); setActiveSentenceId(null); return; }
    seqIdxRef.current = idx;
    setActiveSentenceId(s.id);
    const url = s.audio_url ?? ttsUrls[s.id] ?? await resolveTtsUrl(s.text_original, voiceFor(s));
    if (!seqActiveRef.current) return;
    const a = seqAudioRef.current;
    if (!a) return;
    if (!url) { void playSeqFrom(idx + 1); return; } // skip un-resolvable sentence
    a.onended = () => { if (seqActiveRef.current) void playSeqFrom(seqIdxRef.current + 1); };
    a.src = url;
    try { await a.play(); setIsAudioLoading(false); setIsPlaying(true); }
    catch { /* autoplay rejected — leave state as-is */ }
  }, [allSentences, ttsUrls]);

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
  // Long-press word lookup. Declared up here (not beside its handlers below)
  // because toggleFocus and the tab buttons clear it, and those are defined
  // first. `sid` + span let the pressed word be highlighted in place.
  const [lookup, setLookup] = useState<{ zh: string; gloss: Gloss; sid: string; a: number; b: number } | null>(null);

  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [prevDisplayId, setPrevDisplayId] = useState<string | null>(displaySentenceId);
  if (displaySentenceId !== prevDisplayId) {
    setPrevDisplayId(displaySentenceId);
    if (displaySentenceId) setRevealedId(displaySentenceId);
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
    setLookup(null);   // the lookup belongs to the line you pressed in Dialog view
  }, [focusMode, isPlaying, activeSentenceId, allSentences, sentenceAudio, playSentence]);

  const handleSentenceClick = useCallback((id: string) => {
    dismissTip('dialogue-tour');
    setActiveSentenceId(prev => focusMode ? id : prev === id ? null : id);
    const sentence = allSentences.find(s => s.id === id);
    playSentence(sentence);
  }, [focusMode, allSentences, playSentence]);

  // ── Long-press word lookup ────────────────────────────────────────────────
  // Press and hold a character → the panel above the dialogue shows that WORD's
  // pinyin + meaning. Deliberately a long press, not a tap: tap already plays
  // the line, and that behaviour predates this feature.
  // The tab bar is itself sticky at top:0, so the lookup panel has to stick just
  // BELOW it. Measured rather than hardcoded — the bar's height moves with the
  // A+/A- font control and with longer tab labels in RU/EN.
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [tabsH, setTabsH] = useState(46);
  useEffect(() => {
    const el = tabsRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setTabsH(el.offsetHeight));
    ro.observe(el);
    setTabsH(el.offsetHeight);
    return () => ro.disconnect();
  }, [status]);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  // Set when a long press fires, so the click that follows the release doesn't
  // also play the line — pressing a word must not start audio.
  const pressFired = useRef(false);

  const glosses = dialogue?.glosses;

  const openLookup = useCallback((s: Sentence, idx: number) => {
    const span = (s.wordSpans ?? []).find(([a, b]) => idx >= a && idx < b);
    if (!span) return;
    const word = [...s.text_original].slice(span[0], span[1]).join('');
    if (!word) return;
    // Longest-first fallback: 晚上好 has no entry of its own but 晚上 does, so the
    // panel shows something useful instead of going blank.
    const candidates = [word];
    for (let len = word.length - 1; len >= 1; len--) candidates.push(word.slice(0, len));
    for (const c of candidates) {
      const g = glosses?.[c];
      if (g && (g.uz || g.ru || g.en)) {
        pressFired.current = true;
        setLookup({ zh: c, gloss: g, sid: s.id, a: span[0], b: span[1] });
        if (navigator.vibrate) navigator.vibrate(10);
        return;
      }
    }
  }, [glosses]);

  const onCharPointerDown = useCallback((e: React.PointerEvent, s: Sentence, idx: number) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pressOrigin.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(() => openLookup(s, idx), 450);
  }, [openLookup]);

  // Release ends the lookup — it's a peek, not a dialog. Holding shows the
  // meaning, letting go puts it away, so there's nothing to dismiss afterwards.
  const cancelPress = useCallback(() => {
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
    pressOrigin.current = null;
    setLookup(null);
  }, []);

  // Scrolling must never trigger a lookup: any real finger movement cancels the
  // timer. 10px matches the drag threshold used by the dictation tiles.
  const onCharPointerMove = useCallback((e: React.PointerEvent) => {
    const o = pressOrigin.current;
    if (!o) return;
    if (Math.abs(e.clientX - o.x) > 10 || Math.abs(e.clientY - o.y) > 10) cancelPress();
  }, [cancelPress]);

  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current); }, []);

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
      <div className="dialogue-reader" style={{ fontSize: `${fontSize}%` }}>

        {/* ── Classic banner hero — same across the app ── */}
        <div className="dr-hero">
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
            <div className="dr-tabs" ref={tabsRef}>
              <div className="dr-tabs__inner">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    className={`dr-tabs__tab ${activeTab === t.id ? 'dr-tabs__tab--active' : ''}`}
                    onClick={() => {
                      setActiveTab(t.id);
                      setLookup(null);
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
              </div>
            </div>

            {/* ── DIALOG TAB ── */}
            {activeTab === 'dialog' && (
              <>
                <div className={`dr-dialog-body ${audioActive ? 'dr-dialog-body--with-audio' : ''}`}>
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
                          {showTranslation && (
                            <div className="story__focus-translation">{language === 'ru' ? activeSentence.text_translation_ru : language === 'en' ? (activeSentence.text_translation_en || activeSentence.text_translation) : activeSentence.text_translation}</div>
                          )}
                        </div>
                      </div>
                      <span className="story__focus-counter">{allSentences.findIndex(s => s.id === displaySentenceId) + 1} / {allSentences.length}</span>
                    </div>
                  ) : (
                  <>
                    {/* Word-lookup panel. Always mounted, empty until you press a
                        word — mounting it on demand would push the dialogue down
                        and move the text out from under your finger. */}
                    <div
                      className={`dr-wordpanel${lookup ? ' dr-wordpanel--on' : ''}`}
                      style={{ top: tabsH }}
                      aria-live="polite"
                    >
                      {lookup && (
                        <>
                          <span className="dr-wordpanel__zh" lang="zh-Hans">{lookup.zh}</span>
                          <span className="dr-wordpanel__py">{lookup.gloss.py}</span>
                          <span className="dr-wordpanel__mean">
                            {(language === 'ru' ? lookup.gloss.ru : language === 'en' ? lookup.gloss.en : lookup.gloss.uz)
                              || lookup.gloss.en || lookup.gloss.uz}
                          </span>
                          {lookup.gloss.hsk != null && (
                            <span className="dr-wordpanel__hsk">HSK {lookup.gloss.hsk >= 7 ? '7–9' : lookup.gloss.hsk}</span>
                          )}
                        </>
                      )}
                    </div>
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
                                      let charOff = 0;
                                      return pairs.map((pair, ci) => {
                                        const wl = charLvl[charOff];
                                        const cIdx = charOff;          // this char's index in text_original
                                        charOff += [...pair.char].length;
                                        const inLookup = !!lookup && lookup.sid === s.id && cIdx >= lookup.a && cIdx < lookup.b;
                                        // hide pinyin for a word whose level < this dialogue's level
                                        const hidePy = typeof wl === 'number' && wl < dialogueLevel;
                                        const isPunct = /[，。？！、,.\s]/.test(pair.char);
                                        const reservePy = sPinyin && !isPunct;
                                        const pyText = (!hidePy && pair.pinyin) ? pair.pinyin : null;
                                        return (
                                          <div
                                            key={`${si}-${ci}`}
                                            className={`dr-char ${sActive ? 'dr-char--active' : ''} ${sPlaying ? 'dr-char--playing' : ''} ${inLookup ? 'dr-char--lookup' : ''}`}
                                            onPointerDown={(e) => onCharPointerDown(e, s, cIdx)}
                                            onPointerMove={onCharPointerMove}
                                            onPointerUp={cancelPress}
                                            onPointerCancel={cancelPress}
                                            onPointerLeave={cancelPress}
                                            onContextMenu={(e) => e.preventDefault()}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // A long press already opened the panel — don't also play the line.
                                              if (pressFired.current) { pressFired.current = false; return; }
                                              handleSentenceClick(s.id);
                                            }}
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
                                {showTranslation && (() => {
                                  // Tap-to-reveal: show only the active line's
                                  // translation, one at a time (matches the
                                  // Arabic reader). Tapping another line moves
                                  // the reveal; re-tapping the same line hides it.
                                  const active = group.find(s => s.id === revealedId);
                                  if (!active) return null;
                                  const tr = language === 'ru' ? active.text_translation_ru : language === 'en' ? (active.text_translation_en || active.text_translation) : active.text_translation;
                                  return <div className="dr-line-tr">{tr}</div>;
                                })()}
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
                <nav className="story__bottom-bar">
                  <div className="story__bottom-bar-inner">
                    <button ref={focusBtnRef} className={`reader__nav-toggle ${focusMode ? 'reader__nav-toggle--active' : ''}`} onClick={toggleFocusMode} type="button" aria-pressed={focusMode}>
                      {({ uz: 'Fokus', ru: 'Фокус', en: 'Focus' } as Record<string, string>)[language]}
                    </button>
                    <button ref={translationBtnRef} className={`reader__nav-toggle ${showTranslation ? 'reader__nav-toggle--active' : ''}`} onClick={() => setShowTranslation(v => !v)} type="button" aria-pressed={showTranslation}>
                      {({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language]}
                    </button>
                    <button ref={pinyinBtnRef} className={`reader__nav-toggle ${showPinyin ? 'reader__nav-toggle--active' : ''}`} onClick={() => setShowPinyin(v => !v)} type="button" aria-pressed={showPinyin}>
                      Pinyin
                    </button>
                  </div>
                </nav>

                <div ref={fontControlsRef} className={`dr-font-controls${fontActive ? ' dr-font-controls--active' : ''}${fontEngaged && !fontActive ? ' dr-font-controls--idle' : ''}`}>
                  <button className="dr-font-btn" onClick={() => { setFontSize(s => Math.min(s + 10, 150)); flashFont(); }} type="button">A+</button>
                  <div className="dr-font-divider" />
                  <button className="dr-font-btn" onClick={() => { setFontSize(s => Math.max(s - 10, 80)); flashFont(); }} type="button">A-</button>
                </div>
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
          { tipId: 'tour-focus', targetRef: focusBtnRef, forceAbove: true, text: { uz: "Fokus rejimi — bir vaqtda bir gap ko'rsatadi", ru: "Режим фокуса — показывает по одному предложению", en: "Focus mode shows one sentence at a time" } },
          { tipId: 'tour-translation', targetRef: translationBtnRef, forceAbove: true, text: { uz: "Tarjimani ko'rish uchun bosing", ru: "Нажмите, чтобы увидеть перевод", en: "Toggle translation to see the meaning" } },
          { tipId: 'tour-pinyin', targetRef: pinyinBtnRef, forceAbove: true, text: { uz: "Pinyinni yoqish yoki o'chirish", ru: "Нажмите чтобы вкл/выкл пиньинь", en: "Toggle pinyin on or off" } },
          { tipId: 'tour-font', targetRef: fontControlsRef, text: { uz: "Shrift o'lchamini o'zgartirish", ru: "Нажмите чтобы изменить размер шрифта", en: "Change font size" } },
        ] as TourStep[]}
      />
      <PageFooter />
    </>
  );
}
