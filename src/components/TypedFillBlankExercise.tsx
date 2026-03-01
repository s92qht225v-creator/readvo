'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { Language } from '../types/ui-state';

interface Part {
  type: 'text' | 'blank' | 'hint';
  content?: string;
}

interface WordEntry {
  w: string;
  t: string;
  tr: string;
}

interface Card {
  id: string;
  parts: Part[];
  answers: string[];
  alternateAnswers?: (string[])[];
  prefilled?: string;
  words?: WordEntry[];
}

interface ImageItem {
  label: string;
  caption: string;
  image_url?: string;
}

interface Props {
  cards: Card[];
  language: Language;
  images?: ImageItem[];
}

function findWordEntry(token: string, words: WordEntry[]): WordEntry | undefined {
  const lower = token.toLowerCase().replace(/[.,!?;:'"]/g, '');
  if (!lower) return undefined;
  return words.find((w) => w.w.toLowerCase() === lower);
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
    return <span>{text}</span>;
  }

  const sortedWords = [...words].sort((a, b) => b.w.length - a.w.length);
  const segments: { text: string; entry?: WordEntry }[] = [];
  let remaining = text;

  const isWordChar = (ch: string) => /\w/.test(ch);

  while (remaining.length > 0) {
    let matched = false;

    for (const wordEntry of sortedWords) {
      const phrase = wordEntry.w.toLowerCase();
      const idx = remaining.toLowerCase().indexOf(phrase);
      if (idx !== -1) {
        // Word boundary check: char before and after the match must not be a word char
        const charBefore = idx > 0 ? remaining[idx - 1] : '';
        const charAfter = remaining[idx + phrase.length] || '';
        if ((charBefore && isWordChar(charBefore)) || (charAfter && isWordChar(charAfter))) {
          continue; // partial match inside another word, skip
        }
        if (idx > 0) {
          // Process prefix text word-by-word so individual words get matched
          const prefix = remaining.slice(0, idx);
          let prefixRemaining = prefix;
          while (prefixRemaining.length > 0) {
            const wm = prefixRemaining.match(/^(\s*\S+)/);
            if (wm) {
              const token = wm[1];
              const entry = findWordEntry(token.trim(), words);
              segments.push({ text: token, entry: entry || undefined });
              prefixRemaining = prefixRemaining.slice(token.length);
            } else {
              segments.push({ text: prefixRemaining });
              prefixRemaining = '';
            }
          }
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

export function TypedFillBlankExercise({ cards, language, images }: Props) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    cards.forEach((card) => {
      const blankCount = card.parts.filter((p) => p.type === 'blank').length;
      if (card.prefilled) {
        init[card.id] = [card.prefilled];
      } else {
        init[card.id] = new Array(blankCount).fill('');
      }
    });
    return init;
  });
  const [checked, setChecked] = useState<Record<string, boolean[]>>(() => {
    const init: Record<string, boolean[]> = {};
    cards.forEach((card) => {
      if (card.prefilled) {
        init[card.id] = [true];
      }
    });
    return init;
  });
  const [activeWord, setActiveWord] = useState<string | null>(null);

  // Dismiss tooltip on outside tap
  useEffect(() => {
    if (!activeWord) return;
    const dismiss = () => setActiveWord(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeWord]);

  const handleInputChange = useCallback((cardId: string, blankIdx: number, value: string) => {
    setUserAnswers((prev) => {
      const updated = { ...prev };
      updated[cardId] = [...(updated[cardId] || [])];
      updated[cardId][blankIdx] = value;
      return updated;
    });
    setChecked((prev) => {
      const updated = { ...prev };
      delete updated[cardId];
      return updated;
    });
  }, []);

  const checkCard = useCallback((card: Card, answers: string[]) => {
    return card.answers.map((correct, i) => {
      const userVal = (answers[i] || '').trim().toLowerCase();
      if (userVal === correct.toLowerCase()) return true;
      const alts = card.alternateAnswers?.[i];
      if (alts && alts.some((alt) => alt.toLowerCase() === userVal)) return true;
      return false;
    });
  }, []);

  const handleCheckAll = useCallback(() => {
    setChecked((prev) => {
      const updated = { ...prev };
      cards.forEach((card) => {
        const existing = updated[card.id];
        if (existing && existing.every((r) => r)) return;
        const answers = userAnswers[card.id] || [];
        if (!answers.some((a) => a.trim())) return;
        updated[card.id] = checkCard(card, answers);
      });
      return updated;
    });
  }, [cards, userAnswers, checkCard]);

  const handleWordTap = useCallback((entry: WordEntry) => {
    setActiveWord((prev) => (prev === entry.w ? null : entry.w));
  }, []);

  const totalCards = cards.length;
  const completedCards = cards.filter((card) => {
    const results = checked[card.id];
    return results && results.every((r) => r);
  }).length;
  const hasFilledUnchecked = cards.some((card) => {
    const results = checked[card.id];
    if (results && results.every((r) => r)) return false;
    const answers = userAnswers[card.id] || [];
    return answers.some((a) => a.trim());
  });

  return (
    <div className="typedfillblank">
      {/* Progress */}
      <div className="typedfillblank__progress">
        <div
          className="typedfillblank__progress-bar"
          style={{ width: `${(completedCards / totalCards) * 100}%` }}
        />
      </div>

      {images && images.length > 0 && (
        <div className="typedfillblank__images">
          {images.map((img, i) => (
            <div key={i} className="typedfillblank__image">
              {img.image_url ? (
                <img src={img.image_url} alt={img.label} />
              ) : (
                <span className="typedfillblank__image-placeholder">{img.label}</span>
              )}
              <span className="typedfillblank__image-caption">{img.caption}</span>
            </div>
          ))}
        </div>
      )}

      {cards.map((card, cardIdx) => {
        let blankIdx = 0;
        const results = checked[card.id];
        const allCorrect = results && results.every((r) => r);

        return (
          <div key={card.id} className={`typedfillblank__card${allCorrect ? ' typedfillblank__card--correct' : ''}`}>
            <span className="typedfillblank__number">{cardIdx + 1}</span>
            <div className={`typedfillblank__sentence${card.parts.every((p) => p.type !== 'text') ? ' typedfillblank__sentence--hint-only' : ''}`}>
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
                if (part.type === 'hint') {
                  return (
                    <span key={partIdx} className="typedfillblank__hint">
                      (<RenderTappableText
                        text={part.content || ''}
                        words={card.words}
                        language={language}
                        activeWord={activeWord}
                        onWordTap={handleWordTap}
                      />)
                    </span>
                  );
                }
                // blank
                const currentBlankIdx = blankIdx++;
                const isCorrect = results?.[currentBlankIdx];
                const isWrong = results && !results[currentBlankIdx];
                return (
                  <input
                    key={partIdx}
                    type="text"
                    className={`typedfillblank__input${isCorrect ? ' typedfillblank__input--correct' : ''}${isWrong ? ' typedfillblank__input--wrong' : ''}`}
                    value={userAnswers[card.id]?.[currentBlankIdx] || ''}
                    onChange={(e) => handleInputChange(card.id, currentBlankIdx, e.target.value)}
                    disabled={allCorrect}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {completedCards < totalCards && (
        <button
          className="typedfillblank__check-btn typedfillblank__check-btn--bottom"
          type="button"
          onClick={handleCheckAll}
          disabled={!hasFilledUnchecked}
        >
          {language === 'ru' ? 'Проверить' : 'Tekshirish'}
        </button>
      )}

      {completedCards === totalCards && (
        <div className="typedfillblank__complete">
          {language === 'ru' ? 'Все правильно!' : "Hammasi to'g'ri!"}
        </div>
      )}
    </div>
  );
}
