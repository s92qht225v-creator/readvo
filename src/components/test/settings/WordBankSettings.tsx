'use client';

import type { PictureChoice, PictureChoiceOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { Field, ToggleRow, addChoiceBtn, inputStyle, removeBtn } from './_shared';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Word bank (HSK banked gap-fill). Single-select: author types each word into
 * the bank (rendered A–F in order, no shuffle) and marks the one that fills the
 * gap in the question sentence. No images, no multi-select.
 */
export function WordBankSettings({ q, onChange, isGraded }: {
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
    onChange({ ...q, options: { ...opts, choices: [...choices, { text: '' }] } });
  };
  const removeChoice = (i: number) => {
    const next = choices.filter((_, idx) => idx !== i);
    let correct = opts.correctIndex;
    if (correct != null) {
      if (correct === i) correct = null;
      else if (correct > i) correct -= 1;
    }
    onChange({ ...q, options: { ...opts, choices: next, correctIndex: correct, correctIndexes: correct != null ? [correct] : [] } });
  };
  const setCorrect = (i: number) => {
    onChange({ ...q, options: { ...opts, correctIndex: i, correctIndexes: [i] } });
  };

  return (
    <>
    <Field label="Answer mode">
      <ToggleRow
        label="Tap the word to answer"
        checked={!!opts.imagesAsAnswers}
        onChange={(v) => onChange({ ...q, options: { ...opts, imagesAsAnswers: v } })}
        hint="hides the letter buttons"
      />
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
        When on, the word-bank cells become the clickable answer and the
        separate A/B/C row below them is hidden.
      </div>
    </Field>
    <Field label="Word bank">
      <div style={{ display: 'grid', gap: 8 }}>
        {choices.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGraded ? (
              <input
                type="radio"
                name={`wb-${q.clientId}`}
                checked={opts.correctIndex === i}
                onChange={() => setCorrect(i)}
                title="Correct answer"
              />
            ) : (
              <span style={{ width: 16, fontSize: 12, fontWeight: 700, color: '#94a3b8', textAlign: 'center' }}>
                {LETTERS[i] ?? i + 1}
              </span>
            )}
            <input
              type="text"
              value={c.text}
              placeholder={`Word ${LETTERS[i] ?? i + 1}`}
              onChange={e => setChoice(i, { text: e.target.value })}
              style={inputStyle}
            />
            {choices.length > 2 ? (
              <button type="button" onClick={() => removeChoice(i)} style={removeBtn}>×</button>
            ) : null}
          </div>
        ))}
        <button type="button" onClick={addChoice} style={addChoiceBtn}>+ Add word</button>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Words show A–F in this order (no shuffle). The student reads the
          question sentence and taps the letter of the matching word.
        </div>
      </div>
    </Field>
    </>
  );
}
