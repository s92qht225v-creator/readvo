'use client';

import type { OrderingOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, addChoiceBtn, inputStyle, removeBtn } from './_shared';

export function OrderingSettings({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void;
}) {
  const opts = q.options as OrderingOptions;
  const items = opts.items ?? [];

  const setItem = (i: number, v: string) => {
    const next = items.slice();
    next[i] = v;
    onChange({ ...q, options: { items: next } });
  };
  const addItem = () => onChange({ ...q, options: { items: [...items, ''] } });
  const removeItem = (i: number) =>
    onChange({ ...q, options: { items: items.filter((_, idx) => idx !== i) } });

  return (
    <Field label="Items in correct order">
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, fontSize: 11, color: '#94a3b8' }}>{i + 1}.</span>
            <input
              type="text" value={it}
              placeholder={`Item ${i + 1}`}
              onChange={e => setItem(i, e.target.value)}
              style={inputStyle}
            />
            {items.length > 2 ? (
              <button type="button" onClick={() => removeItem(i)} style={removeBtn}>×</button>
            ) : null}
          </div>
        ))}
        <button type="button" onClick={addItem} style={addChoiceBtn}>+ Add item</button>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Players see them shuffled and drag into order.
        </div>
      </div>
    </Field>
  );
}
