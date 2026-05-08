'use client';

import type React from 'react';
import type {
  CheckboxOptions, DropdownOptions, FillBlanksOptions, MultipleChoiceOptions,
  NumberOptions, PictureChoiceOptions, QuestionOptions, QuestionType, ShortTextOptions,
  TrueFalseOptions,
} from '@/lib/test/types';
import type { BuilderQuestion } from './builderTypes';
import { typePalette } from './questionTypeMeta';

export function AnswerKeyModal({ questions, onClose, onChange }: {
  questions: BuilderQuestion[];
  onClose: () => void;
  onChange: (clientId: string, options: QuestionOptions) => void;
}) {
  const gradable = questions.filter(q => q.type !== 'match' && q.type !== 'ordering');

  return (
    <div style={answerModalBackdrop} role="dialog" aria-modal="true" aria-label="Answers">
      <div style={answerModal}>
        <div style={answerModalHead}>
          <h2 style={answerModalTitle}>Answers</h2>
          <button type="button" onClick={onClose} style={answerModalClose}>×</button>
        </div>
        <div style={answerModalBody}>
          {gradable.length === 0 ? (
            <div style={answerEmpty}>
              Match and ordering questions use their saved order as the answer key.
            </div>
          ) : gradable.map((q) => (
            <AnswerKeyQuestion
              key={q.clientId}
              q={q}
              number={questions.findIndex(item => item.clientId === q.clientId) + 1}
              onChange={opts => onChange(q.clientId, opts)}
            />
          ))}
          {questions.some(q => q.type === 'match' || q.type === 'ordering') ? (
            <div style={answerInfo}>
              Match pairs and ordering items are graded from the correct order stored in their question settings.
            </div>
          ) : null}
        </div>
        <div style={answerModalFoot}>
          <button type="button" onClick={onClose} style={answerDoneBtn}>Done</button>
        </div>
      </div>
    </div>
  );
}

function AnswerKeyQuestion({ q, number, onChange }: {
  q: BuilderQuestion;
  number: number;
  onChange: (options: QuestionOptions) => void;
}) {
  return (
    <section style={answerQuestionCard}>
      <div style={answerQuestionHead}>
        <span style={answerQuestionNumber(q.type)}>{number}</span>
        <div style={{ minWidth: 0 }}>
          <div style={answerQuestionType}>{answerTypeLabel(q.type)}</div>
          <div style={answerQuestionPrompt}>{q.prompt || 'Untitled question'}</div>
        </div>
      </div>
      <AnswerKeyControls q={q} onChange={onChange} />
    </section>
  );
}

