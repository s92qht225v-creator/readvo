'use client';

import {
  Field, addChoiceBtn, inputStyle, removeBtn,
} from './_shared';

export function ChoiceListSettings({ choices, minChoices, isGraded, correctIndexes, multipleCorrect, onChoices, onCorrect }: {
  choices: string[];
  minChoices: number;
  isGraded: boolean;
  correctIndexes: number[];
  multipleCorrect: boolean;
  onChoices: (choices: string[]) => void;
  onCorrect: (indexes: number[]) => void;
}) {
  const setChoice = (i: number, value: string) => {
    const next = choices.slice();
    next[i] = value;
    onChoices(next);
  };
  const addChoice = () => onChoices([...choices, '']);
  const removeChoice = (i: number) => {
    const nextChoices = choices.filter((_, idx) => idx !== i);
    const nextCorrect = correctIndexes
      .filter(idx => idx !== i)
      .map(idx => (idx > i ? idx - 1 : idx));
    onChoices(nextChoices);
    onCorrect(nextCorrect);
  };
  const toggleCorrect = (i: number) => {
    if (!multipleCorrect) {
      onCorrect([i]);
      return;
    }
    onCorrect(correctIndexes.includes(i)
      ? correctIndexes.filter(idx => idx !== i)
      : [...correctIndexes, i]);
  };

  return (
    <Field label="Choices">
      <div style={{ display: 'grid', gap: 6 }}>
        {choices.map((choice, i) => {
          const active = correctIndexes.includes(i);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isGraded ? (
                <input
                  type={multipleCorrect ? 'checkbox' : 'radio'}
                  checked={active}
                  onChange={() => toggleCorrect(i)}
                  title="Correct"
                />
              ) : (
                <span style={{ width: 14, fontSize: 11, color: '#cbd5e1' }}>{i + 1}.</span>
              )}
              <input
                type="text"
                value={choice}
                placeholder={`Choice ${i + 1}`}
                onChange={e => setChoice(i, e.target.value)}
                style={inputStyle}
              />
              {choices.length > minChoices ? (
                <button type="button" onClick={() => removeChoice(i)} style={removeBtn}>×</button>
              ) : null}
            </div>
          );
        })}
        <button type="button" onClick={addChoice} style={addChoiceBtn}>+ Add choice</button>
      </div>
    </Field>
  );
}
