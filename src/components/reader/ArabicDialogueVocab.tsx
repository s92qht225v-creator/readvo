'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '@/types/ui-state';
import { resolveTtsUrlAr } from '@/utils/ttsAudioAr';

export interface ArabicVocabItem {
  ar: string;
  translit: string;
  uz: string;
  ru: string;
  en: string;
  audio_url?: string; // curated recording (e.g. ElevenLabs); falls back to TTS
  gender?: 'm' | 'f'; // grammatical gender, shown for nouns only
}

const meaningOf = (v: ArabicVocabItem, l: Language) => (l === 'ru' ? v.ru : l === 'en' ? (v.en || v.uz) : v.uz);

/**
 * Words tab for the Arabic dialogue reader. Every vocab word is a flip-card,
 * stacked vertically. Tap a card → it 3D-rotates to show the meaning. Only one
 * is open at a time. Front = transliteration + Arabic (RTL) + 🔊 audio; back =
 * meaning. Reuses the Chinese `.dr-flip*` chrome (green-themed via `.theme-ar`).
 */
export function ArabicDialogueVocab({ words, language }: { words: ArabicVocabItem[]; language: Language }) {
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
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

  const playWord = async (v: ArabicVocabItem) => {
    const a = audioRef.current;
    if (!a) return;
    setBusy(v.ar);
    setAudioError(false);
    try {
      // Prefer a curated recording (ElevenLabs); fall back to TTS otherwise.
      const url = v.audio_url ?? await resolveTtsUrlAr(v.ar);
      if (!url) throw new Error('no url');
      a.src = url;
      await a.play();
    } catch {
      setAudioError(true);
      if (errTimer.current) clearTimeout(errTimer.current);
      errTimer.current = setTimeout(() => setAudioError(false), 2500);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="ar-vocab">
      <div className="dr-flips">
        {words.map((v, i) => (
          <div
            key={i}
            className={`dr-flip ${open === i ? 'dr-flip--open' : ''}`}
            onClick={() => setOpen(open === i ? null : i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(open === i ? null : i); }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={open === i}
          >
            <div className="dr-flip__inner">
              <div className="dr-flip__face dr-flip__front">
                <button
                  type="button"
                  className="dr-flip__audio"
                  onClick={(e) => { e.stopPropagation(); void playWord(v); }}
                  aria-label={`${audioLabel}: ${v.translit}`}
                  aria-busy={busy === v.ar}
                  disabled={busy === v.ar}
                >
                  {busy === v.ar
                    ? <span className="dr-flip__audio-spinner" aria-hidden="true" />
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z" /></svg>}
                </button>
                <span className="dr-flip__translit">{v.translit}{v.gender && <span className="dr-flip__gender"> ({v.gender})</span>}</span>
                <span className="dr-flip__ar" lang="ar" dir="rtl">{v.ar}</span>
              </div>
              <div className="dr-flip__face dr-flip__back">
                <span className="dr-flip__meaning">{meaningOf(v, language)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {audioError && <div className="page__audio-error" role="status">{audioErrLabel}</div>}
    </div>
  );
}
