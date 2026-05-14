'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  PublicQuestion, PublicMcOptions, PublicShortTextOptions, PublicPictureChoiceOptions,
  PublicMatchOptions, PublicOrderingOptions, PublicFillBlanksOptions, PublicScrambleOptions,
  PublicLongAnswerOptions, PublicNumberOptions, PublicDropdownOptions, PublicCheckboxOptions,
  PublicOpinionScaleOptions, PublicRatingOptions,
  AnswerSubmission,
} from '@/lib/test/types';
import { FillBlanksPlayer } from './renderers/FillBlanksRenderer';
import { MatchPlayer } from './renderers/MatchRenderer';
import { OrderingPlayer } from './renderers/OrderingRenderer';
import { ScramblePlayer } from './renderers/ScrambleRenderer';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type AValue = AnswerSubmission['value'];

interface Props {
  question: PublicQuestion;
  value: AValue;
  onChange: (v: AValue) => void;
  onSubmit: () => void;
}

export function QuestionRenderer({ question, value, onChange, onSubmit }: Props) {
  if (question.type === 'multiple_choice') {
    const opts = question.options as PublicMcOptions;
    // Typeform palette: cool blue tile, darker blue letter+text.
    const TILE_BG = 'rgba(4, 69, 175, 0.1)';
    const TILE_BG_SEL = 'rgba(4, 69, 175, 0.18)';
    const TEXT = '#0445af';
    return (
      <div
        className="test-question-options"
        role={opts.allowMultiple ? 'group' : 'radiogroup'}
        aria-label={question.prompt}
        style={{ display: 'grid', gap: 8 }}
      >
        {opts.choices.map((c, i) => {
          const selected = opts.allowMultiple
            ? (value.selectedIds ?? []).includes(c.id)
            : value.selectedId === c.id || value.selected === i;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (!opts.allowMultiple) {
                  onChange({ selectedId: c.id });
                  return;
                }
                const current = value.selectedIds ?? [];
                onChange({
                  selectedIds: current.includes(c.id)
                    ? current.filter(id => id !== c.id)
                    : [...current, c.id],
                });
              }}
              className="test-question-option"
              role={opts.allowMultiple ? 'checkbox' : 'radio'}
              aria-checked={selected}
              data-selected={selected ? 'true' : 'false'}
              style={{
                textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px 4px 4px',
                minHeight: 36,
                fontSize: 16,
                background: selected ? TILE_BG_SEL : TILE_BG,
                color: TEXT,
                border: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                fontWeight: 400,
                fontFamily: 'inherit',
                transition: 'background-color 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, transform 0.12s ease',
              }}
            >
              {opts.allowMultiple ? (
                <span aria-hidden="true" style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 4,
                  background: selected ? TEXT : '#fff',
                  color: '#fff',
                  border: selected ? `1px solid ${TEXT}` : `2px solid ${TEXT}`,
                  boxSizing: 'border-box',
                  flexShrink: 0,
                  transition: 'background-color 0.16s ease, border-color 0.16s ease',
                }}>
                  {selected ? (
                    <svg width="14" height="14" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                      <path d="M6.5 13.4 10.7 17.6 19.8 8.4" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 3,
                  background: '#fff',
                  color: TEXT,
                  fontSize: 11, fontWeight: 700,
                  border: `1px solid ${TEXT}`,
                  flexShrink: 0,
                }}>{LETTERS[i] ?? i + 1}</span>
              )}
              <span style={{ flex: 1 }}>{c.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'picture_choice') {
    const opts = question.options as PublicPictureChoiceOptions;
    const TILE_BG = 'rgba(4, 69, 175, 0.08)';
    const TILE_BG_SEL = 'rgba(4, 69, 175, 0.18)';
    const TEXT = '#0445af';
    return (
      <div className="test-picture-options" role={opts.allowMultiple ? 'group' : 'radiogroup'} aria-label={question.prompt} style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      }}>
        {opts.choices.map((c, i) => {
          const selected = opts.allowMultiple
            ? (value.selectedIds ?? []).includes(c.id)
            : value.selectedId === c.id || value.selected === i;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (!opts.allowMultiple) {
                  onChange({ selectedId: c.id });
                  return;
                }
                const current = value.selectedIds ?? [];
                onChange({
                  selectedIds: current.includes(c.id)
                    ? current.filter(id => id !== c.id)
                    : [...current, c.id],
                });
              }}
              className="test-picture-option"
              role={opts.allowMultiple ? 'checkbox' : 'radio'}
              aria-checked={selected}
              aria-pressed={selected}
              data-selected={selected ? 'true' : 'false'}
              style={{
                display: 'flex', flexDirection: 'column',
                background: selected ? TILE_BG_SEL : TILE_BG,
                border: selected ? `2px solid ${TEXT}` : '2px solid transparent',
                borderRadius: 1,
                padding: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: TEXT,
                aspectRatio: '1 / 1.05',
                transition: 'background-color 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, transform 0.12s ease',
              }}
            >
              <div style={{
                flex: 1,
                background: 'rgba(4, 69, 175, 0.05)',
                border: `1px dashed ${TEXT}`,
                borderRadius: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 8,
                overflow: 'hidden',
                backgroundImage: c.image_url ? `url(${c.image_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}>
                {!c.image_url ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="1.5" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 16l5-5 4 4 3-3 6 6" />
                    <circle cx="9" cy="9" r="1.5" fill={TEXT} stroke="none" />
                    <path d="M19 5v4M21 7h-4" />
                  </svg>
                ) : null}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 14, textAlign: 'left',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 3,
                  background: '#fff',
                  color: TEXT,
                  fontSize: 11, fontWeight: 700,
                  border: `1px solid ${TEXT}`,
                  flexShrink: 0,
                }}>{LETTERS[i] ?? i + 1}</span>
                <span style={{
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{c.text || `Choice ${i + 1}`}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'dropdown') {
    const opts = question.options as PublicDropdownOptions;
    return (
      <CustomDropdownAnswer
        prompt={question.prompt}
        choices={opts.choices}
        selectedId={value.selectedId}
        onSelect={selectedId => onChange({ selectedId })}
      />
    );
  }

  if (question.type === 'checkbox') {
    const opts = question.options as PublicCheckboxOptions;
    const selectedIds = value.selectedIds ?? [];
    return (
      <div className="test-question-options test-checkbox-options" role="group" aria-label={question.prompt} style={{ display: 'grid', gap: 8 }}>
        {opts.choices.map(choice => {
          const selected = selectedIds.includes(choice.id);
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => onChange({
                selectedIds: selected
                  ? selectedIds.filter(id => id !== choice.id)
                  : [...selectedIds, choice.id],
              })}
              className="test-question-option test-checkbox-option"
              role="checkbox"
              aria-checked={selected}
              data-selected={selected ? 'true' : 'false'}
              style={checkboxButtonStyle}
            >
              <span className="test-checkbox-option__box" style={checkboxBoxStyle(selected)} aria-hidden="true">
                {selected ? (
                  <svg width="14" height="14" viewBox="0 0 26 26" fill="none">
                    <path
                      d="M6.5 13.4 10.7 17.6 19.8 8.4"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </span>
              <span style={{ flex: 1 }}>{choice.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'true_false') {
    const TILE_BG = 'rgba(4, 69, 175, 0.1)';
    const TILE_BG_SEL = 'rgba(4, 69, 175, 0.18)';
    const TEXT = '#0445af';
    return (
      <div className="test-question-options" role="radiogroup" aria-label={question.prompt} style={{ display: 'grid', gap: 8 }}>
        {[
          { val: true, label: 'True' },
          { val: false, label: 'False' },
        ].map(({ val, label }, i) => {
          const selected = value.bool === val;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ bool: val })}
              className="test-question-option"
              role="radio"
              aria-checked={selected}
              data-selected={selected ? 'true' : 'false'}
              style={{
                textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 8px 4px 4px',
                minHeight: 40,
                fontSize: 16,
                background: selected ? TILE_BG_SEL : TILE_BG,
                color: TEXT,
                border: 'none',
                borderRadius: 1,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 400,
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: 3,
                background: '#fff', color: TEXT,
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${TEXT}`,
                flexShrink: 0,
              }}>{LETTERS[i]}</span>
              <span style={{ flex: 1 }}>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'match') {
    const opts = question.options as PublicMatchOptions;
    return <MatchPlayer left={opts.left} right={opts.right} value={value} onChange={onChange} />;
  }

  if (question.type === 'ordering') {
    const opts = question.options as PublicOrderingOptions;
    return <OrderingPlayer items={opts.items} value={value} onChange={onChange} />;
  }

  if (question.type === 'fill_blanks') {
    const opts = question.options as PublicFillBlanksOptions;
    return <FillBlanksPlayer template={opts.template} blanks={opts.blanks} blankWidths={opts.blankWidths} value={value} onChange={onChange} />;
  }

  if (question.type === 'scramble') {
    const opts = question.options as PublicScrambleOptions;
    return <ScramblePlayer tiles={opts.tiles ?? []} unit={opts.unit === 'words' ? 'words' : 'letters'} value={value} onChange={onChange} />;
  }

  if (question.type === 'short_text') {
    const opts = question.options as PublicShortTextOptions;
    return (
      <textarea
        value={value.text ?? ''}
        rows={3}
        maxLength={opts.maxLength}
        placeholder="Type your answer…"
        onChange={e => onChange({ text: e.target.value })}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="test-short-answer"
        style={{
          width: '100%', padding: '12px 14px', fontSize: 16,
          border: '1px solid #cbd5e1', borderRadius: 1,
          fontFamily: 'inherit', resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  if (question.type === 'long_answer') {
    const opts = question.options as PublicLongAnswerOptions;
    return (
      <textarea
        value={value.text ?? ''}
        rows={6}
        maxLength={opts.maxLength}
        placeholder="Type your answer…"
        onChange={e => onChange({ text: e.target.value })}
        className="test-long-answer"
        style={{
          width: '100%', padding: '12px 14px', fontSize: 16,
          border: '1px solid #cbd5e1', borderRadius: 1,
          fontFamily: 'inherit', resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  if (question.type === 'number') {
    const opts = question.options as PublicNumberOptions;
    return (
      <input
        type="number"
        value={value.text ?? ''}
        min={opts.min}
        max={opts.max}
        placeholder="Type a number…"
        onChange={e => onChange({ text: e.target.value })}
        className="test-number-answer"
        style={{
          width: '100%', padding: '12px 14px', fontSize: 18,
          border: 'none', borderBottom: '1.5px solid #0445af',
          background: 'rgba(4,69,175,0.08)', color: '#0445af',
          borderRadius: 1, fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
    );
  }

  if (question.type === 'opinion_scale') {
    const opts = question.options as PublicOpinionScaleOptions;
    const min = Number.isFinite(opts.min) ? opts.min : 0;
    const max = Number.isFinite(opts.max) ? opts.max : 10;
    const values = Array.from({ length: Math.max(1, max - min + 1) }, (_, i) => min + i);
    const rows = [values.slice(0, 6), values.slice(6)];
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div className="test-opinion-scale" role="radiogroup" aria-label={question.prompt} style={opinionScaleWrap}>
          {rows.filter(row => row.length > 0).map((row, rowIndex) => (
            <div key={rowIndex} className="test-opinion-scale__row" style={opinionScaleRow}>
              {row.map(n => {
                const selected = value.selected === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-selected={selected ? 'true' : 'false'}
                    onClick={() => onChange({ selected: n })}
                    style={scaleButton(selected)}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {(opts.minLabel || opts.maxLabel) ? (
          <div className="test-opinion-scale__labels" style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12 }}>
            <span>{opts.minLabel}</span>
            <span>{opts.maxLabel}</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (question.type === 'rating') {
    const opts = question.options as PublicRatingOptions;
    const max = Math.max(2, Math.min(10, opts.max ?? 5));
    return (
      <div className="test-rating" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => {
          const selected = (value.selected ?? 0) >= n;
          const symbol = opts.shape === 'number' ? n : opts.shape === 'heart' ? '♥' : selected ? '★' : '☆';
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ selected: n })}
              style={ratingButton(selected)}
              data-selected={selected ? 'true' : 'false'}
              aria-label={`Rating ${n}`}
            >
              {symbol}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

function CustomDropdownAnswer({
  prompt,
  choices,
  selectedId,
  onSelect,
}: {
  prompt: string;
  choices: PublicDropdownOptions['choices'];
  selectedId?: string;
  onSelect: (selectedId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedChoice = choices.find(choice => choice.id === selectedId);
  const listboxId = `dropdown-${prompt.replace(/\W+/g, '-').toLowerCase().slice(0, 32)}`;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="test-dropdown-answer test-custom-dropdown">
      <button
        type="button"
        className="test-custom-dropdown__trigger"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={prompt}
        onClick={() => setOpen(value => !value)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{selectedChoice?.text || 'Select an answer'}</span>
        <ChevronDownIcon className="test-custom-dropdown__chevron" />
      </button>
      {open ? (
        <div id={listboxId} className="test-custom-dropdown__menu" role="listbox">
          {choices.map((choice, index) => {
            const selected = choice.id === selectedId;
            return (
              <button
                key={choice.id}
                type="button"
                className="test-custom-dropdown__option"
                role="option"
                aria-selected={selected}
                data-selected={selected ? 'true' : 'false'}
                onClick={() => {
                  onSelect(choice.id);
                  setOpen(false);
                }}
              >
                <span className="test-custom-dropdown__check">{selected ? '✓' : ''}</span>
                <span>{choice.text || `Choice ${index + 1}`}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M7.116 10.847a1.25 1.25 0 0 0 1.768 0L12.78 6.95a.75.75 0 0 0-1.06-1.06L8 9.61 4.28 5.89a.75.75 0 0 0-1.06 1.06z" />
    </svg>
  );
}

const choiceLetterStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 3,
  background: '#fff',
  color: '#0445af',
  fontSize: 11,
  fontWeight: 700,
  border: '1px solid #0445af',
  flexShrink: 0,
};

function choiceButtonStyle(selected: boolean): React.CSSProperties {
  return {
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 8px 4px 4px',
    minHeight: 36,
    fontSize: 16,
    background: selected ? 'rgba(4, 69, 175, 0.18)' : 'rgba(4, 69, 175, 0.1)',
    color: '#0445af',
    border: 'none',
    borderRadius: 1,
    cursor: 'pointer',
    fontWeight: 400,
    fontFamily: 'inherit',
  };
}

const checkboxButtonStyle: React.CSSProperties = {
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  padding: '8px 0',
  minHeight: 52,
  fontSize: 28,
  background: 'transparent',
  color: 'var(--test-theme-answer-text, #0445af)',
  border: 'none',
  borderRadius: 1,
  cursor: 'pointer',
  fontWeight: 400,
  fontFamily: 'inherit',
};

function checkboxBoxStyle(selected: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 4,
    background: selected ? 'var(--test-theme-answer, #0445af)' : '#fff',
    color: '#fff',
    border: selected
      ? '1px solid var(--test-theme-answer, #0445af)'
      : '2px solid var(--test-theme-answer, #0445af)',
    boxShadow: 'none',
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}

const opinionScaleWrap: React.CSSProperties = {
  width: 361,
  maxWidth: '100%',
  marginInline: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const opinionScaleRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 6,
  justifyContent: 'center',
};

function scaleButton(selected: boolean): React.CSSProperties {
  return {
    flex: '1 1 0%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 'calc(16.6667% - 5px)',
    height: 56,
    padding: 0,
    borderRadius: 1,
    border: 'none',
    boxShadow: selected ? 'rgba(1, 66, 172, 0.6) 0 0 0 2px inset' : 'rgba(1, 66, 172, 0.1) 0 0 0 1px inset',
    background: selected ? 'rgba(1, 66, 172, 0.15)' : 'rgba(255, 255, 255, 0.6)',
    color: 'rgb(38, 38, 39)',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };
}

function ratingButton(selected: boolean): React.CSSProperties {
  return {
    width: 46,
    height: 46,
    borderRadius: 1,
    border: '1px solid transparent',
    background: 'transparent',
    color: selected ? '#f59e0b' : '#6b7177',
    fontSize: 34,
    lineHeight: 1,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };
}
