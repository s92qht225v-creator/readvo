'use client';

import React, { useState } from 'react';
import { MeaningChoiceExercise, type ExerciseProps } from './MeaningChoiceExercise';
import { PinyinChoiceExercise } from './PinyinChoiceExercise';
import { PinyinTypeExercise } from './PinyinTypeExercise';
import { AudioChoiceExercise } from './AudioChoiceExercise';

/**
 * The ladder hub: picks which exercise the current card gets. For now it's a
 * random mix of the available rungs (chosen once per card mount, so it stays
 * stable through the feedback animation). New exercise types are added by
 * dropping them into POOL. When we formalize the strict ladder, this is where
 * the per-card stage → exercise mapping will live instead of the random pick.
 */
const POOL: React.FC<ExerciseProps>[] = [MeaningChoiceExercise, PinyinChoiceExercise, PinyinTypeExercise, AudioChoiceExercise];

export function LadderExercise(props: ExerciseProps) {
  const [Exercise] = useState(() => POOL[Math.floor(Math.random() * POOL.length)]);
  return <Exercise {...props} />;
}
