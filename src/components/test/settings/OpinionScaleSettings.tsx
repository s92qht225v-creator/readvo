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
            min={0}
            max={9}
            value={opts.min ?? 0}
            /* min clamped to 0..9 (must stay below max). */
            onChange={e => onChange({ ...q, options: { ...opts, min: Math.max(0, Math.min(9, Math.round(Number(e.target.value)) || 0)) } })}
            style={inputStyle}
          />
          <input
            type="number"
            min={1}
            max={10}
            value={opts.max ?? 10}
            /* max capped at 10 (the highest allowed point). Anything
               higher snaps to 10; floor of 1 keeps a valid range. */
            onChange={e => onChange({ ...q, options: { ...opts, max: Math.max(1, Math.min(10, Math.round(Number(e.target.value)) || 1)) } })}
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
