'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types/ui-state';
import { shuffleArray } from '@/utils/shuffle';
import { resolveTtsUrl } from '@/utils/ttsAudio';
import { ChevronDownIcon } from '@/components/ChevronDownIcon';

export interface VocabItem {
  zh: string; py: string; uz: string; ru: string; en: string;
  ex: string; expy: string; exuz: string; exru: string; exen: string;
}

const T = (l: Language, uz: string, ru: string, en: string) => (l === 'ru' ? ru : l === 'en' ? en : uz);
const meaningOf = (v: VocabItem, l: Language) => (l === 'ru' ? v.ru : l === 'en' ? (v.en || v.uz) : v.uz);
const exTrOf = (v: VocabItem, l: Language) => (l === 'ru' ? v.exru : l === 'en' ? (v.exen || v.exuz) : v.exuz);

/**
 * Words tab content: a vocabulary card list + an optional "Practice these
 * words" flashcard session over the SAME list. Vocab entries are whole words
 * (e.g. 打电话, not 打). Self-contained — no test engine, no flashcard deck.
 */
export function DialogueVocab({ words, language }: { words: VocabItem[]; language: Language }) {
  const [mode, setMode] = useState<'list' | 'cards'>('list');
  const [expanded, setExpanded] = useState<number | null>(null);

  // flashcard session state
  const [order, setOrder] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);

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

  const startCards = () => {
    setOrder(shuffleArray(words.map((_, i) => i)));
    setPos(0); setFlipped(false); setKnown(0); setDone(false);
    setMode('cards');
  };
  const grade = (knew: boolean) => {
    if (knew) setKnown(k => k + 1);
    if (pos + 1 >= order.length) { setDone(true); return; }
    setPos(p => p + 1);
    setFlipped(false);
  };

  // ── Flashcard practice ──
  if (mode === 'cards') {
    if (done) {
      return (
        <div className="dr-vfc dr-vfc--center">
          <div className="dr-vfc__emoji" aria-hidden="true">🎉</div>
          <div className="dr-vfc__score">{known} / {order.length}</div>
          <div className="dr-vfc__intro">{T(language, 'bilgan so\'zlar', 'выучено слов', 'words known')}</div>
          <div className="dr-vfc__row">
            <button type="button" className="dr-vfc__btn" onClick={() => setMode('list')}>
              {T(language, 'Ro\'yxat', 'Список', 'List')}
            </button>
            <button type="button" className="dr-vfc__btn dr-vfc__btn--primary" onClick={startCards}>
              {T(language, 'Qaytadan', 'Заново', 'Restart')}
            </button>
          </div>
        </div>
      );
    }
    const v = words[order[pos]];
    return (
      <div className="dr-vfc">
        <div className="dr-vfc__progress">{pos + 1} / {order.length}</div>
        <div className="dr-vfc__card" onClick={() => setFlipped(f => !f)}>
          <button
            type="button"
            className="dr-vfc__audio"
            onClick={(e) => { e.stopPropagation(); void playWord(v.zh); }}
            aria-label={T(language, 'Tinglash', 'Прослушать', 'Listen')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12z"/></svg>
          </button>
          <div className="dr-vfc__zh">{v.zh}</div>
          <div className="dr-vfc__py">{v.py}</div>
          {flipped ? (
            <>
              <div className="dr-vfc__meaning">{meaningOf(v, language)}</div>
              {v.ex && (
                <div className="dr-vfc__ex">
                  <span className="dr-vfc__ex-zh">{v.ex}</span>
                  <span className="dr-vfc__ex-tr">{exTrOf(v, language)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="dr-vfc__hint">{T(language, 'Ma\'noni ko\'rish uchun bosing', 'Нажмите, чтобы увидеть значение', 'Tap to see the meaning')}</div>
          )}
        </div>
        {flipped ? (
          <div className="dr-vfc__row">
            <button type="button" className="dr-vfc__btn dr-vfc__btn--no" onClick={() => grade(false)}>
              {T(language, 'Bilmadim', 'Не знаю', "Don't know")}
            </button>
            <button type="button" className="dr-vfc__btn dr-vfc__btn--yes" onClick={() => grade(true)}>
              {T(language, 'Bilaman', 'Знаю', 'Know')}
            </button>
          </div>
        ) : (
          <button type="button" className="dr-vfc__exit" onClick={() => setMode('list')}>
            {T(language, '← Ro\'yxatga qaytish', '← Назад к списку', '← Back to list')}
          </button>
        )}
      </div>
    );
  }

  // ── Card list ──
  return (
    <>
      {words.length > 0 && (
        <button type="button" className="dr-vocab-practice-btn" onClick={startCards}>
          {T(language, "So'zlarni mashq qilish", 'Тренировать слова', 'Practice these words')} · {words.length}
        </button>
      )}
      {words.map((v, i) => (
        <div key={i} className="dr-card dr-grammar-card" onClick={() => setExpanded(expanded === i ? null : i)}>
          <div className="dr-grammar-header">
            <span className="dr-grammar-pattern">{v.zh}</span>
            <span className="dr-vocab-card-py">{v.py}</span>
            <span className="dr-grammar-title">{meaningOf(v, language)}</span>
            <ChevronDownIcon className={`dr-grammar-arrow${expanded === i ? ' dr-grammar-arrow--open' : ''}`} />
          </div>
          {expanded === i && v.ex && (
            <div className="dr-grammar-expanded">
              <div className="dr-grammar-example">
                <div className="dr-vocab-example-zh">{v.ex}</div>
                <div className="dr-vocab-example-py">{v.expy}</div>
                <div className="dr-vocab-example-tr">{exTrOf(v, language)}</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
