'use client';

import type { DropdownOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { ChoiceListSettings } from './ChoiceListSettings';

export function DropdownSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as DropdownOptions;
  return (
    <ChoiceListSettings
      choices={opts.choices ?? []}
      minChoices={2}
      isGraded={isGraded}
      correctIndexes={opts.correctIndex != null ? [opts.correctIndex] : []}
      multipleCorrect={false}
      onChoices={choices => onChange({ ...q, options: { ...opts, choices } })}
      onCorrect={indexes => onChange({ ...q, options: { ...opts, correctIndex: indexes[0] ?? null } })}
    />
  );
}
