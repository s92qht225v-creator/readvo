'use client';

import React, { useMemo, useState } from 'react';
import type { ExerciseProps } from './MeaningChoiceExercise';
import { shuffleArray } from '../../utils/shuffle';

/**
 * Ladder exercise #2 — reverse recognition: show the meaning (+ audio), pick the
 * correct 汉字 from 4 choices (3 distractor characters from the same deck).
 * Same `onResult(correct)` contract as the other exercises.
 */
export function HanziChoiceExercise({ card, deck, language, onAudio, onResult }: ExerciseProps) {
  const correct = card.text_original;
  const meaning = language === 'ru' && card.text_translation_ru ? card.text_translation_ru
    : language === 'en' && card.text_translation_en ? card.text_translation_en
      : card.text_translation;

  const options = useMemo(() => {
    const pool: string[] = [];
    const seen = new Set([correct]);
    for (const w of shuffleArray([...deck])) {
      if (w.id === card.id) continue;
      if (w.text_original && !seen.has(w.text_original)) { seen.add(w.text_original); pool.push(w.text_original); }
      if (pool.length >= 3) break;
    }
    return shuffleArray([correct, ...pool]);
  }, [card.id, deck, correct]);

  const [picked, setPicked] = useState<string | null>(null);

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    setTimeout(() => onResult(opt === correct), opt === correct ? 650 : 1150);
  };

  return (
    <div className="fc-quiz">
      <div className="fc-quiz__prompt">
        <div className="fc-quiz__meaning">{meaning}</div>
        {card.audio_url && (
          <button type="button" className="fc-quiz__audio" onClick={onAudio} aria-label="Play audio">🔊</button>
        )}
      </div>

      <div className="fc-quiz__options">
        {options.map((opt) => {
          let cls = 'fc-quiz__option fc-quiz__option--hanzi';
          if (picked) {
            if (opt === correct) cls += ' fc-quiz__option--correct';
            else if (opt === picked) cls += ' fc-quiz__option--wrong';
          }
          return (
            <button key={opt} type="button" lang="zh-Hans" className={cls} disabled={!!picked} onClick={() => choose(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
