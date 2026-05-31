'use client';

import type { SpeakingOptions, SpeakingRubricCriterion } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, addChoiceBtn, inputStyle, removeBtn } from './_shared';

export function SpeakingSettings({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void;
}) {
  const opts = q.options as SpeakingOptions;
  const rubric: SpeakingRubricCriterion[] = opts.rubric ?? [];
  const maxRecordingSeconds = opts.maxRecordingSeconds ?? 30;

  const setCriterion = (i: number, patch: Partial<SpeakingRubricCriterion>) => {
    const next = rubric.slice();
    next[i] = { ...next[i], ...patch };
    onChange({ ...q, options: { ...opts, rubric: next } });
  };
  const addCriterion = () =>
    onChange({
      ...q,
      options: {
        ...opts,
        rubric: [...rubric, { id: crypto.randomUUID(), text: '', weight: 1 }],
      },
    });
  const removeCriterion = (i: number) =>
    onChange({ ...q, options: { ...opts, rubric: rubric.filter((_, idx) => idx !== i) } });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Field label="Rubric criteria">
        <div style={{ display: 'grid', gap: 6 }}>
          {rubric.map((c, i) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 64px', gap: 6, alignItems: 'center', position: 'relative', paddingRight: rubric.length > 0 ? 26 : 0 }}>
              <input
                type="text" value={c.text}
                placeholder={`Criterion ${i + 1}`}
                onChange={e => setCriterion(i, { text: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                min={1}
                value={c.weight}
                title="Weight"
                onChange={e => setCriterion(i, { weight: Math.max(1, Math.round(Number(e.target.value)) || 1) })}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => removeCriterion(i)}
                style={{ ...removeBtn, position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
                aria-label="Remove criterion"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addCriterion} style={addChoiceBtn}>+ Add criterion</button>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            The AI scores each criterion met / partial / none → points. Max points = sum of weights.
          </div>
        </div>
      </Field>

      <Field label="Max recording seconds">
        <input
          type="number"
          min={5}
          max={120}
          value={maxRecordingSeconds}
          onChange={e => onChange({
            ...q,
            options: {
              ...opts,
              maxRecordingSeconds: Math.max(5, Math.min(120, Math.round(Number(e.target.value)) || 30)),
            },
          })}
          style={inputStyle}
        />
      </Field>
    </div>
  );
}
