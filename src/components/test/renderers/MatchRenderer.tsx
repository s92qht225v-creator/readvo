'use client';

import { useMemo, useState } from 'react';

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
    <div className="test-match-list test-match-pairing" role="group" aria-label="Match pairs">
      <div className="test-match-column">
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
            >
              {pairedRight ? <span className="test-match-choice__badge">{leftIndex + 1}</span> : null}
              <span className="test-match-choice__text">{item.text}</span>
            </button>
          );
        })}
      </div>
      <div className="test-match-column">
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
            >
              {pairedLeft != null ? <span className="test-match-choice__badge">{pairedLeft + 1}</span> : null}
              <span className="test-match-choice__text">{item.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
