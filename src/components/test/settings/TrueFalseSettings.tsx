'use client';

import type { TrueFalseOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field } from './_shared';

export function TrueFalseSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  if (!isGraded) {
    return (
      <Field label="Answer">
        <div style={{ fontSize: 12, color: '#94a3b8' }}>Survey mode — no correct answer.</div>
      </Field>
    );
  }
  const opts = q.options as TrueFalseOptions;
  return (
    <Field label="Correct answer">
      <div style={{ display: 'flex', gap: 6 }}>
        {[true, false].map(v => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange({ ...q, options: { correct: v } })}
            style={{
              flex: 1, padding: '8px 10px', fontSize: 13, fontWeight: 600,
              background: opts.correct === v ? '#1c1626' : '#fff',
              color: opts.correct === v ? '#fff' : '#1c1626',
              border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer',
            }}
          >
            {v ? 'True' : 'False'}
          </button>
        ))}
      </div>
    </Field>
  );
}
