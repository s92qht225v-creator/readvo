'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { Language } from '../types/ui-state';

interface WordEntry {
  w: string;
  t: string;
  tr: string;
}

interface Part {
  type: 'text' | 'choice';
  content?: string;
  options?: string[];
  correct?: number;
}

interface Card {
  id: string;
  parts: Part[];
  words?: WordEntry[];
}

interface Props {
  cards: Card[];
  language: Language;
  layout?: 'ab-choice';
}

function findWordEntry(token: string, words: WordEntry[]): WordEntry | undefined {
  const lower = token.toLowerCase().replace(/[.,!?;:'"]/g, '');
  if (!lower) return undefined;
  return words.find((w) => w.w.toLowerCase() === lower);
}

const isWordChar = (ch: string) => /\w/.test(ch);

function segmentText(text: string, words: WordEntry[]): { text: string; entry?: WordEntry }[] {
  const sortedWords = [...words].sort((a, b) => b.w.length - a.w.length);
  const segments: { text: string; entry?: WordEntry }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let matched = false;

    for (const wordEntry of sortedWords) {
      const phrase = wordEntry.w.toLowerCase();
      const idx = remaining.toLowerCase().indexOf(phrase);
      if (idx !== -1) {
        const charBefore = idx > 0 ? remaining[idx - 1] : '';
        const charAfter = remaining[idx + phrase.length] || '';
        if ((charBefore && isWordChar(charBefore)) || (charAfter && isWordChar(charAfter))) {
          continue;
        }
        if (idx > 0) {
          segments.push(...segmentText(remaining.slice(0, idx), words));
        }
        segments.push({
          text: remaining.slice(idx, idx + phrase.length),
          entry: wordEntry,
        });
        remaining = remaining.slice(idx + phrase.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      const wordMatch = remaining.match(/^(\s*\S+)/);
      if (wordMatch) {
        const token = wordMatch[1];
        const entry = findWordEntry(token.trim(), words);
        segments.push({ text: token, entry: entry || undefined });
        remaining = remaining.slice(token.length);
      } else {
        segments.push({ text: remaining });
        remaining = '';
      }
    }
  }

  return segments;
}

function TappableWord({
  text,
  entry,
  language,
  isActive,
  onTap,
}: {
  text: string;
  entry: WordEntry;
  language: Language;
  isActive: boolean;
  onTap: (entry: WordEntry) => void;
}) {
  return (
    <span className="typedfillblank__word-wrapper">
      <span
        className={`typedfillblank__word${isActive ? ' typedfillblank__word--active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onTap(entry);
        }}
      >
        {text}
      </span>
      {isActive && (
        <span className="typedfillblank__tooltip">
          {language === 'ru' ? entry.tr : entry.t}
        </span>
      )}
    </span>
  );
}

function RenderTappableText({
  text,
  words,
  language,
  activeWord,
  onWordTap,
}: {
  text: string;
  words: WordEntry[] | undefined;
  language: Language;
  activeWord: string | null;
  onWordTap: (entry: WordEntry) => void;
}) {
  if (!words || words.length === 0) {
    return <>{text}</>;
  }

  const segments = segmentText(text, words);

  return (
    <>
      {segments.map((seg, i) =>
        seg.entry ? (
          <TappableWord
            key={i}
            text={seg.text}
            entry={seg.entry}
            language={language}
            isActive={activeWord === seg.entry.w}
            onTap={onWordTap}
          />
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

export function WordChoiceExercise({ cards, language, layout }: Props) {
  // Track which option the user selected per choice: cardId -> choiceIdx -> selectedOptionIdx
  const [selections, setSelections] = useState<Record<string, Record<number, number>>>({});
  // Track checked result per choice: cardId -> choiceIdx -> true/false/null
  const [checked, setChecked] = useState<Record<string, Record<number, boolean | null>>>({});
  const [activeWord, setActiveWord] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWord) return;
    const dismiss = () => setActiveWord(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeWord]);

  const handleWordTap = useCallback((entry: WordEntry) => {
    setActiveWord((prev) => (prev === entry.w ? null : entry.w));
  }, []);

  const handleChoiceTap = useCallback((cardId: string, choiceIdx: number, optionIdx: number) => {
    // If already correctly answered, ignore
    if (checked[cardId]?.[choiceIdx] === true) return;

    // Clear any previous wrong result for this choice
    setChecked((prev) => {
      if (prev[cardId]?.[choiceIdx] === false) {
        const updated = { ...prev, [cardId]: { ...(prev[cardId] || {}) } };
        delete updated[cardId][choiceIdx];
        return updated;
      }
      return prev;
    });

    setSelections((prev) => ({
      ...prev,
      [cardId]: { ...(prev[cardId] || {}), [choiceIdx]: optionIdx },
    }));
  }, [checked]);

  const handleCheckAll = useCallback(() => {
    setChecked((prev) => {
      const updated = { ...prev };
      cards.forEach((card) => {
        let choiceIdx = 0;
        card.parts.forEach((part) => {
          if (part.type !== 'choice') return;
          const ci = choiceIdx++;
          // Skip already correct
          if (updated[card.id]?.[ci] === true) return;
          // Skip if no selection
          const sel = selections[card.id]?.[ci];
          if (sel === undefined) return;
          const isCorrect = sel === (part.correct ?? 0);
          updated[card.id] = { ...(updated[card.id] || {}), [ci]: isCorrect };
        });
      });
      return updated;
    });

    // Reset wrong selections after a delay
    setTimeout(() => {
      setSelections((prev) => {
        const updated = { ...prev };
        setChecked((prevChecked) => {
          const checkedUpdated = { ...prevChecked };
          cards.forEach((card) => {
            let choiceIdx = 0;
            card.parts.forEach((part) => {
              if (part.type !== 'choice') return;
              const ci = choiceIdx++;
              if (prevChecked[card.id]?.[ci] === false) {
                // Clear wrong selection and result
                if (updated[card.id]) {
                  const cardSel = { ...updated[card.id] };
                  delete cardSel[ci];
                  updated[card.id] = cardSel;
                }
                if (checkedUpdated[card.id]) {
                  const cardCheck = { ...checkedUpdated[card.id] };
                  delete cardCheck[ci];
                  checkedUpdated[card.id] = cardCheck;
                }
              }
            });
          });
          return checkedUpdated;
        });
        return updated;
      });
    }, 600);
  }, [cards, selections]);

  // Count total choices and completed choices
  const totalChoices = cards.reduce((sum, card) => sum + card.parts.filter((p) => p.type === 'choice').length, 0);
  const completedChoices = Object.values(checked).reduce(
    (sum, cardResults) => sum + Object.values(cardResults).filter((r) => r === true).length,
    0,
  );

  // Has unchecked selections (enables the check button)
  const hasUncheckedSelections = cards.some((card) => {
    let choiceIdx = 0;
    return card.parts.some((part) => {
      if (part.type !== 'choice') return false;
      const ci = choiceIdx++;
      if (checked[card.id]?.[ci] === true) return false;
      return selections[card.id]?.[ci] !== undefined;
    });
  });

  return (
    <div className="wordchoice">
      <div className="wordchoice__progress">
        <div
          className="wordchoice__progress-bar"
          style={{ width: `${totalChoices > 0 ? (completedChoices / totalChoices) * 100 : 0}%` }}
        />
      </div>

      {cards.map((card, cardIdx) => {
        let choiceIdx = 0;
        const cardChecked = checked[card.id] || {};
        const cardSelections = selections[card.id] || {};
        const cardChoiceCount = card.parts.filter((p) => p.type === 'choice').length;
        const allCorrect = Object.values(cardChecked).filter((r) => r === true).length === cardChoiceCount;

        // AB-choice layout: lead sentence on top, stacked A/B option buttons below
        if (layout === 'ab-choice') {
          const choicePart = card.parts.find((p) => p.type === 'choice');
          const ci = 0;
          const selectedOption = cardSelections[ci];
          const result = cardChecked[ci];
          const isLocked = result === true;
          const labels = ['A', 'B', 'C', 'D'];
          return (
            <div key={card.id} className={`wordchoice__card wordchoice__card--ab${allCorrect ? ' wordchoice__card--correct' : ''}`}>
              <span className="wordchoice__number">{cardIdx + 1}</span>
              <div className="wordchoice__ab-body">
                <div className="wordchoice__ab-lead">
                  {card.parts.map((part, partIdx) =>
                    part.type === 'text' ? (
                      <RenderTappableText
                        key={partIdx}
                        text={part.content || ''}
                        words={card.words}
                        language={language}
                        activeWord={activeWord}
                        onWordTap={handleWordTap}
                      />
                    ) : (
                      <span key={partIdx} className="wordchoice__ab-blank">___</span>
                    )
                  )}
                </div>
                <div className="wordchoice__ab-options">
                  {choicePart?.options?.map((option, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrectChoice = isSelected && result === true;
                    const isWrongChoice = isSelected && result === false;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={`wordchoice__ab-btn${isSelected && result == null ? ' wordchoice__ab-btn--selected' : ''}${isCorrectChoice ? ' wordchoice__ab-btn--correct' : ''}${isWrongChoice ? ' wordchoice__ab-btn--wrong' : ''}${isLocked && !isSelected ? ' wordchoice__ab-btn--dimmed' : ''}`}
                        onClick={() => handleChoiceTap(card.id, ci, optIdx)}
                        disabled={isLocked}
                      >
                        <span className="wordchoice__ab-label">{labels[optIdx]}</span>
                        <span className="wordchoice__ab-text">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={card.id} className={`wordchoice__card${allCorrect ? ' wordchoice__card--correct' : ''}`}>
            <span className="wordchoice__number">{cardIdx + 1}</span>
            <div className="wordchoice__sentence">
              {card.parts.map((part, partIdx) => {
                if (part.type === 'text') {
                  return (
                    <span key={partIdx}>
                      <RenderTappableText
                        text={part.content || ''}
                        words={card.words}
                        language={language}
                        activeWord={activeWord}
                        onWordTap={handleWordTap}
                      />
                    </span>
                  );
                }
                // choice
                const currentChoiceIdx = choiceIdx++;
                const selectedOption = cardSelections[currentChoiceIdx];
                const result = cardChecked[currentChoiceIdx];
                const isLocked = result === true;

                return (
                  <span key={partIdx} className="wordchoice__choice-group">
                    {part.options?.map((option, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrectChoice = isSelected && result === true;
                      const isWrongChoice = isSelected && result === false;
                      return (
                        <React.Fragment key={optIdx}>
                          {optIdx > 0 && <span className="wordchoice__separator">/</span>}
                          <button
                            type="button"
                            className={`wordchoice__choice-btn${isSelected && result === null || isSelected && result === undefined ? ' wordchoice__choice-btn--selected' : ''}${isCorrectChoice ? ' wordchoice__choice-btn--correct' : ''}${isWrongChoice ? ' wordchoice__choice-btn--wrong' : ''}${isLocked && !isSelected ? ' wordchoice__choice-btn--dimmed' : ''}`}
                            onClick={() => handleChoiceTap(card.id, currentChoiceIdx, optIdx)}
                            disabled={isLocked}
                          >
                            {option}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {completedChoices < totalChoices && (
        <button
          className="wordchoice__check-btn"
          type="button"
          onClick={handleCheckAll}
          disabled={!hasUncheckedSelections}
        >
          {language === 'ru' ? 'Проверить' : 'Tekshirish'}
        </button>
      )}

      {completedChoices === totalChoices && totalChoices > 0 && (
        <div className="wordchoice__complete">
          {language === 'ru' ? 'Все правильно!' : "Hammasi to'g'ri!"}
        </div>
      )}
    </div>
  );
}
