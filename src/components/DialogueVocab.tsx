'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types/ui-state';
import { resolveTtsUrl } from '@/utils/ttsAudio';

export interface VocabItem {
  zh: string; py: string; uz: string; ru: string; en: string;
}

const meaningOf = (v: VocabItem, l: Language) => (l === 'ru' ? v.ru : l === 'en' ? (v.en || v.uz) : v.uz);

type Dir = 'zh-native' | 'native-zh';

/**
 * Words tab: every vocab word as a flip-card, stacked vertically. Tap a card →
 * it 3D-rotates to show the other side. Only one is open at a time — tapping
 * another flips the previous one back. Vocab entries are whole words/phrases
 * (打电话, not 打). No practice mode, no know/don't-know, no swiping.
 *
 * A direction toggle sits above the stack:
 *  - 汉字 → native: front = pinyin + 汉字 (+audio), back = meaning. (recall the meaning)
 *  - native → 汉字: front = meaning, back = pinyin + 汉字 (+audio). (recall the Chinese)
 */
export function DialogueVocab({ words, language }: { words: VocabItem[]; language: Language }) {
  const [open, setOpen] = useState<number | null>(null);
  const [dir, setDir] = useState<Dir>('zh-native');
  // zh of the word whose audio is currently resolving/buffering (spinner), and
  // a transient error toast when playback can't be produced.
  const [busyZh, setBusyZh] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);
  const errTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioLabel = ({ uz: 'Tinglash', ru: 'Прослушать', en: 'Play audio' } as Record<string, string>)[language];
  const audioErrLabel = ({ uz: 'Audio mavjud emas', ru: 'Аудио недоступно', en: 'Audio unavailable' } as Record<string, string>)[language];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;
    return () => {
      a.pause(); a.src = '';
      if (errTimer.current) clearTimeout(errTimer.current);
    };
  }, []);
  const playWord = async (zh: string) => {
    const a = audioRef.current;
    if (!a) return;
    setBusyZh(zh);
    setAudioError(false);
    try {
      const url = await resolveTtsUrl(zh);
      if (!url) throw new Error('no url');
      a.src = url;
      await a.play(); // resolves once playback starts (buffering done)
    } catch {
      setAudioError(true);
      if (errTimer.current) clearTimeout(errTimer.current);
      errTimer.current = setTimeout(() => setAudioError(false), 2500);
    } finally {
      setBusyZh(null);
    }
  };

  const modes: { id: Dir; label: string }[] = [
    { id: 'zh-native', label: ({ uz: "汉字 → O'zbekcha", ru: '汉字 → Русский', en: '汉字 → English' } as Record<string, string>)[language] },
    { id: 'native-zh', label: ({ uz: "O'zbekcha → 汉字", ru: 'Русский → 汉字', en: 'English → 汉字' } as Record<string, string>)[language] },
  ];

  const chineseSide = (v: VocabItem) => (
    <>
      <button
        type="button"
        className="dr-flip__audio"
        onClick={(e) => { e.stopPropagation(); void playWord(v.zh); }}
        aria-label={`${audioLabel}: ${v.zh}`}
        aria-busy={busyZh === v.zh}
        disabled={busyZh === v.zh}
      >
        {busyZh === v.zh
          ? <span className="dr-flip__audio-spinner" aria-hidden="true" />
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z"/></svg>}
      </button>
      <span className="dr-flip__py">{v.py}</span>
      <span className="dr-flip__zh" lang="zh-Hans">{v.zh}</span>
    </>
  );
  const meaningSide = (v: VocabItem) => <span className="dr-flip__meaning">{meaningOf(v, language)}</span>;

  return (
    <>
      <div className="dr-vocab-dir">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`dr-vocab-dir__btn ${dir === m.id ? 'dr-vocab-dir__btn--active' : ''}`}
            onClick={() => { setDir(m.id); setOpen(null); }}
          >{m.label}</button>
        ))}
      </div>
      <div className="dr-flips">
        {words.map((v, i) => (
          <div
            key={i}
            className={`dr-flip ${open === i ? 'dr-flip--open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(open === i ? null : i);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={open === i}
          >
            <div className="dr-flip__inner">
              <div className="dr-flip__face dr-flip__front">
                {dir === 'zh-native' ? chineseSide(v) : meaningSide(v)}
              </div>
              <div className="dr-flip__face dr-flip__back">
                {dir === 'zh-native' ? meaningSide(v) : chineseSide(v)}
              </div>
            </div>
          </div>
        ))}
      </div>
      {audioError && (
        <div className="page__audio-error" role="status">{audioErrLabel}</div>
      )}
    </>
  );
}
