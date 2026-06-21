'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuth } from '../hooks/useAuth';
import { Paywall } from './Paywall';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { protectAudioUrlSync } from '../lib/audio/token-client';
import { resolveTtsUrl } from '../utils/ttsAudio';
import { RubyText } from './RubyText';
import { alignPinyinToText } from '../utils/rubyText';
import { BannerMenu } from './BannerMenu';
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
}

interface DialogueReaderProps {
  meta: DialogueMeta;
  bookPath: string;
  listPath?: string;
}

// ── Main component ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'dialog', uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  { id: 'vocab', uz: 'So\'zlar', ru: 'Слова', en: 'Words' },
  { id: 'dictation', uz: 'Diktant', ru: 'Диктант', en: 'Dictation' },
  { id: 'practice', uz: 'Mashq', ru: 'Практика', en: 'Practice' },
];

export function DialogueReader({ meta, bookPath, listPath }: DialogueReaderProps) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language] = useLanguage();
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
  const firstLineRef = useRef<HTMLDivElement | null>(null);
  const translationBtnRef = useRef<HTMLButtonElement | null>(null);
  const focusBtnRef = useRef<HTMLButtonElement | null>(null);
  const pinyinBtnRef = useRef<HTMLButtonElement | null>(null);
  const fontControlsRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioActive, setAudioActive] = useState(false);

  // ── Fetch state ────────────────────────────────────────────────────────────
  const [dialogue, setDialogue] = useState<DialogueData | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Wait until auth has resolved before fetching/deciding locked — avoids a
    // spurious Paywall flash if getAccessToken() were transiently null during
    // hydration. Re-runs when authLoading flips false.
    if (authLoading) return;
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
  }, [meta.book, meta.slug, getAccessToken, reloadKey, authLoading]);

  // ── Null-safe derived data (hooks must always run — dialogue may be null) ──

  const allSentences = useMemo(() => (dialogue?.sections ?? []).flatMap(s => s.sentences), [dialogue]);

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
        const url = await resolveTtsUrl(s.text_original);
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
    const url = s.audio_url ?? ttsUrls[s.id] ?? await resolveTtsUrl(s.text_original);
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
    void resolveTtsUrl(s.text_original).then(url => {
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

  const handleSentenceClick = useCallback((id: string) => {
    dismissTip('dialogue-tour');
    setActiveSentenceId(prev => focusMode ? id : prev === id ? null : id);
    const sentence = allSentences.find(s => s.id === id);
    playSentence(sentence);
  }, [focusMode, allSentences, playSentence]);

  const handleFocusNav = useCallback((dir: 'prev' | 'next') => {
    const idx = allSentences.findIndex(s => s.id === displaySentenceId);
    if (idx === -1) return;
    const next = allSentences[dir === 'next' ? idx + 1 : idx - 1];
    if (next) {
      setActiveSentenceId(next.id);
      playSentence(next);
    }
  }, [allSentences, displaySentenceId, playSentence]);

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

  if (authLoading) return <div className="loading-spinner" />;

  return (
    <>
      {status === 'locked' && <Paywall />}
      <div className="dialogue-reader" style={{ fontSize: `${fontSize}%` }}>

        {/* ── Hero banner — always visible, reads from meta ── */}
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

        {/* ── Status: loading / error ── */}
        {status === 'loading' && <div className="loading-spinner" />}
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
              </div>
            </div>

            {/* ── DIALOG TAB ── */}
            {activeTab === 'dialog' && (
              <>
                <div className={`dr-dialog-body ${audioActive ? 'dr-dialog-body--with-audio' : ''}`}>
                  {focusMode && activeSentence ? (
                    <div className="story__focus">
                      <div className="story__text story__focus-text">
                        <div className="story__focus-line">
                          <span className="story__sentence story__sentence--active" onClick={() => handleSentenceClick(activeSentence.id)}>
                            <RubyText text={activeSentence.text_original} pinyin={activeSentence.pinyin} showPinyin={showPinyin} />
                          </span>
                        </div>
                        {showTranslation && (
                          <div className="story__focus-translation">{language === 'ru' ? activeSentence.text_translation_ru : language === 'en' ? (activeSentence.text_translation_en || activeSentence.text_translation) : activeSentence.text_translation}</div>
                        )}
                      </div>
                      <div className="story__focus-nav">
                        <button className="story__focus-nav-btn" onClick={() => handleFocusNav('prev')} disabled={allSentences[0]?.id === displaySentenceId} type="button">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
                        </button>
                        {activeSentence && (
                          <button className="story__focus-play-btn" onClick={() => playSentence(activeSentence)} type="button">
                            {sentenceAudio.isPlaying(activeSentence.id)
                              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                              : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                          </button>
                        )}
                        <button className="story__focus-nav-btn" onClick={() => handleFocusNav('next')} disabled={allSentences[allSentences.length - 1]?.id === displaySentenceId} type="button">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" /></svg>
                        </button>
                      </div>
                      <span className="story__focus-counter">{allSentences.findIndex(s => s.id === displaySentenceId) + 1} / {allSentences.length}</span>
                    </div>
                  ) : (
                    dialogue.sections.map(section => {
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
                              <div key={`${section.id}-g${gi}`} className="dr-line">
                                <div className="dr-line-main">
                                  {speaker && (
                                    <div className="dr-line-speaker">{speaker}:</div>
                                  )}
                                  <div ref={group[0].id === allSentences[0]?.id ? firstLineRef : undefined} className="dr-line-chars">
                                    {group.map((s, si) => {
                                      const pairs = alignPinyinToText(s.text_original, s.pinyin);
                                      const sActive = displaySentenceId === s.id;
                                      const sPlaying = audioSentenceId === s.id;
                                      return pairs.map((pair, ci) => {
                                        const isPunct = /[，。？！、,.\s]/.test(pair.char);
                                        return (
                                          <div
                                            key={`${si}-${ci}`}
                                            className={`dr-char ${sActive ? 'dr-char--active' : ''} ${sPlaying ? 'dr-char--playing' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); handleSentenceClick(s.id); }}
                                          >
                                            {showPinyin && pair.pinyin && (
                                              <div className="dr-char-py">{pair.pinyin}</div>
                                            )}
                                            {showPinyin && !pair.pinyin && !isPunct && (
                                              <div className="dr-char-py dr-char-py--empty"> </div>
                                            )}
                                            <div className="dr-char-zh">{pair.char}</div>
                                          </div>
                                        );
                                      });
                                    })}
                                  </div>
                                </div>
                                {showTranslation && (
                                  <div className="dr-line-tr">
                                    {group.map((s, si) => {
                                      const tr = language === 'ru' ? s.text_translation_ru : language === 'en' ? (s.text_translation_en || s.text_translation) : s.text_translation;
                                      const isActive = displaySentenceId === s.id;
                                      return (
                                        <span key={si} style={isActive ? { color: '#dc2626' } : undefined}>
                                          {si > 0 ? ' ' : ''}{tr}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>

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

                <div ref={fontControlsRef} className="dr-font-controls">
                  <button className="dr-font-btn" onClick={() => setFontSize(s => Math.min(s + 10, 150))} type="button">A+</button>
                  <div className="dr-font-divider" />
                  <button className="dr-font-btn" onClick={() => setFontSize(s => Math.max(s - 10, 80))} type="button">A-</button>
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
                <DialogueDictation lines={dictationLines} language={language} level={meta.level} />
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
