'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HanziCanvas } from './HanziCanvas';
import { useStars } from '@/hooks/useStars';
import type { HanziWord } from '@/services/writing';

const WRITING_AUDIO_BASE = 'https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201/Writing';

function getWritingAudioUrl(char: string, pinyin: string): string {
  const stripped = pinyin.replace(/[ǖǘǚǜü]/gi, 'v').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s']/g, '').toLowerCase();
  const unicode = Array.from(char).map(c => c.codePointAt(0)).join('');
  return `${WRITING_AUDIO_BASE}/${stripped}_${unicode}.mp3`;
}

/** Max wrong strokes per character before it counts as "fail" */
const FAIL_THRESHOLD = 2;

interface CharResult {
  char: string;
  mistakes: number;
  skipped: boolean;
}

interface Props {
  words: HanziWord[];
  lang: 'uz' | 'ru' | 'en';
  setId: string;
  onDone?: () => void;
}

type Screen = 'ready' | 'test' | 'complete';

function calculateWritingStars(results: CharResult[]): number {
  const total = results.length;
  const passed = results.filter(r => !r.skipped && r.mistakes < FAIL_THRESHOLD).length;

  if (passed === total) return 3;
  if (passed >= total - 1) return 2;
  if (passed > 0) return 1;
  return 0;
}

