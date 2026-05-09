'use client';

import type { NumberOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, inputStyle } from './_shared';

export function NumberSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as NumberOptions;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {isGraded ? (
        <Field label="Correct number">
          <input
            type="number"
            value={opts.correctValue ?? ''}
            onChange={e => onChange({
              ...q,
              options: {
                ...opts,
                correctValue: e.target.value === '' ? null : Number(e.target.value),
              },
            })}
            placeholder="42"
            style={inputStyle}
          />
        </Field>
      ) : (
        <Field label="Answer">
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Survey mode — number is collected without scoring.</div>
        </Field>
      )}
      <Field label="Limits">
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            type="number"
            value={opts.min ?? ''}
            onChange={e => onChange({ ...q, options: { ...opts, min: e.target.value === '' ? undefined : Number(e.target.value) } })}
            placeholder="Min"
            style={inputStyle}
          />
          <input
            type="number"
            value={opts.max ?? ''}
            onChange={e => onChange({ ...q, options: { ...opts, max: e.target.value === '' ? undefined : Number(e.target.value) } })}
            placeholder="Max"
            style={inputStyle}
          />
        </div>
      </Field>
    </div>
  );
}
