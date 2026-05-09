'use client';

import type { OpinionScaleOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, inputStyle } from './_shared';

export function OpinionScaleSettings({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void;
}) {
  const opts = q.options as OpinionScaleOptions;
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="Scale">
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            type="number"
            value={opts.min ?? 0}
            onChange={e => onChange({ ...q, options: { ...opts, min: Number(e.target.value) } })}
            style={inputStyle}
          />
          <input
            type="number"
            value={opts.max ?? 10}
            onChange={e => onChange({ ...q, options: { ...opts, max: Number(e.target.value) } })}
            style={inputStyle}
          />
        </div>
      </Field>
      <Field label="Labels">
        <div style={{ display: 'grid', gap: 8 }}>
          <input value={opts.minLabel ?? ''} onChange={e => onChange({ ...q, options: { ...opts, minLabel: e.target.value } })} placeholder="Low label" style={inputStyle} />
          <input value={opts.maxLabel ?? ''} onChange={e => onChange({ ...q, options: { ...opts, maxLabel: e.target.value } })} placeholder="High label" style={inputStyle} />
        </div>
      </Field>
    </div>
  );
}