export function WritingTest({ words, lang, setId, onDone }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { getStars, saveStars } = useStars('writing');

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const [screen, setScreen] = useState<Screen>('ready');
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [results, setResults] = useState<CharResult[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const mistakesRef = useRef(0);
  const [stars, setStarsLocal] = useState<number | null>(null);

  // Flatten words into individual characters for multi-char support
  const flatChars = useRef<{ word: HanziWord; char: string; charIdx: number; totalInWord: number }[]>([]);
  useEffect(() => {
    const flat: typeof flatChars.current = [];
    words.forEach(w => {
      const chars = [...w.char];
      chars.forEach((c, i) => flat.push({ word: w, char: c, charIdx: i, totalInWord: chars.length }));
    });
    flatChars.current = flat;
  }, [words]);

  const currentWord = words[wordIndex];
  const wordChars = currentWord ? [...currentWord.char] : [];
  const currentChar = wordChars[charIndex] || '';
  const totalCharsInWord = wordChars.length;

  // Total progress: count completed chars across all words
  const completedChars = results.length;
  const totalChars = flatChars.current.length || words.reduce((n, w) => n + [...w.char].length, 0);

  // Play audio using direct HTMLAudioElement — avoids useAudioPlayer race conditions
  const playAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const el = new Audio(url);
    audioRef.current = el;
    el.play().catch(() => { /* ignore autoplay blocks */ });
  }, []);

  const playCurrentAudio = useCallback(() => {
    if (!currentWord) return;
    playAudio(getWritingAudioUrl(currentWord.char, currentWord.pinyin));
  }, [currentWord, playAudio]);

  // Auto-play audio when word changes (not on initial start — that's handled in handleStart)
  const prevWordIndexRef = useRef(-1);
  useEffect(() => {
    if (screen === 'test' && currentWord && prevWordIndexRef.current !== -1 && prevWordIndexRef.current !== wordIndex) {
      playCurrentAudio();
    }
    prevWordIndexRef.current = wordIndex;
  }, [screen, wordIndex, playCurrentAudio, currentWord]);

  // Advance to next character/word
  const advance = useCallback((mistakes: number, skipped: boolean) => {
    const result: CharResult = { char: currentChar, mistakes, skipped };
    const newResults = [...results, result];
    setResults(newResults);
    mistakesRef.current = 0;

    // Check if more characters in current word
    if (charIndex < totalCharsInWord - 1) {
      setCharIndex(i => i + 1);
      setResetKey(k => k + 1);
    } else if (wordIndex + 1 < words.length) {
      // Next word
      setWordIndex(i => i + 1);
      setCharIndex(0);
      setResetKey(k => k + 1);
    } else {
      // Test complete
      const finalStars = calculateWritingStars(newResults);
      setStarsLocal(finalStars);

      // Save stars (never overwrite better score)
      const existing = getStars(setId);
      if (existing == null || finalStars > existing) {
        saveStars(setId, finalStars);
      }

      setScreen('complete');
    }
  }, [currentChar, charIndex, totalCharsInWord, wordIndex, words.length, results, getStars, setId, saveStars]);

  // HanziCanvas complete callback
  const handleCharComplete = useCallback((mistakes: number) => {
    // Auto-advance after a brief delay
    setTimeout(() => advance(mistakes, false), 600);
  }, [advance]);

  // "Don't know" button
  const handleSkip = useCallback(() => {
    advance(999, true);
  }, [advance]);

  // Start test — play audio immediately in user gesture context
  const handleStart = useCallback(() => {
    setWordIndex(0);
    setCharIndex(0);
    setResults([]);
    setResetKey(k => k + 1);
    mistakesRef.current = 0;
    prevWordIndexRef.current = 0;
    setScreen('test');
    // Play first word audio directly in click handler (user gesture)
    if (words[0]) {
      playAudio(getWritingAudioUrl(words[0].char, words[0].pinyin));
    }
  }, [words, playAudio]);

  // Retry — play audio immediately in user gesture context
  const handleRetry = useCallback(() => {
    setWordIndex(0);
    setCharIndex(0);
    setResults([]);
    setResetKey(k => k + 1);
    mistakesRef.current = 0;
    prevWordIndexRef.current = 0;
    setStarsLocal(null);
    setScreen('test');
    if (words[0]) {
      playAudio(getWritingAudioUrl(words[0].char, words[0].pinyin));
    }
  }, [words, playAudio]);

  const L = (t: Record<string, string>) => t[lang] || t.en;

  // --- READY SCREEN ---
  if (screen === 'ready') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>✍️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          {L({ uz: 'Diktant', ru: 'Диктант', en: 'Dictation' })}
        </h2>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 1.6 }}>
          {L({
            uz: `Audioni tinglang va ieroglifni xotiradan yozing. ${words.length} ta so'z.`,
            ru: `Прослушайте аудио и напишите иероглиф по памяти. ${words.length} слов.`,
            en: `Listen and write the character from memory. ${words.length} words.`,
          })}
        </p>
        <button
          type="button"
          onClick={handleStart}
          style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 40px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {L({ uz: 'Boshlash', ru: 'Начать', en: 'Start' })}
        </button>
      </div>
    );
  }

  // --- COMPLETE SCREEN ---
  if (screen === 'complete') {
    const passed = results.filter(r => !r.skipped && r.mistakes < FAIL_THRESHOLD).length;
    const pct = Math.round((passed / results.length) * 100);

    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {pct === 100 ? '🎉' : pct >= 50 ? '👍' : '💪'}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
          {pct === 100
            ? L({ uz: 'Barakalla!', ru: 'Отлично!', en: 'Well done!' })
            : L({ uz: 'Natija', ru: 'Результат', en: 'Result' })}
        </h2>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
          {passed} / {results.length} {L({ uz: "to'g'ri", ru: 'правильно', en: 'correct' })}
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 24 }}>
          {[1, 2, 3].map(n => (
            <span key={n} style={{ fontSize: 28, color: stars != null && n <= stars ? '#f59e0b' : 'rgba(0,0,0,0.08)' }}>
              ★
            </span>
          ))}
        </div>

        {pct === 100 && onDone ? (
          <button
            type="button"
            onClick={onDone}
            style={{
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 40px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {L({ uz: 'Tayyor ✓', ru: 'Готово ✓', en: 'Done ✓' })}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 28px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {L({ uz: 'Qayta urinish', ru: 'Попробовать снова', en: 'Retry' })}
            </button>
            {onDone && (
              <button
                type="button"
                onClick={onDone}
                style={{
                  background: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '14px 28px',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {L({ uz: 'Tayyor', ru: 'Готово', en: 'Done' })}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- TEST SCREEN ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
      {/* Pinyin display */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#dc2626' }}>
          {currentWord?.pinyin}
        </div>
        {totalCharsInWord > 1 && (
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
            {charIndex + 1} / {totalCharsInWord}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="hanzi-practice__grid-wrapper">
        {currentChar && (
          <HanziCanvas
            key={`test-${currentChar}-${charIndex}-${wordIndex}-${resetKey}`}
            char={currentChar}
            lang={lang}
            hidden={true}
            onComplete={handleCharComplete}
          />
        )}
      </div>

      {/* Don't know | counter | Listen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={handleSkip}
          style={{
            minWidth: 120,
            background: 'none',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 14,
            color: '#6b7280',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {L({ uz: 'Bilmayman', ru: 'Не знаю', en: "Don't know" })}
        </button>
        <span style={{ fontSize: 13, color: '#aaa', whiteSpace: 'nowrap' }}>
          {completedChars + 1} / {totalChars}
        </span>
        <button
          type="button"
          onClick={playCurrentAudio}
          style={{
            minWidth: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 14,
            color: '#555',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5zM14 3.23v2.06a6.51 6.51 0 0 1 0 13.42v2.06A8.51 8.51 0 0 0 14 3.23z"/></svg>
          {L({ uz: 'Tinglash', ru: 'Послушать', en: 'Listen' })}
        </button>
      </div>
    </div>
  );
}
