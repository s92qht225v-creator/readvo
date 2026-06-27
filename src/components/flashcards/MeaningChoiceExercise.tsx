'use client';

import React, { useMemo, useState } from 'react';
import type { FlashcardWord } from '../../types';
import type { Language } from '@/types/ui-state';
import { shuffleArray } from '../../utils/shuffle';
import { playResult } from '@/utils/sfx';

/**
 * Ladder exercise #1 — recognition: show 汉字 (+ pinyin/audio), pick the correct
 * meaning from 4 choices (3 distractors auto-pulled from the same deck).
 *
 * Self-contained: it owns its own selection/feedback state and reports the
 * outcome via `onResult(correct)` after a short feedback pause. The deck engine
 * handles scheduling + re-queueing. Future exercise types follow this same
 * contract so they slot into the ladder without touching the engine.
 */

const meaningOf = (w: FlashcardWord, l: Language) =>
  (l === 'ru' && w.text_translation_ru ? w.text_translation_ru
    : l === 'en' && w.text_translation_en ? w.text_translation_en
      : w.text_translation);

export interface ExerciseProps {
  card: FlashcardWord;
  deck: readonly FlashcardWord[];   // pool for distractors
  language: Language;
  showPinyin: boolean;
  onAudio?: () => void | Promise<void>;
  onResult: (correct: boolean) => void;
}

export function MeaningChoiceExercise({ card, deck, language, showPinyin, onAudio, onResult }: ExerciseProps) {
  const correct = meaningOf(card, language);

  const options = useMemo(() => {
    const pool: string[] = [];
    const seen = new Set([correct]);
    for (const w of shuffleArray([...deck])) {
      if (w.id === card.id) continue;
      const m = meaningOf(w, language);
      if (m && !seen.has(m)) { seen.add(m); pool.push(m); }
      if (pool.length >= 3) break;
    }
    return shuffleArray([correct, ...pool]);
  }, [card.id, deck, language, correct]);

  const [picked, setPicked] = useState<string | null>(null);

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const isCorrect = opt === correct;
    playResult(isCorrect);
    // Short pause so the learner sees the green/red feedback before advancing.
    setTimeout(() => onResult(isCorrect), isCorrect ? 650 : 1150);
  };

  return (
    <div className="fc-quiz">
      <div className="fc-quiz__prompt">
        <div lang="zh-Hans" className="fc-quiz__hanzi">{card.text_original}</div>
        {showPinyin && <div className="fc-quiz__pinyin">{card.pinyin}</div>}
        {card.audio_url && (
          <button type="button" className="fc-quiz__audio" onClick={onAudio} aria-label="Play audio">🔊</button>
        )}
      </div>

      <div className="fc-quiz__options">
        {options.map((opt) => {
          let cls = 'fc-quiz__option';
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
