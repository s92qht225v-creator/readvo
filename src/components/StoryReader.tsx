'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ReaderControls } from './ReaderControls';
import { alignPinyinToText } from '../utils/rubyText';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface StoryWord {
  /** Character range [startIdx, endIdx) in text_original */
  i: [number, number];
  /** Pinyin for this word */
  p: string;
  /** Uzbek translation */
  t: string;
  /** Russian translation */
  tr: string;
  /** HSK level (1-6) */
  h?: number;
  /** Lesson number where word was first introduced */
  l?: number;
}

interface StorySentence {
  id: string;
  text_original: string;
  pinyin: string;
  text_translation: string;
  text_translation_ru: string;
  start?: number;
  end?: number;
  words?: StoryWord[];
  audio_url?: string;
}

interface StorySection {
  id: string;
  sentences: StorySentence[];
}

interface StoryData {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  audio_url?: string;
  sections: StorySection[];
}

interface StoryReaderProps {
  story: StoryData;
  bookPath: string;
}

function RubyChar({ char, py, showPinyin }: { char: string; py?: string; showPinyin: boolean }) {
  if (py) {
    return (
      <ruby>
        {char}
        <rp>(</rp>
        <rt style={showPinyin ? undefined : { visibility: 'hidden' }}>{py}</rt>
        <rp>)</rp>
      </ruby>
    );
  }
  return <span>{char}</span>;
}

