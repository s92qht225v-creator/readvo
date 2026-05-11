'use client';

import { useState } from 'react';
import type {
  PublicQuestion, PublicMcOptions, PublicShortTextOptions, PublicPictureChoiceOptions,
  PublicMatchOptions, PublicOrderingOptions, PublicFillBlanksOptions,
  PublicLongAnswerOptions, PublicNumberOptions, PublicDropdownOptions, PublicCheckboxOptions,
  PublicOpinionScaleOptions, PublicRatingOptions,
  AnswerSubmission,
} from '@/lib/test/types';
import { FillBlanksPlayer } from './renderers/FillBlanksRenderer';
import { MatchPlayer } from './renderers/MatchRenderer';
import { OrderingPlayer } from './renderers/OrderingRenderer';

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
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: 3,
                background: '#fff',
                color: TEXT,
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${TEXT}`,
                flexShrink: 0,
              }}>{LETTERS[i] ?? i + 1}</span>
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
      <select
        value={value.selectedId ?? ''}
        onChange={e => onChange({ selectedId: e.target.value })}
        className="test-dropdown-answer"
        style={{
          width: '100%', padding: '12px 14px', fontSize: 16,
          border: '1px solid #cbd5e1', borderRadius: 1,
          background: '#fff', color: '#1c1626', fontFamily: 'inherit',
        }}
      >
        <option value="">Select an answer</option>
        {opts.choices.map((choice, i) => (
          <option key={choice.id} value={choice.id}>
            {choice.text || `Choice ${i + 1}`}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === 'checkbox') {
    const opts = question.options as PublicCheckboxOptions;
    const selectedIds = value.selectedIds ?? [];
    return (
      <div className="test-question-options" role="group" aria-label={question.prompt} style={{ display: 'grid', gap: 8 }}>
        {opts.choices.map((choice, i) => {
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
              className="test-question-option"
              role="checkbox"
              aria-checked={selected}
              data-selected={selected ? 'true' : 'false'}
              style={choiceButtonStyle(selected)}
            >
              <span style={choiceLetterStyle}>{LETTERS[i] ?? i + 1}</span>
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
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ selected: n })}
              style={ratingButton(selected)}
              aria-label={`Rating ${n}`}
            >
              {opts.shape === 'number' ? n : opts.shape === 'heart' ? '♥' : '☆'}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
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
