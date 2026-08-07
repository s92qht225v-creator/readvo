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

/**
 * Icons for the two tabs that have one. Same trade the main page makes on
 * mobile: an inactive tab shows only its icon, the active one only its label.
 * All four tabs have one.
 *
 * Dialog and Diktant reuse the catalog's own dialogue and Yozish glyphs, so
 * one idea keeps one shape across the app. So'zlar and Mashq are Noun Project
 * icons; their embedded credit <text> is stripped and the viewBox trimmed to
 * the glyph, since that text only existed to fill the space below it.
 */
const TAB_ICONS: Record<string, React.ReactNode> = {
  dialog: (
    <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d="M16.003 0.6c-4.118 0-7.979 1.595-10.895 4.51-5.582 5.582-6.013 14.465-1.113 20.541l0.246 0.305-0.18 0.348c-0.674 1.3-1.531 2.253-2.574 2.77v0.002h-0.002c-0.434 0.213-0.67 0.672-0.598 1.148 0.073 0.484 0.43 0.843 0.918 0.922h0.002c0.379 0.060 0.785 0.092 1.205 0.092 1.084 0 3.143-0.215 5.203-1.58l0.297-0.197 0.316 0.166c2.2 1.163 4.67 1.775 7.174 1.775 4.118 0 7.978-1.601 10.887-4.51s4.51-6.77 4.51-10.887-1.601-7.98-4.51-10.889c-2.916-2.922-6.769-4.516-10.887-4.516zM16.003 1.633c3.835 0 7.444 1.498 10.154 4.209s4.207 6.318 4.207 10.152c0 3.828-1.496 7.443-4.207 10.154s-6.32 4.209-10.154 4.209c-2.564 0-5.075-0.682-7.271-1.973v-0.002h-0.002c-0.082-0.049-0.169-0.072-0.262-0.072-0.114 0-0.222 0.036-0.316 0.109h-0.002c-1.621 1.256-3.305 1.645-4.453 1.744l-1.789 0.154 1.338-1.199c0.81-0.726 1.513-1.746 2.088-3.059v-0.002c0.082-0.187 0.051-0.393-0.086-0.545l-0.004-0.004c-5.017-5.664-4.751-14.311 0.607-19.668 2.711-2.71 6.318-4.209 10.152-4.209zM9.378 10.928c-0.296 0-0.525 0.229-0.525 0.525s0.228 0.523 0.525 0.523h13.252c0.298 0 0.523-0.226 0.523-0.523s-0.227-0.525-0.523-0.525zM9.378 15.471c-0.298 0-0.525 0.227-0.525 0.523s0.224 0.518 0.525 0.518h13.252c0.297 0 0.523-0.231 0.523-0.518s-0.23-0.523-0.523-0.523zM9.378 20.012c-0.296 0-0.525 0.229-0.525 0.525 0 0.286 0.229 0.518 0.525 0.518h13.252c0.297 0 0.523-0.231 0.523-0.518 0-0.298-0.227-0.525-0.523-0.525z"/></svg>
  ),
  vocab: (
    <svg viewBox="-5 -10 110 110" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="m89.434 78.391-16.668-41.668c-0.625-1.582-3.2383-1.582-3.8672 0l-16.668 41.668c-0.42969 1.0664 0.089843 2.2773 1.1641 2.7031 1.0547 0.42578 2.2773-0.089844 2.7031-1.1602l4.4766-11.191h20.516l4.4766 11.191c0.32422 0.82031 1.1094 1.3164 1.9336 1.3164 0.25781 0 0.51953-0.050781 0.77344-0.14844 1.0664-0.42969 1.5859-1.6445 1.1602-2.7109zm-10.266-13.809h-16.668c-0.10156 0-0.18359 0.042969-0.27734 0.058594l8.6094-21.531 8.6133 21.527c-0.09375-0.011719-0.17969-0.054688-0.27734-0.054688zm-32.312-1.8516c-2.6328-1.4844-6.5469-3.9531-10.449-7.375 5.793-5.9609 10.746-13.988 11.371-24.105h6.3906c1.1484 0 2.082-0.93359 2.082-2.082 0-1.1523-0.93359-2.0859-2.082-2.0859h-18.75v-6.25c0-1.1484-0.93359-2.082-2.082-2.082-1.1523 0-2.0859 0.93359-2.0859 2.082v6.25h-18.75c-1.1484 0-2.082 0.93359-2.082 2.0859 0 1.1484 0.93359 2.082 2.082 2.082h6.3672c0.62891 10.059 5.6719 18.074 11.441 24.035-7.0742 6.1992-14.32 9.4102-14.461 9.4727-1.0547 0.44922-1.5469 1.6758-1.0898 2.7344 0.33203 0.78516 1.1055 1.2578 1.9102 1.2578 0.26953 0 0.55078-0.054688 0.81641-0.16797 0.62891-0.26953 8.3789-3.6797 15.902-10.336 4.2617 3.7773 8.543 6.4961 11.422 8.1133 0.32422 0.18359 0.67578 0.26562 1.0195 0.26562 0.73047 0 1.4375-0.38281 1.8164-1.0625 0.56641-1 0.21094-2.2734-0.78906-2.832zm-3.2578-31.48c-0.63281 8.7383-5.0742 15.809-10.277 21.16-5.1719-5.332-9.6523-12.406-10.281-21.16z" />
    </svg>
  ),
  practice: (
    <svg viewBox="-5 -10 110 110" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="m30.117 48.258c-1.1055 0.003907-2 0.89844-2 2 0.003906 5.457 2.0469 10.711 5.7266 14.742 3.6758 4.0273 8.7266 6.5391 14.156 7.043v5.957h-8c-1.1055 0-2 0.89453-2 2s0.89453 2 2 2h20c1.1055 0 2-0.89453 2-2s-0.89453-2-2-2h-8v-5.957c5.4297-0.50391 10.48-3.0156 14.156-7.043 3.6797-4.0312 5.7227-9.2852 5.7266-14.742 0-1.1016-0.89453-2-2-2-1.1016 0-2 0.89844-2 2 0 6.3906-3.4062 12.297-8.9414 15.492-5.5312 3.1914-12.352 3.1914-17.883 0-5.5352-3.1953-8.9414-9.1016-8.9414-15.492-0.003907-1.1016-0.89844-1.9961-2-2z" />
      <path d="m49.566 65.227h0.86719c3.8516-0.003906 7.5469-1.5352 10.273-4.2617 2.7266-2.7266 4.2578-6.418 4.2617-10.273v-18.156c-0.003906-3.8516-1.5352-7.5469-4.2617-10.273-2.7266-2.7266-6.4219-4.2578-10.273-4.2617h-0.86719c-3.8516 0.003906-7.5469 1.5352-10.273 4.2617-2.7266 2.7266-4.2578 6.4219-4.2617 10.273v18.156c0.003906 3.8555 1.5352 7.5469 4.2617 10.273 2.7266 2.7266 6.4219 4.2578 10.273 4.2617zm-10.535-32.691c0.007812-5.8164 4.7188-10.527 10.535-10.535h0.86719c5.8164 0.007812 10.527 4.7188 10.535 10.535v18.156c-0.007812 5.8164-4.7188 10.531-10.535 10.535h-0.86719c-5.8164-0.003906-10.527-4.7188-10.535-10.535z" />
    </svg>
  ),
  dictation: (
    <svg viewBox="0 0 100 100" width="21" height="21" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m88.387 4.2852c-1.9102-0.003906-3.8164 0.71484-5.2617 2.1641l-4.2617 4.2539-2.2305-2.2305c-1.9375-1.9375-4.4883-2.9141-7.043-2.9141-2.5547 0-5.1055 0.97266-7.0469 2.9141l-22.223 22.219c-0.26953 0.26953-0.42187 0.63281-0.42187 1.0156 0 0.37891 0.15234 0.74219 0.42187 1.0117 0.26953 0.26953 0.63281 0.42188 1.0117 0.42188 0.38281 0 0.74609-0.15234 1.0156-0.42188l22.219-22.234c2.6055-2.6055 6.6914-2.7734 9.4883-0.50391-0.41406 0.19922-0.80469 0.46875-1.1484 0.80859l-59.605 59.609c-0.14453 0.14844-0.25391 0.32422-0.32422 0.51562l-8.5117 22.875c-0.19531 0.52344-0.066406 1.1133 0.32812 1.5078s0.98438 0.52344 1.5078 0.32812l22.871-8.5117c0.19141-0.074219 0.36328-0.18359 0.50781-0.32812l59.617-59.613c1.6289-1.6289 1.6523-4.2891 0.082031-5.9531l4.2539-4.2539c2.6133-2.5898 2.5391-6.5625 0.45313-9.4688l-0.003907-0.003906c0.003907-0.38281-0.14844-0.75391-0.42188-1.0234v-0.003906-0.003906c-1.4492-1.4492-3.3633-2.1719-5.2734-2.1719zm0 2.8359c1.1719 0.003906 2.3438 0.45312 3.25 1.3594 1.793 1.8086 1.7852 4.6758-0.011719 6.4531l0.003906 0.003906h-0.011718l-4.2539 4.2539-6.4688-6.4688 4.2617-4.25h-0.003906v-0.003906-0.003906-0.003906c0.89844-0.89844 2.0664-1.3398 3.2383-1.3398zm-12.453 5.2695c0.35938 0 0.71875 0.14062 1 0.42578l10.336 10.336c0.56641 0.56641 0.56641 1.4375 0 2.0039l-58.594 58.594-12.34-12.336 58.598-58.598c0.28125-0.28125 0.64062-0.42578 1-0.42578zm-61.055 61.605 11.211 11.211-17.859 6.6367z"/></svg>
  ),
};

