'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  CheckboxOptions, DropdownOptions, MultipleChoiceOptions, PictureChoiceOptions,
  QuestionMedia,
} from '@/lib/test/types';
import type { BuilderQuestion } from './builderTypes';
import { CheckboxSettings } from './settings/CheckboxSettings';
import { DropdownSettings } from './settings/DropdownSettings';
import { FillBlanksSettings } from './settings/FillBlanksSettings';
import { LongAnswerSettings } from './settings/LongAnswerSettings';
import { MatchSettings } from './settings/MatchSettings';
import { McSettings } from './settings/McSettings';
import { NumberSettings } from './settings/NumberSettings';
import { OpinionScaleSettings } from './settings/OpinionScaleSettings';
import { OrderingSettings } from './settings/OrderingSettings';
import { PictureChoiceSettings } from './settings/PictureChoiceSettings';
import { RatingSettings } from './settings/RatingSettings';
import { ShortTextSettings } from './settings/ShortTextSettings';
import { TrueFalseSettings } from './settings/TrueFalseSettings';
import { Field, TextLengthBehavior, ToggleRow, kicker, textareaStyle } from './settings/_shared';
import { DeviceIconFrame, LayoutIcon } from './media/LayoutIcons';
import { MediaGalleryModal } from './media/MediaGalleryModal';
import { MediaSettingsModal } from './media/MediaSettingsModal';
import { getQuestionMedia, normalizeDesktopLayout, setQuestionMedia } from './media/_helpers';

interface Props {
  q: BuilderQuestion;
  isGraded: boolean;
  index: number;
  total: number;
  onChange: (q: BuilderQuestion) => void;
}

