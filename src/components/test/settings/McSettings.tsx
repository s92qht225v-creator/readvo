'use client';

import type { MultipleChoiceOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import {
  Field, addChoiceBtn, inputStyle, removeBtn,
} from './_shared';

export function McSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as MultipleChoiceOptions;
  const choices = opts.choices ?? [];

  const setChoice = (i: number, v: string) => {
    const next = choices.slice();
    next[i] = v;
    onChange({ ...q, options: { ...opts, choices: next } });
  };
  const addChoice = () => {
    onChange({ ...q, options: { ...opts, choices: [...choices, ''] } });
  };
  const removeChoice = (i: number) => {
    const next = choices.filter((_, idx) => idx !== i);
    let correct = opts.correctIndex;
    let correctIndexes = opts.correctIndexes;
    if (correct != null) {
      if (correct === i) correct = null;
      else if (correct > i) correct -= 1;
    }
    if (correctIndexes) {
      correctIndexes = correctIndexes
        .filter(idx => idx !== i)
        .map(idx => (idx > i ? idx - 1 : idx));
    }
    onChange({ ...q, options: { ...opts, choices: next, correctIndex: correct, correctIndexes } });
  };
  const toggleCorrect = (i: number) => {
    if (!opts.allowMultiple) {
      onChange({ ...q, options: { ...opts, correctIndex: i, correctIndexes: [i] } });
      return;
    }
    const current = opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : []);
    onChange({
      ...q,
      options: {
        ...opts,
        correctIndexes: current.includes(i) ? current.filter(idx => idx !== i) : [...current, i],
        correctIndex: opts.correctIndex,
      },
    });
  };

  return (
    <Field label="Choices">
      <div style={{ display: 'grid', gap: 6 }}>
        {choices.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGraded ? (
              <input
                type={opts.allowMultiple ? 'checkbox' : 'radio'}
                name={`mc-${q.clientId}`}
                checked={opts.allowMultiple
                  ? (opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : [])).includes(i)
                  : opts.correctIndex === i}
                onChange={() => toggleCorrect(i)}
                title="Correct"
              />
            ) : (
              <span style={{ width: 14, fontSize: 11, color: '#cbd5e1' }}>{i + 1}.</span>
            )}
            <input
              type="text"
              value={c}
              placeholder={`Choice ${i + 1}`}
              onChange={e => setChoice(i, e.target.value)}
              style={inputStyle}
            />
            {choices.length > 2 ? (
              <button type="button" onClick={() => removeChoice(i)} style={removeBtn}>×</button>
            ) : null}
          </div>
        ))}
        <button type="button" onClick={addChoice} style={addChoiceBtn}>+ Add choice</button>
      </div>
    </Field>
  );
}
