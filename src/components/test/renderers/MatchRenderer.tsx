'use client';

import { useMemo, useState, type CSSProperties } from 'react';

export function MatchPlayer({ left, right, value, onChange }: {
  left: { id: string; text: string }[];
  right: { id: string; text: string }[];
  value: { pairs?: { leftIndex: number; rightId: string }[]; matches?: string[] };
  onChange: (v: { pairs: { leftIndex: number; rightId: string }[] }) => void;
}) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const validRightIds = useMemo(() => new Set(right.map(item => item.id)), [right]);
  const pairs = useMemo(() => {
    const explicit = Array.isArray(value.pairs)
      ? value.pairs
      : (value.matches ?? []).map((rightId, leftIndex) => ({ leftIndex, rightId }));
    const seenLeft = new Set<number>();
    const seenRight = new Set<string>();
    return explicit.filter(pair => {
      const ok = Number.isInteger(pair.leftIndex)
        && pair.leftIndex >= 0
        && pair.leftIndex < left.length
        && typeof pair.rightId === 'string'
        && validRightIds.has(pair.rightId)
        && !seenLeft.has(pair.leftIndex)
        && !seenRight.has(pair.rightId);
      if (ok) {
        seenLeft.add(pair.leftIndex);
        seenRight.add(pair.rightId);
      }
      return ok;
    });
  }, [left.length, validRightIds, value.matches, value.pairs]);

  const rightForLeft = (leftIndex: number) => pairs.find(pair => pair.leftIndex === leftIndex)?.rightId ?? '';
  const leftForRight = (rightId: string) => pairs.find(pair => pair.rightId === rightId)?.leftIndex ?? null;

  const setPair = (leftIndex: number, rightId: string) => {
    const next = pairs.filter(pair => pair.leftIndex !== leftIndex && pair.rightId !== rightId);
    next.push({ leftIndex, rightId });
    next.sort((a, b) => a.leftIndex - b.leftIndex);
    onChange({ pairs: next });
  };

  const handleRightClick = (rightId: string) => {
    if (selectedLeft == null) {
      setSelectedLeft(leftForRight(rightId));
      return;
    }
    setPair(selectedLeft, rightId);
    setSelectedLeft(null);
  };

  return (
    <div
      className="test-match-list test-match-pairing"
      role="group"
      aria-label="Match pairs"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 10,
        width: '100%',
        maxWidth: '100%',
        marginInline: 0,
      }}
    >
      <div className="test-match-column" style={{ display: 'grid', gap: 7, minWidth: 0 }}>
        {left.map((item, leftIndex) => {
          const pairedRight = rightForLeft(leftIndex);
          const selected = selectedLeft === leftIndex;
          return (
            <button
              key={item.id ?? leftIndex}
              type="button"
              className="test-match-choice test-match-choice--left"
              data-selected={selected ? 'true' : 'false'}
              data-matched={pairedRight ? 'true' : 'false'}
              onClick={() => setSelectedLeft(selected ? null : leftIndex)}
              style={matchChoiceStyle(selected, !!pairedRight)}
            >
              {pairedRight ? <span style={matchBadgeStyle}>{leftIndex + 1}</span> : null}
              <span style={matchChoiceTextStyle}>{item.text}</span>
            </button>
          );
        })}
      </div>
      <div className="test-match-column" style={{ display: 'grid', gap: 7, minWidth: 0 }}>
        {right.map(item => {
          const pairedLeft = leftForRight(item.id);
          const selected = selectedLeft != null && pairedLeft === selectedLeft;
          return (
            <button
              key={item.id}
              type="button"
              className="test-match-choice test-match-choice--right"
              data-selected={selected ? 'true' : 'false'}
              data-matched={pairedLeft != null ? 'true' : 'false'}
              onClick={() => handleRightClick(item.id)}
              style={matchChoiceStyle(selected, pairedLeft != null)}
            >
              {pairedLeft != null ? <span style={matchBadgeStyle}>{pairedLeft + 1}</span> : null}
              <span style={matchChoiceTextStyle}>{item.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function matchChoiceStyle(selected: boolean, matched: boolean): CSSProperties {
  return {
    ...matchTile,
    width: '100%',
    border: selected ? '2px solid #0445af' : '2px solid transparent',
    background: selected ? 'rgba(4, 69, 175, 0.16)' : matched ? 'rgba(4, 69, 175, 0.12)' : '#f3f5ff',
    cursor: 'pointer',
    gap: 6,
    fontFamily: 'inherit',
    textAlign: 'left',
  };
}

const matchTile: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  minHeight: 37,
  padding: '6px 10px',
  background: '#f3f5ff',
  color: 'rgb(4, 69, 175)',
  borderRadius: 1,
  fontSize: 18,
  lineHeight: '24px',
};

const matchBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  borderRadius: 3,
  border: '1px solid #0445af',
  background: '#fff',
  color: '#0445af',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
};

const matchChoiceTextStyle: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
