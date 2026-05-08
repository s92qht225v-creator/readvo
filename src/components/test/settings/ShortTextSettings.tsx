'use client';

import type { ShortTextOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, textareaStyle } from './_shared';

export function ShortTextSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as ShortTextOptions;
  if (!isGraded) {
    return (
      <Field label="Answer">
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Free-text response. No grading on this question.
        </div>
      </Field>
    );
  }
  const corrects = opts.correctAnswers ?? [];
  return (
    <Field label="Accepted answers (one per line)">
      <textarea
        value={corrects.join('\n')}
        onChange={e => onChange({
          ...q,
          options: { ...opts, correctAnswers: e.target.value.split('\n').filter(s => s.length > 0) },
        })}
        rows={3}
        placeholder={'beijing\nbeijíng'}
        style={textareaStyle}
      />
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
        Matched case-insensitively after trim.
      </div>
    </Field>
  );
}
