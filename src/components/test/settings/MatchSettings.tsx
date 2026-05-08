'use client';

import type { MatchOptions, MatchPair } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, addChoiceBtn, inputStyle, removeBtn } from './_shared';

export function MatchSettings({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void;
}) {
  const opts = q.options as MatchOptions;
  const pairs: MatchPair[] = opts.pairs ?? [];

  const setPair = (i: number, patch: Partial<MatchPair>) => {
    const next = pairs.slice();
    next[i] = { ...next[i], ...patch };
    onChange({ ...q, options: { pairs: next } });
  };
  const addPair = () => onChange({ ...q, options: { pairs: [...pairs, { left: '', right: '' }] } });
  const removePair = (i: number) =>
    onChange({ ...q, options: { pairs: pairs.filter((_, idx) => idx !== i) } });

  return (
    <Field label="Pairs (left ↔ right)">
      <div style={{ display: 'grid', gap: 6 }}>
        {pairs.map((p, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: 6, alignItems: 'center' }}>
            <input
              type="text" value={p.left}
              placeholder={`Left ${i + 1}`}
              onChange={e => setPair(i, { left: e.target.value })}
              style={inputStyle}
            />
            <span style={{ color: '#cbd5e1' }}>↔</span>
            <input
              type="text" value={p.right}
              placeholder={`Right ${i + 1}`}
              onChange={e => setPair(i, { right: e.target.value })}
              style={inputStyle}
            />
            {pairs.length > 2 ? (
              <button type="button" onClick={() => removePair(i)} style={removeBtn}>×</button>
            ) : <span style={{ width: 24 }} />}
          </div>
        ))}
        <button type="button" onClick={addPair} style={addChoiceBtn}>+ Add pair</button>
      </div>
    </Field>
  );
}
