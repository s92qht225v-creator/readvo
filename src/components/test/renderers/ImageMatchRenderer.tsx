'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import type { PublicPictureChoice, AnswerSubmission } from '@/lib/test/types';
import { MathText } from '../MathText';
import { PinyinText } from '../PinyinText';
import { detectScriptLang } from '@/lib/test/scriptLang';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Image-matching player. Keeps the image_options layout — labeled image grid
 * on top, description list below (in the server's shuffled `answerOrder`) —
 * but makes it a MATCHING interaction: tap an image, then tap a description to
 * pair them. The description shows the image's letter once paired.
 *
 * Pairs are stored as { leftIndex (image index), rightId (choice id) }, the
 * same shape as the `match` type, so grading is by id (reorder-safe).
 */
export function ImageMatchPlayer({ choices, answerOrder, cols, value, onChange }: {
  choices: PublicPictureChoice[];
  answerOrder?: string[];
  cols: number | null;
  value: { pairs?: { leftIndex: number; rightId: string }[] };
  onChange: (v: AnswerSubmission['value']) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const byId = useMemo(() => new Map(choices.map(c => [c.id, c])), [choices]);
  const answerList = useMemo(
    () => (answerOrder?.length
      ? answerOrder.map(id => byId.get(id)).filter((c): c is PublicPictureChoice => !!c)
      : choices),
    [answerOrder, byId, choices],
  );
  const validRightIds = useMemo(() => new Set(choices.map(c => c.id)), [choices]);

  const pairs = useMemo(() => {
    const raw = Array.isArray(value.pairs) ? value.pairs : [];
    const seenLeft = new Set<number>();
    const seenRight = new Set<string>();
    return raw.filter(p => {
      const ok = Number.isInteger(p.leftIndex) && p.leftIndex >= 0 && p.leftIndex < choices.length
        && typeof p.rightId === 'string' && validRightIds.has(p.rightId)
        && !seenLeft.has(p.leftIndex) && !seenRight.has(p.rightId);
      if (ok) { seenLeft.add(p.leftIndex); seenRight.add(p.rightId); }
      return ok;
    });
  }, [value.pairs, choices.length, validRightIds]);

  const rightForLeft = (leftIndex: number) => pairs.find(p => p.leftIndex === leftIndex)?.rightId ?? '';
  const leftForRight = (rightId: string) => pairs.find(p => p.rightId === rightId)?.leftIndex ?? null;

  const setPair = (leftIndex: number, rightId: string) => {
    const next = pairs.filter(p => p.leftIndex !== leftIndex && p.rightId !== rightId);
    next.push({ leftIndex, rightId });
    next.sort((a, b) => a.leftIndex - b.leftIndex);
    onChange({ pairs: next });
  };

  const handleRightClick = (rightId: string) => {
    if (selectedImage == null) {
      // Tapping a matched description re-selects its image for re-pairing.
      setSelectedImage(leftForRight(rightId));
      return;
    }
    setPair(selectedImage, rightId);
    setSelectedImage(null);
  };

  const gridStyle = cols ? ({ '--pic-cols': String(cols) } as CSSProperties) : undefined;

  return (
    <div className="test-image-options test-image-match">
      <div className="test-image-grid" data-cols={cols ?? undefined} style={gridStyle} role="group" aria-label="Images">
        {choices.map((c, i) => {
          const matched = !!rightForLeft(i);
          const selected = selectedImage === i;
          return (
            <button
              key={c.id}
              type="button"
              className="test-image-grid__cell test-image-grid__cell--tappable"
              data-selected={selected ? 'true' : 'false'}
              data-matched={matched ? 'true' : 'false'}
              aria-pressed={selected}
              onClick={() => setSelectedImage(selected ? null : i)}
            >
              <div
                className={`test-image-grid__img${c.image_url ? ' test-image-grid__img--has-image' : ''}`}
                style={c.image_url ? { backgroundImage: `url(${c.image_url})` } : undefined}
              >
                {!c.image_url ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                  </svg>
                ) : null}
                <span className="test-image-grid__label" aria-hidden="true">{LETTERS[i] ?? i + 1}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="tq-options" role="group" aria-label="Descriptions">
        {answerList.map(c => {
          const pairedLeft = leftForRight(c.id);
          const selected = selectedImage != null && pairedLeft === selectedImage;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handleRightClick(c.id)}
              className="tq-option test-image-match__answer"
              data-selected={selected ? 'true' : 'false'}
              data-matched={pairedLeft != null ? 'true' : 'false'}
            >
              <span className="tq-option__chip" aria-hidden="true">{pairedLeft != null ? (LETTERS[pairedLeft] ?? pairedLeft + 1) : ''}</span>
              {(c.text || c.pinyin?.length) ? (
                <span className="tq-option__label" dir="auto" lang={detectScriptLang(c.text)}>
                  {c.pinyin?.length ? <PinyinText segments={c.pinyin} /> : <MathText>{c.text}</MathText>}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
