'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { ExerciseProps } from './MeaningChoiceExercise';
import type { FlashcardWord } from '../../types';
import type { Language } from '@/types/ui-state';
import { shuffleArray } from '../../utils/shuffle';
import { playResult } from '@/utils/sfx';

/**
 * Ladder rung — listening: hear the Chinese (recorded audio or TTS), pick the
 * correct native meaning from 4. No 汉字/pinyin shown — it's a pure listening
 * test. Same `onResult(correct)` contract.
 */

const meaningOf = (w: FlashcardWord, l: Language) =>
  (l === 'ru' && w.text_translation_ru ? w.text_translation_ru
    : l === 'en' && w.text_translation_en ? w.text_translation_en
      : w.text_translation);

export function AudioChoiceExercise({ card, deck, language, onAudio, onResult }: ExerciseProps) {
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
  const [loading, setLoading] = useState(false);

  const play = async () => {
    if (loading) return;
    setLoading(true);
    try { await onAudio?.(); } finally { setLoading(false); }
  };

  // Best-effort auto-play once per card (mobile may block until the play button
  // is tapped). Component is keyed by card id, so this runs once per card.
  useEffect(() => {
    const t = setTimeout(() => { void play(); }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <button type="button" className="fc-quiz__bigplay" onClick={play} disabled={loading} aria-label="Play audio">
          {loading
            ? <span className="fc-quiz__spinner" />
            : <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
        </button>
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
