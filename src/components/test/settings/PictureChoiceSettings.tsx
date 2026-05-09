'use client';

import { useState, type CSSProperties } from 'react';
import type { PictureChoice, PictureChoiceOptions } from '@/lib/test/types';
import type { BuilderQuestion } from '../builderTypes';
import { MediaGalleryModal } from '../media/MediaGalleryModal';
import {
  Field, addChoiceBtn, inputStyle, removeBtn,
} from './_shared';

export function PictureChoiceSettings({ q, onChange, isGraded }: {
  q: BuilderQuestion; onChange: (q: BuilderQuestion) => void; isGraded: boolean;
}) {
  const opts = q.options as PictureChoiceOptions;
  const choices = opts.choices ?? [];
  const [mediaChoiceIndex, setMediaChoiceIndex] = useState<number | null>(null);

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
              <button
                type="button"
                onClick={() => setMediaChoiceIndex(i)}
                style={choiceMediaButton}
                title={c.image_url ? 'Change image' : 'Add image'}
                aria-label={c.image_url ? `Change image for choice ${i + 1}` : `Add image for choice ${i + 1}`}
              >
                +
              </button>
              {choices.length > 2 ? (
                <button type="button" onClick={() => removeChoice(i)} style={removeBtn}>×</button>
              ) : null}
            </div>
            {c.image_url ? (
              <button
                type="button"
                onClick={() => setMediaChoiceIndex(i)}
                style={choiceImagePreview}
                title="Change image"
              >
                <span style={choiceMediaThumb(c.image_url)} />
              </button>
            ) : null}
          </div>
        ))}
        <button type="button" onClick={addChoice} style={addChoiceBtn}>+ Add choice</button>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          Use + to add or replace an image for each choice.
        </div>
        {mediaChoiceIndex != null ? (
          <MediaGalleryModal
            q={q}
            allowedTabs={['upload', 'image', 'gallery']}
            onClose={() => setMediaChoiceIndex(null)}
            onChange={() => undefined}
            onPickMedia={(media) => {
              setChoice(mediaChoiceIndex, { image_url: media.url });
              setMediaChoiceIndex(null);
            }}
          />
        ) : null}
      </div>
    </Field>
  );
}

const choiceMediaButton: CSSProperties = {
  width: 34,
  height: 34,
  border: '1px solid #ded8d1',
  borderRadius: 7,
  background: '#fff',
  color: '#2f2835',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
  flexShrink: 0,
  overflow: 'hidden',
};

const choiceImagePreview: CSSProperties = {
  width: '100%',
  height: 120,
  border: '1px solid #ded8d1',
  borderRadius: 7,
  background: '#f8f5f1',
  padding: 0,
  overflow: 'hidden',
  cursor: 'pointer',
};

const choiceMediaThumb = (url: string): CSSProperties => ({
  width: '100%',
  height: '100%',
  display: 'block',
  backgroundImage: `url(${url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
});
