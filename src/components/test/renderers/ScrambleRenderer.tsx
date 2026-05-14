'use client';

import { useMemo, type CSSProperties } from 'react';
import type { PublicScrambleTile } from '@/lib/test/types';

export function ScramblePlayer({
  tiles,
  unit,
  value,
  onChange,
}: {
  tiles: PublicScrambleTile[];
  unit: 'letters' | 'words';
  value: { tileIds?: string[] };
  onChange: (v: { tileIds: string[] }) => void;
}) {
  const selected = value.tileIds ?? [];
  const tileById = useMemo(() => new Map(tiles.map(t => [t.id, t])), [tiles]);
  const bank = useMemo(() => tiles.filter(t => !selected.includes(t.id)), [tiles, selected]);

  const addTile = (id: string) => {
    if (selected.includes(id)) return;
    onChange({ tileIds: [...selected, id] });
  };
  const removeTile = (id: string) => {
    onChange({ tileIds: selected.filter(x => x !== id) });
  };

  return (
    <div className="test-scramble" style={containerStyle}>
      <div className="test-scramble__answer" style={answerStyle(selected.length === 0)}>
        {selected.length === 0 ? (
          <span style={placeholderStyle}>
            {unit === 'words' ? 'Tap words below to build the sentence' : 'Tap letters below to build the word'}
          </span>
        ) : (
          selected.map(id => {
            const tile = tileById.get(id);
            if (!tile) return null;
            return (
              <button
                key={`a-${id}`}
                type="button"
                className="test-scramble__tile test-scramble__tile--in-answer"
                onClick={() => removeTile(id)}
                style={tileStyle('answer')}
                aria-label={`Remove ${tile.text}`}
              >
                {tile.text}
              </button>
            );
          })
        )}
      </div>
      <div className="test-scramble__bank" style={bankStyle}>
        {bank.map(tile => (
          <button
            key={`b-${tile.id}`}
            type="button"
            className="test-scramble__tile test-scramble__tile--in-bank"
            onClick={() => addTile(tile.id)}
            style={tileStyle('bank')}
            aria-label={`Add ${tile.text}`}
          >
            {tile.text}
          </button>
        ))}
        {bank.length === 0 ? (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>All tiles used. Tap an answer tile to undo.</span>
        ) : null}
      </div>
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  width: '100%',
};

const answerStyle = (empty: boolean): CSSProperties => ({
  minHeight: 56,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
  alignContent: 'flex-start',
  padding: '10px 12px',
  borderRadius: 4,
  background: empty ? 'rgba(4, 69, 175, 0.04)' : 'rgba(4, 69, 175, 0.06)',
  border: '1px dashed rgba(4, 69, 175, 0.28)',
  boxSizing: 'border-box',
});

const bankStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  alignItems: 'center',
  minHeight: 36,
};

const placeholderStyle: CSSProperties = {
  color: 'rgba(4, 69, 175, 0.55)',
  fontSize: 13,
  fontStyle: 'italic',
};

const tileStyle = (where: 'answer' | 'bank'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  minHeight: 34,
  borderRadius: 3,
  border: 'none',
  background: where === 'answer'
    ? 'var(--test-theme-answer, #0445af)'
    : 'color-mix(in srgb, var(--test-theme-answer, #0445af) 10%, #ffffff)',
  color: where === 'answer'
    ? '#ffffff'
    : 'var(--test-theme-answer-text, #0445af)',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  fontWeight: 500,
  lineHeight: 1.2,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});
