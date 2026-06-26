'use client';

import React, { useMemo, useState } from 'react';
import type { ExerciseProps } from './MeaningChoiceExercise';
import type { Language } from '@/types/ui-state';
import { shuffleArray } from '../../utils/shuffle';

/**
 * Ladder rung — unscramble: show 汉字 + meaning, rebuild the pinyin from its
 * scrambled letters. Letters keep their tone marks (composed NFC, so ǐ/ā are
 * single tiles), so tones are tested by placement, no keyboard needed. Tap a
 * tray tile to place it, a placed tile to take it back; auto-checks when full.
 */

interface Tile { id: number; ch: string; }

// Composed (so toned vowels are single chars) and stripped of spaces/apostrophes.
const clean = (s: string) => s.normalize('NFC').replace(/[\s'·]/g, '');

const meaningOf = (card: { text_translation: string; text_translation_ru?: string; text_translation_en?: string }, l: Language) =>
  (l === 'ru' && card.text_translation_ru ? card.text_translation_ru
    : l === 'en' && card.text_translation_en ? card.text_translation_en
      : card.text_translation);

export function PinyinUnscrambleExercise({ card, language, onResult }: ExerciseProps) {
  const correct = clean(card.pinyin);
  const meaning = meaningOf(card, language);

  const tiles = useMemo<Tile[]>(() => {
    const arr = Array.from(correct).map((ch, i) => ({ id: i, ch }));
    return shuffleArray(arr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  const byId = useMemo(() => new Map(tiles.map((t) => [t.id, t])), [tiles]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  const tray = tiles.filter((t) => !placed.includes(t.id));

  const place = (id: number) => {
    if (result) return;
    const next = [...placed, id];
    setPlaced(next);
    if (next.length === tiles.length) {
      const built = next.map((i) => byId.get(i)!.ch).join('');
      const ok = built === correct;
      setResult(ok ? 'correct' : 'wrong');
      setTimeout(() => onResult(ok), ok ? 700 : 1500);
    }
  };

  const take = (id: number) => {
    if (result) return;
    setPlaced(placed.filter((x) => x !== id));
  };

  const L = (uz: string, ru: string, en: string) => ({ uz, ru, en } as Record<string, string>)[language];

  return (
    <div className="fc-quiz">
      <div className="fc-quiz__prompt">
        <div lang="zh-Hans" className="fc-quiz__hanzi">{card.text_original}</div>
        <div className="fc-quiz__prompt-meaning">{meaning}</div>
      </div>

      <div className={`fc-scramble__built ${result ? `fc-scramble__built--${result}` : ''}`}>
        {placed.length === 0 && (
          <span className="fc-scramble__placeholder">{L('harflarni tartibga soling', 'соберите по буквам', 'tap the letters in order')}</span>
        )}
        {placed.map((id) => (
          <button key={id} type="button" className="fc-tile" onClick={() => take(id)} disabled={!!result}>{byId.get(id)!.ch}</button>
        ))}
      </div>

      {result === 'wrong' && <div className="fc-quiz__answer">{card.pinyin}</div>}

      <div className="fc-scramble__tray">
        {tray.map((t) => (
          <button key={t.id} type="button" className="fc-tile" onClick={() => place(t.id)} disabled={!!result}>{t.ch}</button>
        ))}
      </div>
    </div>
  );
}
