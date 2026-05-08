'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { LongAnswerOptions, ShortTextOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={kicker}>{label}</div>
      {children}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange, hint, disabled }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
  hint?: string; disabled?: boolean;
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 13, color: disabled ? '#94a3b8' : '#475569', padding: '8px 0',
      cursor: disabled ? 'default' : 'pointer',
    }}>
      <span>
        {label}
        {hint ? <span style={{ marginLeft: 6, fontSize: 11, color: '#cbd5e1' }}>{hint}</span> : null}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => { if (!disabled) onChange(!checked); }}
        style={{
          width: 34, height: 20, borderRadius: 999,
          background: checked ? '#1c1626' : '#cbd5e1',
          position: 'relative', transition: 'background 0.15s',
          flexShrink: 0,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 16, height: 16, borderRadius: 999, background: '#fff',
          transition: 'left 0.15s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        }} />
      </span>
    </label>
  );
}

export function TextLengthBehavior({ q, onChange }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void;
}) {
  const opts = q.options as ShortTextOptions | LongAnswerOptions;
  const enabled = !!opts.maxCharactersEnabled;
  const maxLength = opts.maxLength ?? 500;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <ToggleRow
        label="Max characters"
        checked={enabled}
        onChange={v => onChange({
          ...q,
          options: {
            ...opts,
            maxCharactersEnabled: v,
            maxLength: v ? maxLength : undefined,
          },
        })}
      />
      {enabled ? (
        <input
          type="number"
          min={1}
          max={999999999}
          value={maxLength}
          onChange={e => onChange({
            ...q,
            options: {
              ...opts,
              maxCharactersEnabled: true,
              maxLength: Math.max(1, Math.min(999999999, Number(e.target.value) || 1)),
            },
          })}
          placeholder="0-999999999"
          style={inputStyle}
        />
      ) : null}
    </div>
  );
}

export function correctAnswerChip(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    minHeight: 34,
    padding: '7px 9px',
    borderRadius: 7,
    border: active ? '1px solid #2f2533' : '1px solid #ded8d1',
    background: active ? '#2f2533' : '#fff',
    color: active ? '#fff' : '#2f2835',
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 750,
    textAlign: 'left',
    cursor: 'pointer',
  };
}

export const kicker: CSSProperties = {
  fontSize: 11, fontWeight: 800, color: '#8b848f',
  letterSpacing: 0.5, textTransform: 'uppercase',
  marginBottom: 6,
};

export const inputStyle: CSSProperties = {
  flex: 1, padding: '9px 11px', fontSize: 13,
  border: '1px solid #ded8d1', borderRadius: 7,
  background: '#fff',
  boxSizing: 'border-box',
  color: '#2f2835',
  outline: 'none',
};

export const textareaStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 11px', fontSize: 14,
  border: '1px solid #ded8d1', borderRadius: 7,
  background: '#fff',
  fontFamily: 'inherit', resize: 'vertical',
  color: '#2f2835',
  outline: 'none',
};

export const removeBtn: CSSProperties = {
  width: 24, height: 24,
  background: 'transparent', border: 'none',
  color: '#94a3b8', cursor: 'pointer', fontSize: 16,
};

export const addChoiceBtn: CSSProperties = {
  alignSelf: 'flex-start', padding: '7px 11px', fontSize: 12,
  background: '#fff', border: '1px dashed #c9c1ca',
  borderRadius: 7, cursor: 'pointer', color: '#4f4655',
  fontWeight: 750,
};

export const correctAnswerBlock: CSSProperties = {
  marginTop: 8,
  padding: 10,
  borderRadius: 7,
  background: '#f7f5f2',
  border: '1px solid #e8e0d8',
  display: 'grid',
  gap: 8,
};

export const correctAnswerLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 850,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: '#5b5260',
};

export const correctAnswerChoices: CSSProperties = {
  display: 'grid',
  gap: 6,
};
