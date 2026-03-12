'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTrial } from '../hooks/useTrial';
import { Paywall } from './Paywall';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { alignPinyinToText } from '../utils/rubyText';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';

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

interface GrammarNote {
  pattern: string;
  title_uz: string;
  title_ru: string;
  title_en?: string;
  desc_uz: string;
  desc_ru: string;
  desc_en?: string;
  formula?: string;
  formula_ru?: string;
  formula_en?: string;
  examples?: { zh: string; py: string; uz: string; ru: string; en?: string }[];
  tip_uz?: string;
  tip_ru?: string;
  tip_en?: string;
  ex?: string;
  expy?: string;
  ex_uz?: string;
  ex_ru?: string;
  ex_en?: string;
}


interface VocabEntry {
  zh: string;
  py: string;
  uz: string;
  ru: string;
  en?: string;
  ex: string;
  expy: string;
  ex_uz: string;
  ex_ru: string;
  ex_en?: string;
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
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  audio_url?: string;
  sections: { id: string; sentences: Sentence[]; audio_url?: string }[];
  vocab?: VocabEntry[];
  phrases?: PhraseEntry[];
  extraVocab?: { zh: string; py: string; uz: string; ru: string; en?: string; icon?: string }[];
  extraVocabSubtitle_uz?: string;
  extraVocabSubtitle_ru?: string;
  extraVocabSubtitle_en?: string;
  timeOfDay?: TimeOfDayEntry[];
  grammarNotes?: GrammarNote[];
}

interface DialogueReaderProps {
  dialogue: DialogueData;
  bookPath: string;
  listPath?: string;
}

// ── Ruby text ──────────────────────────────────────────────────────────────

function RubyChar({ char, py, show }: { char: string; py?: string; show: boolean }) {
  if (py) {
    return (
      <ruby>
        {char}
        <rp>(</rp>
        <rt style={show ? undefined : { visibility: 'hidden' }}>{py}</rt>
        <rp>)</rp>
      </ruby>
    );
  }
  return <span>{char}</span>;
}

function RubyText({ text, pinyin, show }: {
  text: string; pinyin: string; show: boolean;
}) {
  const pairs = alignPinyinToText(text, pinyin);
  return <>{pairs.map((p, i) => <RubyChar key={i} char={p.char} py={p.pinyin} show={show} />)}</>;
}

// ── Main component ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'dialog', uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  { id: 'vocab', uz: 'So\'zlar', ru: 'Слова', en: 'Words' },
  { id: 'grammar', uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' },
];

