'use client';

import type { TrueFalseOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';

export function TrueFalseSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  if (!isGraded) {
    return (
      <div style={{ fontSize: 12, color: '#94a3b8' }}>Survey mode — no correct answer.</div>
    );
  }
  const opts = q.options as TrueFalseOptions;
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {[true, false].map(v => (
        <label
          key={String(v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            fontSize: 13,
            fontWeight: 600,
            color: '#1c1626',
            cursor: 'pointer',
          }}
        >
          <input
            type="radio"
            name={`tf-${q.clientId}`}
            checked={opts.correct === v}
            onChange={() => onChange({ ...q, options: { correct: v } })}
            title="Correct"
          />
          {v ? 'True' : 'False'}
        </label>
      ))}
    </div>
  );
}