function RubyText({ text, pinyin, showPinyin, words, activeWordIdx, onWordPress, onWordRelease }: {
  text: string;
  pinyin: string;
  showPinyin: boolean;
  words?: StoryWord[];
  activeWordIdx?: number | null;
  onWordPress?: (wordIdx: number) => void;
  onWordRelease?: () => void;
}) {
  const pairs = alignPinyinToText(text, pinyin);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  // Build a map: charIndex → wordIndex (for grouping ruby pairs into words)
  const charToWord = useMemo(() => {
    if (!words || words.length === 0) return null;
    const map = new Map<number, number>();
    words.forEach((w, wi) => {
      for (let c = w.i[0]; c < w.i[1]; c++) {
        map.set(c, wi);
      }
    });
    return map;
  }, [words]);

  // Track character index as we iterate pairs
  // Each pair.char can be 1 char (normal) or 2 chars (erhua like 玩儿)
  const elements: React.ReactNode[] = [];
  let charIdx = 0;

  if (!charToWord || !words || !onWordPress) {
    // No word data — render plain ruby pairs
    pairs.forEach((pair, i) => {
      elements.push(<RubyChar key={i} char={pair.char} py={pair.pinyin} showPinyin={showPinyin} />);
    });
  } else {
    // Group pairs by word
    let currentWordIdx: number | undefined;
    let wordPairs: { pair: typeof pairs[0]; idx: number }[] = [];

    const flushWord = () => {
      if (wordPairs.length === 0) return;
      const wIdx = currentWordIdx;
      if (wIdx !== undefined) {
        const wordKey = `w${wIdx}`;
        elements.push(
          <span
            key={wordKey}
            className={`story__word ${activeWordIdx === wIdx ? 'story__word--active' : ''}`}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.stopPropagation();
              longPressFiredRef.current = false;
              pressTimerRef.current = setTimeout(() => {
                longPressFiredRef.current = true;
                onWordPress(wIdx);
                pressTimerRef.current = null;
              }, 300);
            }}
            onPointerUp={() => {
              if (pressTimerRef.current) {
                clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
              }
              if (longPressFiredRef.current) {
                longPressFiredRef.current = false;
                onWordRelease?.();
              }
            }}
            onPointerCancel={() => {
              if (pressTimerRef.current) {
                clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
              }
              if (longPressFiredRef.current) {
                longPressFiredRef.current = false;
                onWordRelease?.();
              }
            }}
            onPointerLeave={() => {
              if (pressTimerRef.current) {
                clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
              }
            }}
          >
            {wordPairs.map((wp) => (
              <RubyChar key={wp.idx} char={wp.pair.char} py={wp.pair.pinyin} showPinyin={showPinyin} />
            ))}
          </span>
        );
      } else {
        wordPairs.forEach((wp) => {
          elements.push(<RubyChar key={wp.idx} char={wp.pair.char} py={wp.pair.pinyin} showPinyin={showPinyin} />);
        });
      }
      wordPairs = [];
    };

    pairs.forEach((pair, i) => {
      const wIdx = charToWord.get(charIdx);
      if (wIdx !== currentWordIdx) {
        flushWord();
        currentWordIdx = wIdx;
      }
      wordPairs.push({ pair, idx: i });
      charIdx += pair.char.length;
    });
    flushWord();
  }

  return <>{elements}</>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StoryReader({ story, bookPath }: StoryReaderProps) {
  const [language, toggleLanguage] = useLanguage();
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [activeWord, setActiveWord] = useState<{ sentenceId: string; wordIdx: number } | null>(null);
  const longPressedRef = useRef(false);
  const audioPausedByWordRef = useRef(false);
  // Per-sentence audio player (singleton, tap-to-play)
  const sentenceAudio = useAudioPlayer();
  // Full-story audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioActive, setAudioActive] = useState(false);

  const togglePinyin = useCallback(() => setShowPinyin((v) => !v), []);
  const toggleTranslation = useCallback(() => setShowTranslation((v) => !v), []);
  const increaseFontSize = useCallback(() => setFontSize((s) => Math.min(s + 10, 150)), []);
  const decreaseFontSize = useCallback(() => setFontSize((s) => Math.max(s - 10, 80)), []);

  // Flat list of all sentences (for lookups)
  const allSentences = useMemo(
    () => story.sections.flatMap((s) => s.sentences),
    [story.sections]
  );

  const toggleFocusMode = useCallback(() => {
    if (!focusMode) {
      // Entering focus mode: stop full-story audio
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setAudioActive(false);
      }
      // Select first sentence if none active, and play its audio
      const targetId = activeSentenceId ?? story.sections[0]?.sentences[0]?.id ?? null;
      setActiveSentenceId(targetId);
      if (targetId) {
        const sentence = allSentences.find((s) => s.id === targetId);
        if (sentence?.audio_url) {
          sentenceAudio.play(targetId, sentence.audio_url);
        }
      }
    }
    setFocusMode((v) => !v);
  }, [focusMode, story.sections, isPlaying, activeSentenceId, allSentences, sentenceAudio]);

  // Build timed sentences list for audio sync
  const timedSentences = useMemo(
    () => allSentences.filter((s): s is StorySentence & { start: number; end: number } => s.start !== undefined && s.end !== undefined),
    [allSentences]
  );

  // Derive current audio sentence from playback time
  const audioSentenceId = useMemo(() => {
    if (!isPlaying || timedSentences.length === 0) return null;
    const match = timedSentences.find((s) => currentTime >= s.start && currentTime < s.end);
    return match?.id ?? null;
  }, [isPlaying, currentTime, timedSentences]);

  // In focus mode, keep activeSentenceId synced with audio so pausing doesn't lose position
  useEffect(() => {
    if (focusMode && audioSentenceId) {
      setActiveSentenceId(audioSentenceId);
    }
  }, [focusMode, audioSentenceId]);

  // The displayed sentence: audio-synced takes priority, then manual tap
  const displaySentenceId = audioSentenceId ?? activeSentenceId;
  const activeSentence = displaySentenceId
    ? allSentences.find((s) => s.id === displaySentenceId)
    : null;

  const handleSentenceClick = useCallback((id: string) => {
    // Skip if this click follows a long-press (word press already handled it)
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    setActiveWord(null);
    setActiveSentenceId((prev) => {
      // In focus mode, never deselect (view would collapse)
      if (focusMode) return id;
      return prev === id ? null : id;
    });
    // Play per-sentence audio if available
    const sentence = allSentences.find((s) => s.id === id);
    if (sentence?.audio_url) {
      // Stop full-story audio if playing
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        setAudioActive(false);
      }
      sentenceAudio.play(id, sentence.audio_url);
    }
  }, [focusMode, allSentences, isPlaying, sentenceAudio]);

  const handleWordPress = useCallback((sentenceId: string, wordIdx: number) => {
    longPressedRef.current = true;
    // Pause audio if playing so word translation shows cleanly
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioPausedByWordRef.current = true;
    }
    setActiveWord({ sentenceId, wordIdx });
    setActiveSentenceId(sentenceId);
  }, [isPlaying]);

  const handleWordRelease = useCallback(() => {
    setActiveWord(null);
    // Resume audio if it was paused by the word press
    if (audioPausedByWordRef.current && audioRef.current) {
      audioPausedByWordRef.current = false;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Focus mode: navigate to next/prev sentence
  const handleFocusNav = useCallback((direction: 'prev' | 'next') => {
    const currentId = displaySentenceId;
    if (!currentId) return;
    const idx = allSentences.findIndex((s) => s.id === currentId);
    if (idx === -1) return;
    const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (nextIdx >= 0 && nextIdx < allSentences.length) {
      const nextSentence = allSentences[nextIdx];
      setActiveSentenceId(nextSentence.id);
      if (nextSentence.audio_url) {
        sentenceAudio.play(nextSentence.id, nextSentence.audio_url);
      }
    }
  }, [displaySentenceId, allSentences, sentenceAudio]);

  // Initialize audio element
  useEffect(() => {
    if (!story.audio_url) return;
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    audio.addEventListener('playing', () => {
      setIsLoading(false);
      setIsPlaying(true);
      setActiveSentenceId(null);
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioActive(false);
      // In focus mode, select last sentence so view doesn't collapse
      const all = story.sections.flatMap((s) => s.sentences);
      const lastId = all[all.length - 1]?.id ?? null;
      setFocusMode((fm) => {
        if (fm) setActiveSentenceId(lastId);
        return fm;
      });
    });
    audio.addEventListener('error', () => {
      setIsLoading(false);
      setIsPlaying(false);
      setAudioActive(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [story.audio_url]);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !story.audio_url) return;
    // Stop any per-sentence audio first
    sentenceAudio.stop();
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else if (audioActive) {
      audio.play();
    } else {
      setIsLoading(true);
      setAudioActive(true);
      audio.src = story.audio_url;
      audio.play().catch(() => {
        setIsLoading(false);
        setIsPlaying(false);
        setAudioActive(false);
      });
    }
  }, [isPlaying, audioActive, story.audio_url, sentenceAudio]);

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0));
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="reader">
      <header className="reader__header">
        <div className="reader__header-inner">
          <Link href={`${bookPath}/stories`} className="reader__home">
            <img src="/logo.svg" alt="Blim" className="reader__home-logo" />
          </Link>
          <ReaderControls
            isPinyinVisible={showPinyin}
            onPinyinToggle={togglePinyin}
            isTranslationVisible={showTranslation}
            onTranslationToggle={toggleTranslation}
            fontSize={fontSize}
            onFontIncrease={increaseFontSize}
            onFontDecrease={decreaseFontSize}
            language={language}
            onLanguageToggle={toggleLanguage}
            pageNumber={1}
            isFocusMode={undefined}
            onFocusModeToggle={undefined}
          />
        </div>
      </header>

      {activeSentence && (showTranslation || activeWord) && (
        <div className="story__translation-panel">
          <p className="story__translation-panel-text">
            {(() => {
              if (activeWord && activeWord.sentenceId === activeSentence.id) {
                const word = activeSentence.words?.[activeWord.wordIdx];
                if (word) {
                  const chars = activeSentence.text_original.slice(word.i[0], word.i[1]);
                  const translation = language === 'ru' ? word.tr : word.t;
                  return <><strong>{chars}</strong> {word.p} — {translation}{word.h ? <span className="story__word-hsk">HSK {word.h}</span> : null}{word.l ? <span className="story__word-hsk">{word.l}-{language === 'ru' ? 'урок' : 'dars'}</span> : null}</>;
                }
              }
              return language === 'ru' ? activeSentence.text_translation_ru : activeSentence.text_translation;
            })()}
          </p>
        </div>
      )}

      <article className={`story ${audioActive ? 'story--with-audio' : ''} ${focusMode ? 'story--focus' : ''}`} style={{ fontSize: `${fontSize}%` }}>
        {focusMode && activeSentence ? (
          <div className="story__focus">
            <p className="story__text story__focus-text">
              <span
                className="story__sentence story__sentence--active"
                onClick={() => handleSentenceClick(activeSentence.id)}
              >
                <RubyText
                  text={activeSentence.text_original}
                  pinyin={activeSentence.pinyin}
                  showPinyin={showPinyin}
                  words={activeSentence.words}
                  activeWordIdx={activeWord?.sentenceId === activeSentence.id ? activeWord.wordIdx : null}
                  onWordPress={(idx) => handleWordPress(activeSentence.id, idx)}
                  onWordRelease={handleWordRelease}
                />
              </span>
            </p>
            <div className="story__focus-nav">
              <button
                className="story__focus-nav-btn"
                onClick={() => handleFocusNav('prev')}
                disabled={allSentences[0]?.id === displaySentenceId}
                type="button"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              {activeSentence?.audio_url && (
                <button
                  className="story__focus-play-btn"
                  onClick={() => sentenceAudio.play(activeSentence.id, activeSentence.audio_url!)}
                  type="button"
                  aria-label={sentenceAudio.isPlaying(activeSentence.id) ? 'Pause' : 'Play'}
                >
                  {sentenceAudio.isPlaying(activeSentence.id) ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              )}
              <button
                className="story__focus-nav-btn"
                onClick={() => handleFocusNav('next')}
                disabled={allSentences[allSentences.length - 1]?.id === displaySentenceId}
                type="button"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                </svg>
              </button>
            </div>
            <span className="story__focus-counter">
              {allSentences.findIndex((s) => s.id === displaySentenceId) + 1} / {allSentences.length}
            </span>
          </div>
        ) : (
          story.sections.map((section) => (
            <div key={section.id} className="story__paragraph">
              <p className="story__text">
                {section.sentences.map((s, i) => (
                  <React.Fragment key={s.id}>
                    {i > 0 && ' '}
                    <span
                      className={`story__sentence ${displaySentenceId === s.id ? 'story__sentence--active' : ''} ${audioSentenceId === s.id ? 'story__sentence--playing' : ''}`}
                      onClick={() => handleSentenceClick(s.id)}
                    >
                      <RubyText
                        text={s.text_original}
                        pinyin={s.pinyin}
                        showPinyin={showPinyin}
                        words={s.words}
                        activeWordIdx={activeWord?.sentenceId === s.id ? activeWord.wordIdx : null}
                        onWordPress={(idx) => handleWordPress(s.id, idx)}
                        onWordRelease={handleWordRelease}
                      />
                    </span>
                  </React.Fragment>
                ))}
              </p>
            </div>
          ))
        )}
      </article>

      {!focusMode && story.audio_url && (
        <button
          className={`story__play-fab ${isLoading ? 'story__play-fab--loading' : ''}`}
          onClick={handlePlay}
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <span className="story__play-fab-spinner" />
          ) : isPlaying ? (
            <svg className="story__play-fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="story__play-fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {/* Slim bottom bar with pinyin/translation toggles */}
      <nav className="story__bottom-bar">
        <div className="story__bottom-bar-inner">
          <button
            className={`reader__nav-toggle ${showTranslation ? 'reader__nav-toggle--active' : ''}`}
            onClick={toggleTranslation}
            type="button"
          >
            {language === 'ru' ? 'Перевод' : 'Tarjima'}
          </button>
          <button
            className={`reader__nav-toggle ${focusMode ? 'reader__nav-toggle--active' : ''}`}
            onClick={toggleFocusMode}
            type="button"
          >
            {language === 'ru' ? 'Фокус' : 'Fokus'}
          </button>
          <button
            className={`reader__nav-toggle ${showPinyin ? 'reader__nav-toggle--active' : ''}`}
            onClick={togglePinyin}
            type="button"
          >
            Pinyin
          </button>
        </div>
      </nav>
    </div>
  );
}