export function DialogueReader({ dialogue, bookPath, listPath }: DialogueReaderProps) {
  const { isLoading: authLoading } = useRequireAuth();
  const trial = useTrial();
  const [language] = useLanguage();

  // Font size
  const [fontSize, setFontSize] = useState(100);

  // Tab state
  const [activeTab, setActiveTab] = useState('dialog');

  // Dialog tab state (mirrors StoryReader)
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const sentenceAudio = useAudioPlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioActive, setAudioActive] = useState(false);

  // So'zlar tab state
  const [expandedVocab, setExpandedVocab] = useState<number | null>(null);

  // Grammatika tab state
  const [expandedGrammar, setExpandedGrammar] = useState<number | null>(null);

  const allSentences = useMemo(() => dialogue.sections.flatMap(s => s.sentences), [dialogue.sections]);

  const timedSentences = useMemo(
    () => allSentences.filter((s): s is Sentence & { start: number; end: number } => s.start !== undefined && s.end !== undefined),
    [allSentences]
  );
  const hasTimedRef = useRef(timedSentences.length > 0);
  hasTimedRef.current = timedSentences.length > 0;

  const audioSentenceId = useMemo(() => {
    if (!isPlaying || !timedSentences.length) return null;
    return timedSentences.find(s => currentTime >= s.start && currentTime < s.end)?.id ?? null;
  }, [isPlaying, currentTime, timedSentences]);

  useEffect(() => {
    if (focusMode && audioSentenceId) setActiveSentenceId(audioSentenceId);
  }, [focusMode, audioSentenceId]);

  const displaySentenceId = audioSentenceId ?? activeSentenceId;
  const displaySentenceIdRef = useRef(displaySentenceId);
  displaySentenceIdRef.current = displaySentenceId;
  const activeSentence = displaySentenceId ? allSentences.find(s => s.id === displaySentenceId) : null;

  const toggleFocusMode = useCallback(() => {
    if (!focusMode) {
      // Entering focus mode — stop full track, start sentence audio
      if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); setAudioActive(false); }
      const targetId = activeSentenceId ?? allSentences[0]?.id ?? null;
      setActiveSentenceId(targetId);
      if (targetId) {
        const s = allSentences.find(s => s.id === targetId);
        if (s?.audio_url) sentenceAudio.play(targetId, s.audio_url);
      }
    } else {
      // Exiting focus mode — stop sentence audio
      sentenceAudio.stop();
    }
    setFocusMode(v => !v);
  }, [focusMode, isPlaying, activeSentenceId, allSentences, sentenceAudio]);

  const handleSentenceClick = useCallback((id: string) => {
    setActiveSentenceId(prev => focusMode ? id : prev === id ? null : id);
    const sentence = allSentences.find(s => s.id === id);
    if (sentence?.audio_url) {
      if (audioRef.current && isPlaying) { audioRef.current.pause(); setIsPlaying(false); setAudioActive(false); }
      sentenceAudio.play(id, sentence.audio_url);
    }
  }, [focusMode, allSentences, isPlaying, sentenceAudio]);

  const handleFocusNav = useCallback((dir: 'prev' | 'next') => {
    const idx = allSentences.findIndex(s => s.id === displaySentenceIdRef.current);
    if (idx === -1) return;
    const next = allSentences[dir === 'next' ? idx + 1 : idx - 1];
    if (next) {
      setActiveSentenceId(next.id);
      if (next.audio_url) sentenceAudio.play(next.id, next.audio_url);
    }
  }, [allSentences, sentenceAudio]);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !dialogue.audio_url) return;
    sentenceAudio.stop();
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else if (audioActive) { audio.play(); }
    else {
      setIsAudioLoading(true); setAudioActive(true);
      audio.src = dialogue.audio_url;
      audio.play().catch(() => { setIsAudioLoading(false); setIsPlaying(false); setAudioActive(false); });
    }
  }, [isPlaying, audioActive, dialogue.audio_url, sentenceAudio]);

  useEffect(() => {
    if (!dialogue.audio_url) return;
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => {});
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('playing', () => { setIsAudioLoading(false); setIsPlaying(true); if (hasTimedRef.current) setActiveSentenceId(null); });
    audio.addEventListener('ended', () => {
      setIsPlaying(false); setCurrentTime(0); setAudioActive(false);
      const lastId = allSentences[allSentences.length - 1]?.id ?? null;
      setFocusMode(fm => { if (fm) setActiveSentenceId(lastId); return fm; });
    });
    audio.addEventListener('error', () => { setIsAudioLoading(false); setIsPlaying(false); setAudioActive(false); });
    return () => { audio.pause(); audio.src = ''; };
  }, [dialogue.audio_url, allSentences]);

  // Vocab: use authored vocab if present, else auto-extract from sentences
  const vocabList = useMemo(() => {
    if (dialogue.vocab && dialogue.vocab.length > 0) {
      return dialogue.vocab.map(v => ({ zh: v.zh, py: v.py, uz: v.uz, ru: v.ru, en: v.en || '', ex: v.ex, expy: v.expy, exuz: v.ex_uz, exru: v.ex_ru, exen: v.ex_en || '' }));
    }
    const seen = new Set<string>();
    const words: Array<{ zh: string; py: string; uz: string; ru: string; en: string; ex: string; expy: string; exuz: string; exru: string; exen: string }> = [];
    for (const s of allSentences) {
      if (!s.words) continue;
      for (const w of s.words) {
        const zh = s.text_original.slice(w.i[0], w.i[1]);
        if (seen.has(zh) || !zh.trim() || /[，。？！、""''：；]/.test(zh)) continue;
        seen.add(zh);
        words.push({ zh, py: w.p, uz: w.t, ru: w.tr, en: '', ex: s.text_original, expy: s.pinyin, exuz: s.text_translation, exru: s.text_translation_ru, exen: s.text_translation_en || '' });
      }
    }
    return words;
  }, [dialogue.vocab, allSentences]);

  const grammarNotes = dialogue.grammarNotes ?? [];

  if (authLoading) return <div className="loading-spinner" />;
  const showPaywall = trial?.isTrialExpired;

  return (
    <>
      {showPaywall && <Paywall />}
      <div className={`dialogue-reader${showPaywall ? ' paywall-blur' : ''}`} style={{ fontSize: `${fontSize}%` }}>

        {/* ── Hero banner ── */}
        <div className="dr-hero">
          <div className="dr-hero__watermark">对话</div>
          <div className="dr-hero__top-row">
            <Link href={listPath || `${bookPath}/dialogues`} className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK 1 · {({ uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' } as Record<string, string>)[language]}</div>
            <h1 className="dr-hero__title">{dialogue.title}</h1>
            <div className="dr-hero__pinyin">{dialogue.pinyin}</div>
            <div className="dr-hero__translation">— {language === 'ru' ? dialogue.titleTranslation_ru : language === 'en' ? (dialogue.titleTranslation_en || dialogue.titleTranslation) : dialogue.titleTranslation} —</div>
          </div>
        </div>

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
                        <RubyText text={activeSentence.text_original} pinyin={activeSentence.pinyin} show={showPinyin} />
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
                    {activeSentence?.audio_url && (
                      <button className="story__focus-play-btn" onClick={() => sentenceAudio.play(activeSentence.id, activeSentence.audio_url!)} type="button">
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
                dialogue.sections.map(section => (
                  <div key={section.id} className="dr-lines">
                    {section.sentences.map(s => {
                      const pairs = alignPinyinToText(s.text_original, s.pinyin);
                      const isActive = displaySentenceId === s.id;
                      const isPlaying2 = audioSentenceId === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`dr-line ${isActive ? 'dr-line--active' : ''} ${isPlaying2 ? 'dr-line--playing' : ''}`}
                          onClick={() => handleSentenceClick(s.id)}
                        >
                          <div className="dr-line-main">
                            {s.speaker && (
                              <div className="dr-line-speaker">{s.speaker}:</div>
                            )}
                            <div className="dr-line-chars">
                              {pairs.map((pair, ci) => {
                                const isPunct = /[，。？！、,.\s]/.test(pair.char);
                                return (
                                  <div
                                    key={ci}
                                    className="dr-char"
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
                              })}
                            </div>
                          </div>
                          {showTranslation && (
                            <div className="dr-line-tr">
                              {language === 'ru' ? s.text_translation_ru : language === 'en' ? (s.text_translation_en || s.text_translation) : s.text_translation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {!focusMode && dialogue.audio_url && (
              <button className={`story__play-fab ${isAudioLoading ? 'story__play-fab--loading' : ''}`} onClick={handlePlay} type="button">
                {isAudioLoading ? <span className="story__play-fab-spinner" /> :
                  isPlaying
                    ? <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    : <svg className="story__play-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>}
              </button>
            )}

            {/* Tarjima / Fokus / Pinyin bottom bar — unchanged */}
            <nav className="story__bottom-bar">
              <div className="story__bottom-bar-inner">
                <button className={`reader__nav-toggle ${focusMode ? 'reader__nav-toggle--active' : ''}`} onClick={toggleFocusMode} type="button">
                  {({ uz: 'Fokus', ru: 'Фокус', en: 'Focus' } as Record<string, string>)[language]}
                </button>
                <button className={`reader__nav-toggle ${showTranslation ? 'reader__nav-toggle--active' : ''}`} onClick={() => setShowTranslation(v => !v)} type="button">
                  {({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language]}
                </button>
                <button className={`reader__nav-toggle ${showPinyin ? 'reader__nav-toggle--active' : ''}`} onClick={() => setShowPinyin(v => !v)} type="button">
                  Pinyin
                </button>
              </div>
            </nav>

            <div className="dr-font-controls">
              <button className="dr-font-btn" onClick={() => setFontSize(s => Math.min(s + 10, 150))} type="button">A+</button>
              <div className="dr-font-divider" />
              <button className="dr-font-btn" onClick={() => setFontSize(s => Math.max(s - 10, 80))} type="button">A-</button>
            </div>
          </>
        )}

        {/* ── SO'ZLAR TAB ── */}
        {activeTab === 'vocab' && (
          <div className="dr-panel">
            {vocabList.length === 0 && !dialogue.extraVocab?.length && !dialogue.phrases?.length && !dialogue.timeOfDay?.length ? (
              <div className="dr-empty">
                <div className="dr-empty__icon">📖</div>
                <div>{({ uz: 'So\'zlar topilmadi', ru: 'Слова не найдены', en: 'No words found' } as Record<string, string>)[language]}</div>
              </div>
            ) : (
              <>
                {vocabList.length > 0 && (
                  <div className="dr-card">
                    <div className="dr-label">{({ uz: 'Yangi so\'zlar', ru: 'Новые слова', en: 'New Words' } as Record<string, string>)[language]}</div>
                    {vocabList.map((v, i) => (
                      <div key={i} className={`dr-vocab-item ${expandedVocab === i ? 'dr-vocab-item--open' : ''}`} onClick={() => setExpandedVocab(expandedVocab === i ? null : i)}>
                        <div className="dr-vocab-row">
                          <span className="dr-vocab-zh">{v.zh}</span>
                          <span className="dr-vocab-py">{v.py}</span>
                          <span className="dr-vocab-tr">{language === 'ru' ? v.ru : language === 'en' ? (v.en || v.uz) : v.uz}</span>
                        </div>
                        {expandedVocab === i && (
                          <div className="dr-vocab-example">
                            <div className="dr-vocab-example-zh">{v.ex}</div>
                            <div className="dr-vocab-example-py">{v.expy}</div>
                            <div className="dr-vocab-example-tr">{language === 'ru' ? v.exru : language === 'en' ? (v.exen || v.exuz) : v.exuz}</div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="dr-hint">{({ uz: 'Bosing — misol ko\'rinadi', ru: 'Нажмите — увидите пример', en: 'Tap to see an example' } as Record<string, string>)[language]}</div>
                  </div>
                )}

                {dialogue.extraVocab && dialogue.extraVocab.length > 0 && (
                  <div className="dr-card">
                    <div className="dr-label">{({ uz: 'Mavzuga oid qo\'shimcha so\'zlar', ru: 'Дополнительные слова по теме', en: 'Additional Topic Words' } as Record<string, string>)[language]}</div>
                    {dialogue.extraVocabSubtitle_uz && (
                      <div className="dr-sublabel">{language === 'ru' ? dialogue.extraVocabSubtitle_ru : language === 'en' ? (dialogue.extraVocabSubtitle_en || dialogue.extraVocabSubtitle_uz) : dialogue.extraVocabSubtitle_uz}</div>
                    )}
                    {dialogue.extraVocab.map((v, i) => (
                      <div key={i} className="dr-vocab-item dr-vocab-item--nohover">
                        <div className="dr-vocab-row">
                          {v.icon && <span className="dr-vocab-icon">{v.icon}</span>}
                          <span className="dr-vocab-zh">{v.zh}</span>
                          <span className="dr-vocab-py">{v.py}</span>
                          <span className="dr-vocab-tr">{language === 'ru' ? v.ru : language === 'en' ? (v.en || v.uz) : v.uz}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
        {activeTab === 'grammar' && (
          <div className="dr-panel">
            {grammarNotes.length === 0 ? (
              <div className="dr-empty">
                <div className="dr-empty__icon">🚧</div>
                <div>{({ uz: 'Tez kunda', ru: 'Скоро будет', en: 'Coming soon' } as Record<string, string>)[language]}</div>
              </div>
            ) : (
              <>
                {grammarNotes.map((g, i) => (
                  <div key={i} className="dr-card dr-grammar-card" onClick={() => setExpandedGrammar(expandedGrammar === i ? null : i)}>
                    <div className="dr-grammar-header">
                      <span className="dr-grammar-pattern">{g.pattern}</span>
                      <span className="dr-grammar-title">{language === 'ru' ? g.title_ru : language === 'en' ? (g.title_en || g.title_uz) : g.title_uz}</span>
                      <span className={`dr-grammar-arrow${expandedGrammar === i ? ' dr-grammar-arrow--open' : ''}`}>▾</span>
                    </div>
                    <div className="dr-grammar-desc">{language === 'ru' ? g.desc_ru : language === 'en' ? (g.desc_en || g.desc_uz) : g.desc_uz}</div>
                    {expandedGrammar === i && (
                      <div className="dr-grammar-expanded">
                        {(g.formula || g.formula_ru) && (
                          <div className="dr-grammar-formula">{language === 'ru' ? (g.formula_ru ?? g.formula) : language === 'en' ? (g.formula_en ?? g.formula) : g.formula}</div>
                        )}
                        {g.examples && g.examples.map((ex, ei) => (
                          <div key={ei} className="dr-grammar-example">
                            <div className="dr-vocab-example-zh">{ex.zh}</div>
                            <div className="dr-vocab-example-py">{ex.py}</div>
                            <div className="dr-vocab-example-tr">{language === 'ru' ? ex.ru : language === 'en' ? (ex.en || ex.uz) : ex.uz}</div>
                          </div>
                        ))}
                        {!g.examples && g.ex && (
                          <div className="dr-grammar-example">
                            <div className="dr-vocab-example-zh">{g.ex}</div>
                            <div className="dr-vocab-example-py">{g.expy}</div>
                            <div className="dr-vocab-example-tr">{language === 'ru' ? g.ex_ru : language === 'en' ? (g.ex_en || g.ex_uz) : g.ex_uz}</div>
                          </div>
                        )}
                        {(g.tip_uz || g.tip_ru) && (
                          <div className="dr-grammar-tip">💡 {language === 'ru' ? g.tip_ru : language === 'en' ? (g.tip_en || g.tip_uz) : g.tip_uz}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className="dr-hint">{({ uz: 'Bosing — formula va misollar ko\'rinadi', ru: 'Нажмите — увидите формулу и примеры', en: 'Tap to see formula and examples' } as Record<string, string>)[language]}</div>
              </>
            )}
          </div>
        )}


      </div>
      <PageFooter />
    </>
  );
}
