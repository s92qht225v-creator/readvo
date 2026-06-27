'use client';

import React, { useMemo, useState } from 'react';
import type { ExerciseProps } from './MeaningChoiceExercise';
import type { Language } from '@/types/ui-state';
import { shuffleArray } from '../../utils/shuffle';
import { playResult } from '@/utils/sfx';

/**
 * Ladder rung — unscramble: show 汉字 + meaning, rebuild the pinyin. The
 * scrambled letters act as a "keyboard": tap a key and it types into a plain
 * text answer line (no box, no cursor) and leaves the keyboard; backspace
 * removes the last letter and returns it to the keyboard. Letters keep their
 * tone marks (composed NFC → ǐ/ā are single keys), so tones come for free with
 * no real keyboard. Auto-checks when the answer is full.
 */

interface Tile { id: number; ch: string; }

// Composed (toned vowels are single chars) and stripped of spaces/apostrophes.
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
  const [typed, setTyped] = useState<number[]>([]);
  const [result, setResult] = useState<null | 'correct' | 'wrong'>(null);

  const used = new Set(typed);
  const answer = typed.map((id) => byId.get(id)!.ch).join('');

  const press = (id: number) => {
    if (result) return;
    const next = [...typed, id];
    setTyped(next);
    if (next.length === tiles.length) {
      const ok = next.map((i) => byId.get(i)!.ch).join('') === correct;
      setResult(ok ? 'correct' : 'wrong');
      playResult(ok);
      setTimeout(() => onResult(ok), ok ? 700 : 1500);
    }
  };

  const backspace = () => {
    if (result || typed.length === 0) return;
    setTyped(typed.slice(0, -1));
  };

  return (
    <div className="fc-quiz">
      <div className="fc-quiz__prompt">
        <div lang="zh-Hans" className="fc-quiz__hanzi">{card.text_original}</div>
        <div className="fc-quiz__prompt-meaning">{meaning}</div>
      </div>

      <div className={`fc-kb__answer ${result ? `fc-kb__answer--${result}` : ''}`}>
        {answer || ' '}
      </div>

      {result === 'wrong' && <div className="fc-quiz__answer">{card.pinyin}</div>}

      <div className="fc-kb__keys">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`fc-tile ${used.has(t.id) ? 'fc-tile--used' : ''}`}
            onClick={() => press(t.id)}
            disabled={used.has(t.id) || !!result}
          >
            {t.ch}
          </button>
        ))}
        <button type="button" className="fc-tile fc-tile--back" onClick={backspace} disabled={!!result || typed.length === 0} aria-label="Backspace">⌫</button>
      </div>
    </div>
  );
}
