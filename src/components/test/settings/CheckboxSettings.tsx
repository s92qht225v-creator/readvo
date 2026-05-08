'use client';

import type { CheckboxOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { ChoiceListSettings } from './ChoiceListSettings';

export function CheckboxSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as CheckboxOptions;
  return (
    <ChoiceListSettings
      choices={opts.choices ?? []}
      minChoices={2}
      isGraded={isGraded}
      correctIndexes={opts.correctIndexes ?? []}
      multipleCorrect
      onChoices={choices => onChange({ ...q, options: { ...opts, choices } })}
      onCorrect={indexes => onChange({ ...q, options: { ...opts, correctIndexes: indexes } })}
    />
  );
}
