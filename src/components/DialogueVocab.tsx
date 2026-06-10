'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types/ui-state';
import { resolveTtsUrl } from '@/utils/ttsAudio';

export interface VocabItem {
  zh: string; py: string; uz: string; ru: string; en: string;
  ex: string; expy: string; exuz: string; exru: string; exen: string;
}

const meaningOf = (v: VocabItem, l: Language) => (l === 'ru' ? v.ru : l === 'en' ? (v.en || v.uz) : v.uz);

/**
 * Words tab: every vocab word as a flip-card, stacked vertically. Tap a card →
 * it 3D-rotates to show the translation. Only one is open at a time — tapping
 * another flips the previous one back. Vocab entries are whole words/phrases
 * (打电话, not 打). No practice mode, no know/don't-know, no swiping.
 */
export function DialogueVocab({ words, language }: { words: VocabItem[]; language: Language }) {
  const [open, setOpen] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;
    return () => { a.pause(); a.src = ''; };
  }, []);
  const playWord = async (zh: string) => {
    const a = audioRef.current;
    if (!a) return;
    const url = await resolveTtsUrl(zh);
    if (!url) return;
    a.src = url;
    try { await a.play(); } catch { /* autoplay blocked */ }
  };

  return (
    <div className="dr-flips">
      {words.map((v, i) => (
        <div
          key={i}
          className={`dr-flip ${open === i ? 'dr-flip--open' : ''}`}
          onClick={() => setOpen(open === i ? null : i)}
          role="button"
          tabIndex={0}
        >
          <div className="dr-flip__inner">
            <div className="dr-flip__face dr-flip__front">
              <button
                type="button"
                className="dr-flip__audio"
                onClick={(e) => { e.stopPropagation(); void playWord(v.zh); }}
                aria-label="audio"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z"/></svg>
              </button>
              <span className="dr-flip__py">{v.py}</span>
              <span className="dr-flip__zh">{v.zh}</span>
            </div>
            <div className="dr-flip__face dr-flip__back">
              <span className="dr-flip__meaning">{meaningOf(v, language)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
