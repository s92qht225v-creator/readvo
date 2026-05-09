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
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 6, alignItems: 'center', position: 'relative', paddingRight: pairs.length > 2 ? 20 : 0 }}>
            <input
              type="text" value={p.left}
              placeholder={`Left ${i + 1}`}
              onChange={e => setPair(i, { left: e.target.value })}
              style={inputStyle}
            />
            <input
              type="text" value={p.right}
              placeholder={`Right ${i + 1}`}
              onChange={e => setPair(i, { right: e.target.value })}
              style={inputStyle}
            />
            {pairs.length > 2 ? (
              <button
                type="button"
                onClick={() => removePair(i)}
                style={{ ...removeBtn, position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
        <button type="button" onClick={addPair} style={addChoiceBtn}>+ Add pair</button>
      </div>
    </Field>
  );
}
