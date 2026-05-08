'use client';

import type { RatingOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, inputStyle } from './_shared';

export function RatingSettings({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void;
}) {
  const opts = q.options as RatingOptions;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="Rating steps">
        <input
          type="number"
          min={2}
          max={10}
          value={opts.max ?? 5}
          onChange={e => onChange({ ...q, options: { ...opts, max: Math.max(2, Math.min(10, Number(e.target.value) || 5)) } })}
          style={inputStyle}
        />
      </Field>
      <Field label="Style">
        <select
          value={opts.shape ?? 'star'}
          onChange={e => onChange({ ...q, options: { ...opts, shape: e.target.value as RatingOptions['shape'] } })}
          style={inputStyle}
        >
          <option value="star">Stars</option>
          <option value="heart">Hearts</option>
          <option value="number">Numbers</option>
        </select>
      </Field>
    </div>
  );
}
