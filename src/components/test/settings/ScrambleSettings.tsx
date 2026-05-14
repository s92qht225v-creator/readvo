'use client';

import type { ScrambleOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, inputStyle } from './_shared';

const SEGMENT_OUTER: React.CSSProperties = {
  display: 'inline-flex',
  border: '1px solid #dedde0',
  borderRadius: 6,
  overflow: 'hidden',
  background: '#fff',
};
const SEGMENT_BTN: React.CSSProperties = {
  border: 'none',
  background: '#fff',
  color: '#6d6470',
  fontSize: 13,
  padding: '6px 14px',
  cursor: 'pointer',
  borderLeft: '1px solid #dedde0',
};
const SEGMENT_BTN_ACTIVE: React.CSSProperties = {
  background: '#eeecef',
  color: '#3f3645',
};

export function ScrambleSettings({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void;
}) {
  const opts = q.options as ScrambleOptions;
  const unit: 'letters' | 'words' = opts.unit === 'words' ? 'words' : 'letters';
  const correct = opts.correctAnswer ?? '';

  return (
    <>
      <Field label="Correct answer">
        <input
          type="text"
          value={correct}
          onChange={e => onChange({
            ...q,
            options: { ...opts, correctAnswer: e.target.value },
          })}
          placeholder={unit === 'words' ? 'The quick brown fox' : 'hello'}
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          Students see this scrambled. Grading is case-insensitive after trim.
        </div>
      </Field>

      <Field label="Split by">
        <span style={SEGMENT_OUTER}>
          {(['letters', 'words'] as const).map((next, i) => (
            <button
              key={next}
              type="button"
              style={{
                ...SEGMENT_BTN,
                ...(i === 0 ? { borderLeft: 'none' } : null),
                ...(unit === next ? SEGMENT_BTN_ACTIVE : null),
              }}
              onClick={() => onChange({ ...q, options: { ...opts, unit: next } })}
            >
              {next === 'letters' ? 'Letters' : 'Words'}
            </button>
          ))}
        </span>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
          {unit === 'letters'
            ? 'Each visible character becomes its own tile. Whitespace is dropped.'
            : 'Each whitespace-separated word becomes its own tile.'}
        </div>
      </Field>
    </>
  );
}