const TABS = [
  { id: 'dialog', uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  { id: 'vocab', uz: 'So\'zlar', ru: 'Слова', en: 'Words' },
  { id: 'dictation', uz: 'Diktant', ru: 'Диктант', en: 'Dictation' },
  { id: 'practice', uz: 'Mashq', ru: 'Практика', en: 'Practice' },
];


export function DialogueReader({ meta, bookPath, listPath, preview, contentPath }: DialogueReaderProps) {
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
            <div className="dr-tabs">
              <div className="dr-tabs__inner">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    className={`dr-tabs__tab ${TAB_ICONS[t.id] ? 'dr-tabs__tab--icon' : ''} ${activeTab === t.id ? 'dr-tabs__tab--active' : ''}`}
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
                    {TAB_ICONS[t.id] && <span className="dr-tabs__icon">{TAB_ICONS[t.id]}</span>}
                    <span className="dr-tabs__label">{(t as Record<string, string>)[language] ?? t.uz}</span>
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
                    {/* Tapped line's translation, pinned at the top. Only
                        possible now the tab bar moved to the bottom — nothing
                        is pinned above it any more.

                        Rendered only when there is a translation to show, not
                        for as long as Tarjima is on: an empty white band
                        sitting under the hero is just a bar-shaped hole. */}
                    {showTranslation && (() => {
                      const active = allSentences.find(s => s.id === revealedId);
                      const whole = active ? trOf(active) : '';
                      // An entry holding several sentences translates only the
                      // one that was tapped. splitAligned falls back to the
                      // whole entry when the two sides don't split evenly.
                      const segs = active ? splitAligned(active.text_original, whole) : [];
                      // WHOLE_ENTRY (no single sentence selected) falls through
                      // to the entry's full translation.
                      const tr = (segs.length && revealedSeg !== WHOLE_ENTRY)
                        ? (segs[Math.min(revealedSeg, segs.length - 1)]?.tr || whole)
                        : whole;
                      if (!tr) return null;
                      return (
                        <div className="dr-trbar" ref={trBarRef} aria-live="polite">
                          <p className="dr-trbar__text">{tr}</p>
                        </div>
                      );
                    })()}
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
                                        const reservePy = sPinyin && !isPunct;
                                        const pyText = (!hidePy && pair.pinyin) ? pair.pinyin : null;
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
                        <button className={`dr-ctl__item${showTranslation ? ' is-on' : ''}`} onClick={() => setShowTranslation(v => !v)} type="button" aria-pressed={showTranslation}>
                          <span>{({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language]}</span><b>✓</b>
                        </button>
                        <button className={`dr-ctl__item${showPinyin ? ' is-on' : ''}`} onClick={() => setShowPinyin(v => !v)} type="button" aria-pressed={showPinyin}>
                          <span>Pinyin</span><b>✓</b>
                        </button>
                        <button className={`dr-ctl__item${focusMode ? ' is-on' : ''}`} onClick={toggleFocusMode} type="button" aria-pressed={focusMode}>
                          <span>{({ uz: 'Fokus', ru: 'Фокус', en: 'Focus' } as Record<string, string>)[language]}</span><b>✓</b>
                        </button>
                        <div className="dr-ctl__sep" />
                        <div className="dr-ctl__row">
                          <span>{({ uz: 'Shrift', ru: 'Шрифт', en: 'Text size' } as Record<string, string>)[language]}</span>
                          <span>
                            <button className="dr-ctl__sz" onClick={() => setFontSize(s => Math.max(s - 10, 80))} type="button">A−</button>
                            <button className="dr-ctl__sz" onClick={() => setFontSize(s => Math.min(s + 10, 150))} type="button">A+</button>
                          </span>
                        </div>
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
