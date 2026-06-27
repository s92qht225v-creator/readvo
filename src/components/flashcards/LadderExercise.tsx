'use client';

import React from 'react';
import { MeaningChoiceExercise, type ExerciseProps } from './MeaningChoiceExercise';
import { PinyinChoiceExercise } from './PinyinChoiceExercise';
import { PinyinUnscrambleExercise } from './PinyinUnscrambleExercise';
import { AudioChoiceExercise } from './AudioChoiceExercise';

/**
 * The ladder: each card climbs these rungs IN ORDER (easiest → hardest). The
 * deck passes the card's current `stage` (1-based) and this renders the matching
 * exercise. Reorder/extend the ladder by editing STAGES.
 */
const STAGES: React.FC<ExerciseProps>[] = [
  MeaningChoiceExercise,     // 1. 汉字 → pick the meaning (recognition)
  AudioChoiceExercise,       // 2. listen → pick the meaning (listening)
  PinyinChoiceExercise,      // 3. meaning → pick the pinyin (reverse)
  PinyinUnscrambleExercise,  // 4. unscramble the pinyin (produce)
];

export const STAGE_COUNT = STAGES.length;

export function LadderExercise({ stage, ...props }: ExerciseProps & { stage: number }) {
  const idx = Math.min(Math.max(stage, 1), STAGE_COUNT) - 1;
  const Exercise = STAGES[idx];
  return <Exercise {...props} />;
}
