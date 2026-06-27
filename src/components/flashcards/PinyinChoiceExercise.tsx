'use client';

import React, { useMemo, useState } from 'react';
import type { ExerciseProps } from './MeaningChoiceExercise';
import { shuffleArray } from '../../utils/shuffle';
import { playResult } from '@/utils/sfx';

/**
 * Ladder rung — reverse recognition (sound): show the meaning, pick the correct
 * pinyin (with tones) from 4 choices (3 distractor pinyins from the same deck).
 * No audio here — playing the word would give the pinyin away. Same
 * `onResult(correct)` contract as the other exercises.
 */
export function PinyinChoiceExercise({ card, deck, language, onResult }: ExerciseProps) {
  const correct = card.pinyin;
  const meaning = language === 'ru' && card.text_translation_ru ? card.text_translation_ru
    : language === 'en' && card.text_translation_en ? card.text_translation_en
      : card.text_translation;

  const options = useMemo(() => {
    const pool: string[] = [];
    const seen = new Set([correct]);
    for (const w of shuffleArray([...deck])) {
      if (w.id === card.id) continue;
      if (w.pinyin && !seen.has(w.pinyin)) { seen.add(w.pinyin); pool.push(w.pinyin); }
      if (pool.length >= 3) break;
    }
    return shuffleArray([correct, ...pool]);
  }, [card.id, deck, correct]);

  const [picked, setPicked] = useState<string | null>(null);

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const isCorrect = opt === correct;
    playResult(isCorrect);
    setTimeout(() => onResult(isCorrect), isCorrect ? 1000 : 1800);
  };

  return (
    <div className="fc-quiz">
      <div className="fc-quiz__prompt">
        <div className="fc-quiz__meaning">{meaning}</div>
      </div>

      <div className="fc-quiz__options">
        {options.map((opt) => {
          let cls = 'fc-quiz__option fc-quiz__option--pinyin';
          if (picked) {
            if (opt === correct) cls += ' fc-quiz__option--correct';
            else if (opt === picked) cls += ' fc-quiz__option--wrong';
          }
          return (
            <button key={opt} type="button" className={cls} disabled={!!picked} onClick={() => choose(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
