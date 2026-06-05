'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './tq-options.css';
import type {
  PublicQuestion, PublicMcOptions, PublicShortTextOptions, PublicPictureChoiceOptions,
  PublicMatchOptions, PublicOrderingOptions, PublicFillBlanksOptions, PublicScrambleOptions,
  PublicLongAnswerOptions, PublicNumberOptions, PublicDropdownOptions, PublicCheckboxOptions,
  PublicOpinionScaleOptions, PublicRatingOptions,
  AnswerSubmission, PinyinSegment,
} from '@/lib/test/types';
import { MathText } from './MathText';
import { PinyinText } from './PinyinText';
import { detectScriptLang } from '@/lib/test/scriptLang';
import { FillBlanksPlayer } from './renderers/FillBlanksRenderer';
import { MatchPlayer } from './renderers/MatchRenderer';
import { OrderingPlayer } from './renderers/OrderingRenderer';
import { ScramblePlayer } from './renderers/ScrambleRenderer';
import { ImageMatchPlayer } from './renderers/ImageMatchRenderer';
import { SpeakingRecorder } from './renderers/SpeakingRecorder';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* A choice label: pinyin-stacked when the server attached segments (test has
   "Show pinyin" on and the text has Han), else normal MathText, else the
   numbered placeholder. */
function ChoiceLabel({ text, pinyin, index }: { text: string; pinyin?: PinyinSegment[]; index: number }) {
  if (pinyin?.length) return <PinyinText segments={pinyin} />;
  return <>{text ? <MathText>{text}</MathText> : `Choice ${index + 1}`}</>;
}

type AValue = AnswerSubmission['value'];

interface Props {
  question: PublicQuestion;
  value: AValue;
  onChange: (v: AValue) => void;
  onSubmit: () => void;
  slug?: string;
  responseId?: string;
  respondentToken?: string;
}