function AnswerKeyControls({ q, onChange }: {
  q: BuilderQuestion;
  onChange: (options: QuestionOptions) => void;
}) {
  if (q.type === 'multiple_choice') {
    const opts = q.options as MultipleChoiceOptions;
    const selected = opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : []);
    const setCorrect = (index: number) => {
      if (!opts.allowMultiple) {
        onChange({ ...opts, correctIndex: index, correctIndexes: [index] });
        return;
      }
      onChange({
        ...opts,
        correctIndexes: selected.includes(index)
          ? selected.filter(idx => idx !== index)
          : [...selected, index],
      });
    };
    return (
      <div style={answerOptionsGrid}>
        {(opts.choices ?? []).map((choice, index) => {
          const active = opts.allowMultiple ? selected.includes(index) : opts.correctIndex === index;
          return (
          <label key={index} style={answerOptionRow(active)}>
            <input
              type={opts.allowMultiple ? 'checkbox' : 'radio'}
              name={`answer-key-${q.clientId}`}
              checked={active}
              onChange={() => setCorrect(index)}
              style={answerRadio}
            />
            <span style={answerLetter(active)}>{String.fromCharCode(65 + index)}</span>
            <span>{choice || `Choice ${index + 1}`}</span>
          </label>
          );
        })}
      </div>
    );
  }

  if (q.type === 'picture_choice') {
    const opts = q.options as PictureChoiceOptions;
    const selected = opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : []);
    const setCorrect = (index: number) => {
      if (!opts.allowMultiple) {
        onChange({ ...opts, correctIndex: index, correctIndexes: [index] });
        return;
      }
      onChange({
        ...opts,
        correctIndexes: selected.includes(index)
          ? selected.filter(idx => idx !== index)
          : [...selected, index],
      });
    };
    return (
      <div style={answerOptionsGrid}>
        {(opts.choices ?? []).map((choice, index) => {
          const active = opts.allowMultiple ? selected.includes(index) : opts.correctIndex === index;
          return (
          <label key={index} style={answerOptionRow(active)}>
            <input
              type={opts.allowMultiple ? 'checkbox' : 'radio'}
              name={`answer-key-${q.clientId}`}
              checked={active}
              onChange={() => setCorrect(index)}
              style={answerRadio}
            />
            <span style={answerLetter(active)}>{String.fromCharCode(65 + index)}</span>
            <span>{choice.text || `Choice ${index + 1}`}</span>
          </label>
          );
        })}
      </div>
    );
  }

  if (q.type === 'true_false') {
    const opts = q.options as TrueFalseOptions;
    return (
      <div style={answerTrueFalseWrap}>
        {[true, false].map(value => (
          <button
            key={String(value)}
            type="button"
            onClick={() => onChange({ correct: value })}
            style={answerToggle(opts.correct === value)}
          >
            {value ? 'True' : 'False'}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === 'short_text') {
    const opts = q.options as ShortTextOptions;
    return (
      <textarea
        value={(opts.correctAnswers ?? []).join('\n')}
        onChange={event => onChange({
          ...opts,
          correctAnswers: event.target.value.split('\n').filter(line => line.trim().length > 0),
        })}
        rows={3}
        placeholder="One accepted answer per line"
        style={answerTextarea}
      />
    );
  }

  if (q.type === 'number') {
    const opts = q.options as NumberOptions;
    return (
      <input
        type="number"
        value={opts.correctValue ?? ''}
        onChange={event => onChange({
          ...opts,
          correctValue: event.target.value === '' ? null : Number(event.target.value),
        })}
        placeholder="Correct number"
        style={answerInput}
      />
    );
  }

  if (q.type === 'dropdown') {
    const opts = q.options as DropdownOptions;
    return (
      <div style={answerOptionsGrid}>
        {(opts.choices ?? []).map((choice, index) => {
          const active = opts.correctIndex === index;
          return (
            <label key={index} style={answerOptionRow(active)}>
              <input
                type="radio"
                name={`answer-key-${q.clientId}`}
                checked={active}
                onChange={() => onChange({ ...opts, correctIndex: index })}
                style={answerRadio}
              />
              <span style={answerLetter(active)}>{String.fromCharCode(65 + index)}</span>
              <span>{choice || `Choice ${index + 1}`}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (q.type === 'checkbox') {
    const opts = q.options as CheckboxOptions;
    const selected = opts.correctIndexes ?? [];
    return (
      <div style={answerOptionsGrid}>
        {(opts.choices ?? []).map((choice, index) => {
          const active = selected.includes(index);
          return (
            <label key={index} style={answerOptionRow(active)}>
              <input
                type="checkbox"
                checked={active}
                onChange={() => onChange({
                  ...opts,
                  correctIndexes: active
                    ? selected.filter(idx => idx !== index)
                    : [...selected, index],
                })}
                style={answerRadio}
              />
              <span style={answerLetter(active)}>{String.fromCharCode(65 + index)}</span>
              <span>{choice || `Choice ${index + 1}`}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (q.type === 'fill_blanks') {
    const opts = q.options as FillBlanksOptions;
    return (
      <div style={answerOptionsGrid}>
        {(opts.blanks ?? []).map((blank, index) => (
          <label key={index} style={answerBlankRow}>
            <span style={answerLetter(false)}>{`{${index + 1}}`}</span>
            <input
              type="text"
              value={blank.answer}
              onChange={event => {
                const next = (opts.blanks ?? []).slice();
                next[index] = { ...blank, answer: event.target.value };
                onChange({ ...opts, blanks: next });
              }}
              placeholder="Correct answer"
              style={answerInput}
            />
          </label>
        ))}
      </div>
    );
  }

  return null;
}

function answerTypeLabel(type: BuilderQuestion['type']) {
  if (type === 'multiple_choice') return 'Multiple choice';
  if (type === 'short_text') return 'Short text';
  if (type === 'long_answer') return 'Long answer';
  if (type === 'number') return 'Number';
  if (type === 'dropdown') return 'Dropdown';
  if (type === 'checkbox') return 'Checkbox';
  if (type === 'opinion_scale') return 'Opinion scale';
  if (type === 'rating') return 'Rating';
  if (type === 'picture_choice') return 'Picture choice';
  if (type === 'true_false') return 'True / False';
  if (type === 'match') return 'Match pairs';
  if (type === 'ordering') return 'Ordering';
  return 'Fill in the blanks';
}

const answerModalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: 'rgba(47, 37, 51, 0.48)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const answerModal: React.CSSProperties = {
  width: 'min(1040px, 100%)',
  height: 'min(86vh, 820px)',
  background: '#fff',
  border: '1px solid #ded8d1',
  borderRadius: 16,
  boxShadow: '0 34px 100px rgba(47, 37, 51, 0.24)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const answerModalHead: React.CSSProperties = {
  padding: '20px 26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#fff',
  borderBottom: '1px solid #e7e2dc',
};

const answerModalTitle: React.CSSProperties = {
  margin: 0,
  color: '#2f2835',
  fontSize: 25,
  fontWeight: 760,
  letterSpacing: -0.4,
};

const answerModalClose: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: 'none',
  background: '#f4f1ee',
  color: '#2f2835',
  fontSize: 22,
  cursor: 'pointer',
};

const answerModalBody: React.CSSProperties = {
  padding: 20,
  overflow: 'auto',
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  background: '#fbfaf8',
};

const answerModalFoot: React.CSSProperties = {
  padding: '16px 24px',
  display: 'flex',
  justifyContent: 'flex-end',
  background: '#fff',
  borderTop: '1px solid #e7e2dc',
};

const answerDoneBtn: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: 999,
  background: '#2f2533',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
};

const answerQuestionCard: React.CSSProperties = {
  border: '1px solid #e4ded8',
  borderRadius: 14,
  background: '#fff',
  overflow: 'hidden',
  flexShrink: 0,
  boxShadow: '0 8px 22px rgba(47,40,53,0.04)',
};

const answerQuestionHead: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '42px minmax(0, 1fr)',
  alignItems: 'start',
  gap: 12,
  padding: '16px 20px',
  background: '#fff',
  borderBottom: '1px solid #f0ebe6',
};

const answerQuestionNumber = (type: QuestionType): React.CSSProperties => ({
  width: 34,
  height: 30,
  borderRadius: 8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: typePalette[type]?.bg ?? '#f1f5f9',
  color: typePalette[type]?.color ?? '#64748b',
  fontWeight: 850,
});

const answerQuestionType: React.CSSProperties = {
  color: '#8b848f',
  fontSize: 11,
  fontWeight: 850,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 4,
};

const answerQuestionPrompt: React.CSSProperties = {
  color: '#2f2835',
  fontSize: 16,
  fontWeight: 760,
  lineHeight: 1.35,
};

const answerOptionsGrid: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: '18px 20px 20px',
};

const answerOptionRow = (active: boolean): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: '22px 32px minmax(0, 1fr)',
  alignItems: 'center',
  gap: 10,
  minHeight: 42,
  padding: '6px 10px',
  border: active ? '1.5px solid #2f2533' : '1px solid #e4ded8',
  borderRadius: 10,
  background: active ? '#fbfaf8' : '#fff',
  color: '#2f2835',
  cursor: 'pointer',
  boxShadow: active ? '0 6px 18px rgba(47, 37, 51, 0.08)' : 'none',
});

const answerBlankRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '44px minmax(0, 1fr)',
  alignItems: 'center',
  gap: 10,
  minHeight: 42,
};

const answerRadio: React.CSSProperties = {
  accentColor: '#2f2533',
};

const answerLetter = (active: boolean): React.CSSProperties => ({
  minWidth: 24,
  height: 24,
  borderRadius: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: active ? '#2f2533' : '#f4f1ee',
  color: active ? '#fff' : '#6b6470',
  fontSize: 12,
  fontWeight: 850,
});

const answerToggle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px 14px',
  borderRadius: 10,
  border: active ? '1px solid #2f2533' : '1px solid #ded8d1',
  background: active ? '#2f2533' : '#fff',
  color: active ? '#fff' : '#2f2835',
  fontWeight: 850,
  cursor: 'pointer',
});

const answerTrueFalseWrap: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  padding: '18px 20px 20px',
};

const answerTextarea: React.CSSProperties = {
  margin: '18px 20px 20px',
  width: 'calc(100% - 40px)',
  boxSizing: 'border-box',
  padding: 14,
  borderRadius: 10,
  border: '1px solid #ded8d1',
  fontFamily: 'inherit',
  fontSize: 15,
  lineHeight: 1.45,
  resize: 'vertical',
  outline: 'none',
};

const answerInput: React.CSSProperties = {
  padding: '11px 12px',
  border: '1px solid #ded8d1',
  borderRadius: 9,
  background: '#fff',
  color: '#2f2835',
  fontSize: 14,
  outline: 'none',
};

const answerInfo: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  background: '#fbfaf8',
  border: '1px solid #e7e2dc',
  color: '#6b6470',
  fontSize: 13,
};

const answerEmpty: React.CSSProperties = {
  padding: 24,
  borderRadius: 14,
  background: '#fbfaf8',
  border: '1px solid #e7e2dc',
  color: '#6b6470',
  textAlign: 'center',
};
