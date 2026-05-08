'use client';

import type { PictureChoice, PictureChoiceOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import {
  Field, addChoiceBtn, correctAnswerBlock, correctAnswerChip,
  correctAnswerChoices, correctAnswerLabel, inputStyle, removeBtn,
} from './_shared';

export function PictureChoiceSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as PictureChoiceOptions;
  const choices = opts.choices ?? [];

  const setChoice = (i: number, patch: Partial<PictureChoice>) => {
    const next = choices.slice();
    next[i] = { ...next[i], ...patch };
    onChange({ ...q, options: { ...opts, choices: next } });
  };
  const addChoice = () => {
    onChange({ ...q, options: { ...opts, choices: [...choices, { text: '', image_url: undefined }] } });
  };
  const removeChoice = (i: number) => {
    const next = choices.filter((_, idx) => idx !== i);
    let correct = opts.correctIndex;
    let correctIndexes = opts.correctIndexes;
    if (correct != null) {
      if (correct === i) correct = null;
      else if (correct > i) correct -= 1;
    }
    if (correctIndexes) {
      correctIndexes = correctIndexes
        .filter(idx => idx !== i)
        .map(idx => (idx > i ? idx - 1 : idx));
    }
    onChange({ ...q, options: { ...opts, choices: next, correctIndex: correct, correctIndexes } });
  };
  const toggleCorrect = (i: number) => {
    if (!opts.allowMultiple) {
      onChange({ ...q, options: { ...opts, correctIndex: i, correctIndexes: [i] } });
      return;
    }
    const current = opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : []);
    onChange({
      ...q,
      options: {
        ...opts,
        correctIndexes: current.includes(i) ? current.filter(idx => idx !== i) : [...current, i],
        correctIndex: opts.correctIndex,
      },
    });
  };

  return (
    <Field label="Choices">
      <div style={{ display: 'grid', gap: 8 }}>
        {choices.map((c, i) => (
          <div key={i} style={{
            border: '1px solid #ebe9eb', borderRadius: 6, padding: 8,
            display: 'grid', gap: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGraded ? (
              <input
                  type={opts.allowMultiple ? 'checkbox' : 'radio'}
                  name={`pc-${q.clientId}`}
                  checked={opts.allowMultiple
                    ? (opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : [])).includes(i)
                    : opts.correctIndex === i}
                  onChange={() => toggleCorrect(i)}
                  title="Correct"
                />
              ) : (
                <span style={{ width: 14, fontSize: 11, color: '#cbd5e1' }}>{i + 1}.</span>
              )}
              <input
                type="text"
                value={c.text}
                placeholder={`Choice ${i + 1}`}
                onChange={e => setChoice(i, { text: e.target.value })}
                style={inputStyle}
              />
              {choices.length > 2 ? (
                <button type="button" onClick={() => removeChoice(i)} style={removeBtn}>×</button>
              ) : null}
            </div>
            <input
              type="url"
              value={c.image_url ?? ''}
              placeholder="Image URL (https://…)"
              onChange={e => setChoice(i, { image_url: e.target.value || undefined })}
              style={{ ...inputStyle, fontSize: 12 }}
            />
          </div>
        ))}
        <button type="button" onClick={addChoice} style={addChoiceBtn}>+ Add choice</button>
        {isGraded ? (
          <div style={correctAnswerBlock}>
            <div style={correctAnswerLabel}>Correct answer</div>
            <div style={correctAnswerChoices}>
              {choices.map((choice, index) => {
                const active = opts.allowMultiple
                  ? (opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : [])).includes(index)
                  : opts.correctIndex === index;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleCorrect(index)}
                    style={correctAnswerChip(active)}
                  >
                    <span>{String.fromCharCode(65 + index)}</span>
                    <span>{choice.text || `Choice ${index + 1}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Paste an image URL for each choice. File upload comes later.
        </div>
      </div>
    </Field>
  );
}
