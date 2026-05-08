'use client';

import type { FillBlank, FillBlanksOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, inputStyle, textareaStyle } from './_shared';

export function FillBlanksSettings({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as FillBlanksOptions;
  const blanks: FillBlank[] = opts.blanks ?? [];
  const template = opts.template ?? '';

  const detectAndSync = (newTemplate: string) => {
    const matches = [...newTemplate.matchAll(/\{(\d+)\}/g)].map(m => parseInt(m[1], 10));
    const max = matches.length > 0 ? Math.max(...matches) : 0;
    const next: FillBlank[] = [];
    for (let i = 0; i < max; i++) next.push(blanks[i] ?? { answer: '' });
    onChange({ ...q, options: { template: newTemplate, blanks: next } });
  };

  const setBlank = (i: number, patch: Partial<FillBlank>) => {
    const next = blanks.slice();
    next[i] = { ...next[i], ...patch };
    onChange({ ...q, options: { template, blanks: next } });
  };

  return (
    <>
      <Field label="Template">
        <textarea
          value={template}
          onChange={e => detectAndSync(e.target.value)}
          rows={3}
          placeholder={'The capital of France is {1}, and Italy is {2}.'}
          style={textareaStyle}
        />
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          Use <code>{'{1}'}</code>, <code>{'{2}'}</code>, … for blanks.
        </div>
      </Field>

      {blanks.length > 0 ? (
        <Field label="Correct answers">
          <div style={{ display: 'grid', gap: 6 }}>
            {blanks.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 22, fontSize: 11, color: '#94a3b8' }}>{`{${i + 1}}`}</span>
                <input
                  type="text" value={b.answer}
                  placeholder="Answer"
                  onChange={e => setBlank(i, { answer: e.target.value })}
                  style={inputStyle}
                />
              </div>
            ))}
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Matched case-insensitively after trim.
            </div>
          </div>
        </Field>
      ) : null}
    </>
  );
}