export function SettingsPanel({ q, isGraded, index, total, onChange }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaSettingsOpen, setMediaSettingsOpen] = useState(false);

  return (
    <div style={panel}>
      <div style={panelHeader}>
        <div>
          <div style={kicker}>Question {index + 1} of {total}</div>
          <div style={panelTitle}>{typeLabel(q.type)}</div>
        </div>
      </div>

      <Section title="Content" hideTitle>
        <Field label="Question text">
          <textarea
            value={q.prompt}
            onChange={e => onChange({ ...q, prompt: e.target.value })}
            rows={3}
            placeholder="What do you want to ask?"
            style={textareaStyle}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={getQuestionDescription(q)}
            onChange={e => onChange(setQuestionDescription(q, e.target.value))}
            rows={2}
            placeholder="Add context, hint, or instruction (optional)"
            style={textareaStyle}
          />
        </Field>
      </Section>

      <Section title="Answer">
        {q.type === 'multiple_choice' && <McSettings q={q} onChange={onChange} isGraded={isGraded} />}
        {q.type === 'short_text' && <ShortTextSettings q={q} onChange={onChange} isGraded={isGraded} />}
        {q.type === 'long_answer' && <LongAnswerSettings />}
        {q.type === 'number' && <NumberSettings q={q} onChange={onChange} isGraded={isGraded} />}
        {q.type === 'dropdown' && <DropdownSettings q={q} onChange={onChange} isGraded={isGraded} />}
        {q.type === 'checkbox' && <CheckboxSettings q={q} onChange={onChange} isGraded={isGraded} />}
        {q.type === 'opinion_scale' && <OpinionScaleSettings q={q} onChange={onChange} />}
        {q.type === 'rating' && <RatingSettings q={q} onChange={onChange} />}
        {q.type === 'picture_choice' && <PictureChoiceSettings q={q} onChange={onChange} isGraded={isGraded} />}
        {q.type === 'true_false' && <TrueFalseSettings q={q} onChange={onChange} isGraded={isGraded} />}
        {q.type === 'match' && <MatchSettings q={q} onChange={onChange} />}
        {q.type === 'ordering' && <OrderingSettings q={q} onChange={onChange} />}
        {q.type === 'fill_blanks' && <FillBlanksSettings q={q} onChange={onChange} isGraded={isGraded} />}
      </Section>

      <Section title="Behavior">
        <ToggleRow
          label="Required"
          checked={q.required}
          onChange={v => onChange({ ...q, required: v })}
        />
        {(q.type === 'multiple_choice' || q.type === 'picture_choice' || q.type === 'dropdown' || q.type === 'checkbox') ? (
          <>
            <ToggleRow
              label="Randomize"
              checked={!!(q.options as MultipleChoiceOptions | PictureChoiceOptions | DropdownOptions | CheckboxOptions).randomize}
              onChange={v => onChange(setChoiceBehavior(q, { randomize: v }))}
            />
            {(q.type === 'multiple_choice' || q.type === 'picture_choice') ? (
              <ToggleRow
                label="Multiple selection"
                checked={!!(q.options as MultipleChoiceOptions | PictureChoiceOptions).allowMultiple}
                onChange={v => onChange(setChoiceBehavior(q, { allowMultiple: v }))}
              />
            ) : null}
            <div style={staticNote}>
              Randomize only shuffles answer choices for this question. It does not change question order.
            </div>
          </>
        ) : null}
        {q.type === 'short_text' || q.type === 'long_answer' ? (
          <TextLengthBehavior q={q} onChange={onChange} />
        ) : null}
        <MediaRow
          q={q}
          onOpen={() => setMediaOpen(true)}
          onSettings={() => setMediaSettingsOpen(true)}
          onRemove={() => onChange(setQuestionMedia(q, undefined))}
        />
        {getQuestionMedia(q)?.url ? (
          <MediaLayoutControls q={q} onChange={onChange} />
        ) : null}
      </Section>
      {mediaOpen ? (
        <MediaGalleryModal
          q={q}
          onClose={() => setMediaOpen(false)}
          onChange={next => {
            onChange(next);
            setMediaOpen(false);
          }}
        />
      ) : null}
      {mediaSettingsOpen ? (
        <MediaSettingsModal
          q={q}
          onClose={() => setMediaSettingsOpen(false)}
          onChange={next => {
            onChange(next);
            setMediaSettingsOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function MediaRow({ q, onOpen, onSettings, onRemove }: {
  q: BuilderQuestion; onOpen: () => void; onSettings: () => void; onRemove: () => void;
}) {
  const media = getQuestionMedia(q);
  return (
    <div style={mediaRowWrap}>
      <div style={mediaRowTop}>
        <div>
          <div style={mediaRowTitle}>Image or video</div>
        </div>
        {media?.url ? (
          <div style={mediaActions}>
            <button type="button" onClick={onOpen} style={mediaIconButton} title="Change media" aria-label="Change media">
              <svg width="18" height="18" fill="none" viewBox="0 0 16 16" aria-hidden>
                <g fill="currentColor">
                  <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11H11v3.25A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25v-7.5C0 5.784.784 5 1.75 5H5zM6.5 5h2.75c.933 0 1.695.73 1.747 1.65l1.44-.897a.75.75 0 0 1 .812.012l1.251.834V1.75a.25.25 0 0 0-.25-.25h-7.5a.25.25 0 0 0-.25.25zm8 3.401-1.68-1.12L11 8.416V9.5h3.25a.25.25 0 0 0 .25-.25zm-5-.388V6.75a.25.25 0 0 0-.25-.25h-7.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25z" fillRule="evenodd" clipRule="evenodd"/>
                  <path d="M11.625 3.368a1.007 1.007 0 1 0 2.014 0 1.007 1.007 0 0 0-2.014 0M3.995 11.95V8.883a.5.5 0 0 1 .757-.429l2.556 1.534a.5.5 0 0 1 0 .857L4.752 12.38a.5.5 0 0 1-.757-.429"/>
                </g>
              </svg>
            </button>
            <button
              type="button"
              onClick={media.type === 'video' ? undefined : onSettings}
              disabled={media.type === 'video'}
              style={mediaIconButtonDisabled(media.type === 'video')}
              title={media.type === 'video' ? 'Video settings are not available yet' : 'Media settings'}
              aria-label="Media settings"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 16 16" aria-hidden>
                <path fill="currentColor" d="M8.904 3.504a3.094 3.094 0 1 1 0 1.5H1.75a.75.75 0 1 1 0-1.5zm3.002-.844a1.593 1.593 0 1 0-.001 3.186 1.593 1.593 0 0 0 .001-3.186m-9.252 8.336a3.094 3.094 0 0 1 6.005 0h5.591a.75.75 0 0 1 0 1.5H8.659a3.094 3.094 0 0 1-6.005 0H1.75a.75.75 0 0 1 0-1.5zm3.002-.844a1.593 1.593 0 1 0 0 3.187 1.593 1.593 0 0 0 0-3.187" fillRule="evenodd" clipRule="evenodd"/>
              </svg>
            </button>
            <button type="button" onClick={onRemove} style={mediaIconButton} title="Delete media" aria-label="Delete media">
              <svg width="18" height="18" fill="none" viewBox="0 0 16 16" aria-hidden>
                <path fill="currentColor" d="M5 1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75v.75h3.667a.75.75 0 0 1 0 1.5H14v10.238a1.75 1.75 0 0 1-1.75 1.75h-8.5A1.75 1.75 0 0 1 2 14.238V4h-.667a.75.75 0 0 1 0-1.5H5zm1.5.75h3v-.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25zM3.5 4v10.238c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25V4zm3.25 2.5a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0v-4a.75.75 0 0 1 .75-.75m2.5 0a.75.75 0 0 1 .75.75v4a.75.75 0 1 1-1.5 0v-4a.75.75 0 0 1 .75-.75" fillRule="evenodd" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        ) : (
          <button type="button" onClick={onOpen} style={mediaAddButton}>+</button>
        )}
      </div>
    </div>
  );
}

type MobileMediaLayout = NonNullable<QuestionMedia['layoutMobile']>;
type DesktopMediaLayout = NonNullable<QuestionMedia['layoutDesktop']>;

const MOBILE_LAYOUT_OPTIONS: Array<{ value: MobileMediaLayout; label: string }> = [
  { value: 'stack', label: 'Stack' },
  { value: 'float', label: 'Float' },
  { value: 'split', label: 'Split' },
  { value: 'wallpaper', label: 'Wallpaper' },
];

const DESKTOP_LAYOUT_OPTIONS: Array<{ value: DesktopMediaLayout; label: string }> = [
  { value: 'float-right', label: 'Float right' },
  { value: 'float-left', label: 'Float left' },
  { value: 'split-right', label: 'Split right' },
  { value: 'split-left', label: 'Split left' },
];

function MediaLayoutControls({ q, onChange }: { q: BuilderQuestion; onChange: (q: BuilderQuestion) => void }) {
  const media = getQuestionMedia(q);
  if (!media?.url) return null;

  const update = (patch: Partial<Pick<QuestionMedia, 'layoutMobile' | 'layoutDesktop'>>) => {
    onChange(setQuestionMedia(q, { ...media, ...patch }));
  };

  return (
    <div style={layoutControlsWrap}>
      <div style={mediaRowTitle}>Layout</div>
      <LayoutSelect
        label="Mobile"
        value={media.layoutMobile ?? 'stack'}
        options={MOBILE_LAYOUT_OPTIONS}
        onChange={value => update({ layoutMobile: value as MobileMediaLayout })}
      />
      <LayoutSelect
        label="Desktop"
        value={normalizeDesktopLayout(media.layoutDesktop)}
        options={DESKTOP_LAYOUT_OPTIONS}
        onChange={value => update({ layoutDesktop: value as DesktopMediaLayout })}
      />
    </div>
  );
}

function LayoutSelect<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const device = label === 'Desktop' ? 'desktop' : 'mobile';
  const toggleOpen = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    const popoverHeight = options.length === 6 ? 94 : 58;
    setOpenAbove(!!rect && rect.bottom + popoverHeight > window.innerHeight - 12);
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div style={layoutSelectRow} ref={rootRef}>
      <span style={layoutSelectLabel}>{label}</span>
      <div style={layoutSelectAnchor}>
        <button
          type="button"
          style={layoutSelectControl}
          onClick={toggleOpen}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`${label} layout`}
        >
          <DeviceIconFrame device={device} selected>
            <LayoutIcon value={value} device={device} />
          </DeviceIconFrame>
          <span style={layoutChevron}>⌄</span>
        </button>
        {open ? (
          <div style={layoutPopover(options.length, openAbove, device === 'desktop')} role="menu">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={option.value === value}
                title={option.label}
                style={layoutOptionButton(option.value === value, device === 'desktop')}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <DeviceIconFrame device={device} compact selected={option.value === value}>
                  <LayoutIcon value={option.value} device={device} />
                </DeviceIconFrame>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}


function setChoiceBehavior(
  q: BuilderQuestion,
  patch: Partial<Pick<MultipleChoiceOptions, 'randomize' | 'allowMultiple'>>,
): BuilderQuestion {
  const opts = q.options as MultipleChoiceOptions | PictureChoiceOptions | DropdownOptions | CheckboxOptions;
  const next = { ...opts, ...patch } as MultipleChoiceOptions | PictureChoiceOptions | DropdownOptions | CheckboxOptions;
  if (q.type === 'dropdown' || q.type === 'checkbox') {
    return { ...q, options: next as BuilderQuestion['options'] };
  }
  const choiceOpts = opts as MultipleChoiceOptions | PictureChoiceOptions;
  const nextChoice = next as MultipleChoiceOptions | PictureChoiceOptions;
  if (patch.allowMultiple === true) {
    nextChoice.correctIndexes = choiceOpts.correctIndexes ?? (choiceOpts.correctIndex != null ? [choiceOpts.correctIndex] : []);
  }
  if (patch.allowMultiple === false) {
    nextChoice.correctIndex = choiceOpts.correctIndexes?.[0] ?? choiceOpts.correctIndex ?? null;
  }
  return { ...q, options: nextChoice as BuilderQuestion['options'] };
}

function getQuestionDescription(q: BuilderQuestion): string {
  const description = (q.options as { description?: unknown }).description;
  return typeof description === 'string' ? description : '';
}

function setQuestionDescription(q: BuilderQuestion, description: string): BuilderQuestion {
  return {
    ...q,
    options: {
      ...(q.options as Record<string, unknown>),
      description,
    } as BuilderQuestion['options'],
  };
}

function typeLabel(type: BuilderQuestion['type']) {
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


function Section({ title, children, hideTitle = false }: { title: string; children: React.ReactNode; hideTitle?: boolean }) {
  return (
    <section style={sectionCard}>
      {hideTitle ? null : <div style={sectionTitle}>{title}</div>}
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
    </section>
  );
}

const panel: React.CSSProperties = {
  padding: 14,
  display: 'grid',
  gap: 12,
};

const panelHeader: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  margin: '-14px -14px 0',
  padding: '18px 14px 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  background: 'rgba(251,250,248,0.92)',
  borderBottom: '1px solid #e4ded8',
  backdropFilter: 'blur(12px)',
};

const panelTitle: React.CSSProperties = {
  color: '#2f2835',
  fontSize: 20,
  fontWeight: 800,
  lineHeight: 1.1,
};

const sectionCard: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e4ded8',
  borderRadius: 7,
  padding: 14,
  boxShadow: '0 8px 22px rgba(47,40,53,0.04)',
};

const sectionTitle: React.CSSProperties = {
  color: '#2f2835',
  fontSize: 14,
  fontWeight: 850,
  marginBottom: 12,
};

const staticNote: React.CSSProperties = {
  padding: '9px 10px',
  borderRadius: 7,
  background: '#f8f5f1',
  color: '#6b6470',
  fontSize: 12,
  lineHeight: 1.45,
};

const mediaRowWrap: React.CSSProperties = {
  borderTop: '1px solid #eee7df',
  borderBottom: '1px solid #eee7df',
  padding: '12px 0',
  marginTop: 4,
};

const mediaRowTop: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const mediaRowTitle: React.CSSProperties = {
  color: '#4f4655',
  fontSize: 13,
};

const layoutControlsWrap: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  paddingTop: 12,
};

const layoutSelectRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '64px 74px',
  alignItems: 'center',
  columnGap: 72,
  color: '#6b6470',
  fontSize: 13,
};

const layoutSelectLabel: React.CSSProperties = {
  minWidth: 64,
};

const layoutSelectControl: React.CSSProperties = {
  width: 88,
  height: 38,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
  padding: '0 10px',
  border: '1px solid #ded8d1',
  borderRadius: 7,
  background: '#fff',
  boxSizing: 'border-box',
  color: '#4f4655',
  cursor: 'pointer',
};

const layoutSelectAnchor: React.CSSProperties = {
  position: 'relative',
};


const layoutChevron: React.CSSProperties = {
  color: '#4f4655',
  fontSize: 18,
  lineHeight: 1,
  transform: 'translateY(-2px)',
};

const layoutPopover = (optionCount: number, openAbove: boolean, isDesktop: boolean): React.CSSProperties => {
  return {
  position: 'absolute',
  top: openAbove ? undefined : 44,
  bottom: openAbove ? 44 : undefined,
  right: 0,
  zIndex: 20,
  display: 'grid',
  gridTemplateColumns: `repeat(${optionCount}, 36px)`,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  width: optionCount * 36 + (optionCount - 1) * 7 + 24,
  padding: '10px 12px',
  borderRadius: 7,
  background: '#fff',
  border: '1px solid #eee7df',
  boxShadow: '0 0 0 4px rgba(47, 40, 53, 0.05), 0 14px 34px rgba(47, 40, 53, 0.14)',
  boxSizing: 'border-box',
  };
};

const layoutOptionButton = (active: boolean, desktop = false): React.CSSProperties => ({
  width: 36,
  height: 34,
  border: 'none',
  borderRadius: 7,
  background: active ? '#f1efec' : 'transparent',
  color: active ? '#2f2835' : '#6b6470',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
});

const mediaAddButton: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 7,
  border: '1px solid #ded8d1',
  background: '#fff',
  color: '#6b6470',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
};

const mediaActions: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 13,
};

const mediaIconButton: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: '#5f5965',
  padding: 0,
  cursor: 'pointer',
};

const mediaIconButtonDisabled = (disabled: boolean): React.CSSProperties => ({
  ...mediaIconButton,
  opacity: disabled ? 0.35 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
});