export function QuestionRenderer({ question, value, onChange, onSubmit, slug, responseId, respondentToken }: Props) {
  if (question.type === 'multiple_choice') {
    const opts = question.options as PublicMcOptions;
    // Multiple choice / single + multi-select. Styling lives in
    // test-player.css under .tq-options/.tq-option/.tq-option__chip and
    // is driven by data-test-device CSS variables — no inline sizes here.
    return (
      <div
        className="tq-options"
        role={opts.allowMultiple ? 'group' : 'radiogroup'}
        aria-label={question.prompt}
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
              className="tq-option"
              role={opts.allowMultiple ? 'checkbox' : 'radio'}
              aria-checked={selected}
              data-selected={selected ? 'true' : 'false'}
            >
              {opts.allowMultiple ? (
                <span className="tq-option__check" aria-hidden="true">
                  {selected ? (
                    <svg width="14" height="14" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                      <path d="M6.5 13.4 10.7 17.6 19.8 8.4" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
              ) : (
                <span className="tq-option__chip" aria-hidden="true">{LETTERS[i] ?? i + 1}</span>
              )}
              <span className="tq-option__label" dir="auto" lang={detectScriptLang(c.text)}><ChoiceLabel text={c.text} pinyin={c.pinyin} index={i} /></span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'image_letters') {
    // Read the text → pick the LETTER of the matching image. Images labeled
    // A–F (upload order); answer choices are bare letters in the SAME order
    // (no shuffle). Single-select by choice id.
    const opts = question.options as PublicPictureChoiceOptions;
    const cols = typeof opts.columns === 'number' && opts.columns >= 1
      ? Math.min(Math.floor(opts.columns), 6)
      : null;
    const gridStyle = cols ? ({ '--pic-cols': String(cols) } as CSSProperties) : undefined;
    // When `imagesAsAnswers` is on, the letter-labeled images themselves are
    // the clickable answer and the separate A/B/C button row is hidden.
    const tapImage = !!opts.imagesAsAnswers;
    return (
      <div className="test-image-options">
        <div
          className="test-image-grid"
          data-cols={cols ?? undefined}
          style={gridStyle}
          role={tapImage ? 'radiogroup' : 'group'}
          aria-label={tapImage ? question.prompt : 'Images'}
        >
          {opts.choices.map((c, i) => {
            const selected = value.selectedId === c.id || value.selected === i;
            const letter = LETTERS[i] ?? `${i + 1}`;
            const inner = (
              <div
                className={`test-image-grid__img${c.image_url ? ' test-image-grid__img--has-image' : ''}`}
                style={c.image_url ? { backgroundImage: `url(${c.image_url})` } : undefined}
              >
                {!c.image_url ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                  </svg>
                ) : null}
                <span className="test-image-grid__label" aria-hidden="true">{letter}</span>
              </div>
            );
            if (tapImage) {
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange({ selectedId: c.id })}
                  className="test-image-grid__cell test-image-grid__cell--tappable"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Option ${letter}`}
                  data-selected={selected ? 'true' : 'false'}
                >
                  {inner}
                </button>
              );
            }
            return (
              <figure key={c.id} className="test-image-grid__cell">
                {inner}
              </figure>
            );
          })}
        </div>
        {tapImage ? null : (
          <div className="test-letter-options" role="radiogroup" aria-label={question.prompt}>
            {opts.choices.map((c, i) => {
              const selected = value.selectedId === c.id || value.selected === i;
              const letter = LETTERS[i] ?? `${i + 1}`;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange({ selectedId: c.id })}
                  className="test-letter-option"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Option ${letter}`}
                  data-selected={selected ? 'true' : 'false'}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (question.type === 'image_options') {
    // Matching: labeled image grid + the description list (shuffled order),
    // tap an image then a description to pair them. See ImageMatchPlayer.
    const opts = question.options as PublicPictureChoiceOptions;
    const cols = typeof opts.columns === 'number' && opts.columns >= 1
      ? Math.min(Math.floor(opts.columns), 6)
      : null;
    return (
      <ImageMatchPlayer
        choices={opts.choices}
        answerOrder={opts.answerOrder}
        cols={cols}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (question.type === 'picture_choice') {
    const opts = question.options as PublicPictureChoiceOptions;
    // Fixed images-per-row. Exposed as --pic-cols; the CSS computes the
    // exact 1/N flex-basis from it but ONLY on desktop (see tq-options.css)
    // — mobile always keeps its responsive 2-per-row default, since a phone
    // can't fit many tiny images side by side.
    const cols = typeof opts.columns === 'number' && opts.columns >= 1
      ? Math.min(Math.floor(opts.columns), 6)
      : null;
    const picStyle = cols
      ? ({ '--pic-cols': String(cols) } as CSSProperties)
      : undefined;
    return (
      <div
        className="test-picture-options"
        role={opts.allowMultiple ? 'group' : 'radiogroup'}
        aria-label={question.prompt}
        data-cols={cols ?? undefined}
        style={picStyle}
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
              className="test-picture-option"
              role={opts.allowMultiple ? 'checkbox' : 'radio'}
              aria-checked={selected}
              aria-pressed={selected}
              data-selected={selected ? 'true' : 'false'}
            >
              <div
                className={`test-picture-option__image${c.image_url ? ' test-picture-option__image--has-image' : ''}`}
                style={c.image_url ? { backgroundImage: `url(${c.image_url})` } : undefined}
              >
                {!c.image_url ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 16l5-5 4 4 3-3 6 6" />
                    <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
                    <path d="M19 5v4M21 7h-4" />
                  </svg>
                ) : null}
              </div>
              <div className="test-picture-option__label">
                <span className="test-picture-option__badge">{LETTERS[i] ?? i + 1}</span>
                <span className="test-picture-option__text" dir="auto" lang={detectScriptLang(c.text)}><ChoiceLabel text={c.text} pinyin={c.pinyin} index={i} /></span>
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
    // Dedicated checkbox question — same tq-* primitives as multiple_choice
    // multi-select. Sizing/colour live in test-player.css.
    const opts = question.options as PublicCheckboxOptions;
    const selectedIds = value.selectedIds ?? [];
    return (
      <div className="tq-options" role="group" aria-label={question.prompt}>
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
              className="tq-option"
              role="checkbox"
              aria-checked={selected}
              data-selected={selected ? 'true' : 'false'}
            >
              <span className="tq-option__check" aria-hidden="true">
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
              <span className="tq-option__label" dir="auto" lang={detectScriptLang(choice.text)}><ChoiceLabel text={choice.text} pinyin={choice.pinyin} index={i} /></span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'true_false') {
    // True/False — same tq-* primitives as multiple_choice single-select.
    return (
      <div className="tq-options" role="radiogroup" aria-label={question.prompt}>
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
              className="tq-option"
              role="radio"
              aria-checked={selected}
              data-selected={selected ? 'true' : 'false'}
            >
              <span className="tq-option__chip" aria-hidden="true">{LETTERS[i]}</span>
              <span className="tq-option__label" dir="auto">{label}</span>
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
      <input
        type="text"
        value={value.text ?? ''}
        maxLength={opts.maxLength}
        placeholder="Type your answer…"
        onChange={e => onChange({ text: e.target.value })}
        onKeyDown={e => {
          /* Single-line field: Enter submits/advances. */
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        autoCapitalize="sentences"
        dir="auto" className="test-short-answer"
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
        dir="auto" className="test-long-answer"
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
      />
    );
  }

  if (question.type === 'opinion_scale') {
    const opts = question.options as PublicOpinionScaleOptions;
    const min = Number.isFinite(opts.min) ? opts.min : 0;
    const max = Number.isFinite(opts.max) ? opts.max : 10;
    const values = Array.from({ length: Math.max(1, max - min + 1) }, (_, i) => min + i);
    /* Flat list of buttons. CSS handles row wrapping: mobile caps
       each button's max-width to fit ~6 per row (so 11 buttons wrap
       to 6 + 5); desktop removes the cap so all fit in one row. */
    return (
      <div className="test-opinion-scale">
        <div className="test-opinion-scale__scale" role="radiogroup" aria-label={question.prompt}>
          {values.map(n => {
            const selected = value.selected === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                data-selected={selected ? 'true' : 'false'}
                onClick={() => onChange({ selected: n })}
              >
                {n}
              </button>
            );
          })}
        </div>
        {(opts.minLabel || opts.maxLabel) ? (
          <div className="test-opinion-scale__labels">
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
      <div className="test-rating">
        {Array.from({ length: max }, (_, i) => i + 1).map(n => {
          const selected = (value.selected ?? 0) >= n;
          const symbol = opts.shape === 'number' ? n : opts.shape === 'heart' ? '♥' : selected ? '★' : '☆';
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ selected: n })}
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

  if (question.type === 'speaking') {
    const opts = question.options as { maxRecordingSeconds?: number };
    return (
      <SpeakingRecorder
        slug={slug ?? ''}
        responseId={responseId}
        respondentToken={respondentToken ?? ''}
        questionId={question.id}
        maxSeconds={opts.maxRecordingSeconds ?? 30}
        recorded={value?.recorded === true}
        onRecorded={() => onChange({ recorded: true })}
      />
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
        <span dir="auto" lang={detectScriptLang(selectedChoice?.text)}>{selectedChoice ? <ChoiceLabel text={selectedChoice.text} pinyin={selectedChoice.pinyin} index={0} /> : 'Select an answer'}</span>
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
                <span className="test-custom-dropdown__option-text" dir="auto" lang={detectScriptLang(choice.text)}><ChoiceLabel text={choice.text} pinyin={choice.pinyin} index={index} /></span>
                <span className="test-custom-dropdown__check">{selected ? '✓' : ''}</span>
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


/* Opinion-scale + rating styling lives in tq-options.css under
   the --os-* and --or-* device tokens. */
