'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { Language } from '../types/ui-state';

interface WordEntry {
  w: string;
  t: string;
  tr: string;
}

interface Card {
  id: string;
  sentence: string;
  errorStart: number;
  errorEnd: number;
  correctAnswer: string;
  alternateAnswers?: string[];
  words?: WordEntry[];
}

interface Props {
  cards: Card[];
  language: Language;
}

function findWordEntry(token: string, words: WordEntry[]): WordEntry | undefined {
  const lower = token.toLowerCase().replace(/[.,!?;:'\"]/g, '');
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
          {({ uz: entry.t, ru: entry.tr, en: entry.t } as Record<string, string>)[language]}
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

export function ErrorCorrectionExercise({ cards, language }: Props) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    cards.forEach((card) => { init[card.id] = ''; });
    return init;
  });
  const [checked, setChecked] = useState<Record<string, boolean | null>>({});
  const [activeWord, setActiveWord] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWord) return;
    const dismiss = () => setActiveWord(null);
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, [activeWord]);

  const handleInputChange = useCallback((cardId: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [cardId]: value }));
    setChecked((prev) => ({ ...prev, [cardId]: null }));
  }, []);

  const checkCard = useCallback((card: Card) => {
    const userVal = (userAnswers[card.id] || '').trim().toLowerCase();
    return userVal === card.correctAnswer.toLowerCase()
      || (card.alternateAnswers || []).some((alt) => alt.toLowerCase() === userVal);
  }, [userAnswers]);

  const handleCheckAll = useCallback(() => {
    setChecked((prev) => {
      const updated = { ...prev };
      cards.forEach((card) => {
        if (updated[card.id] === true) return;
        const answer = (userAnswers[card.id] || '').trim();
        if (!answer) return;
        updated[card.id] = checkCard(card);
      });
      return updated;
    });
  }, [cards, userAnswers, checkCard]);

  const handleWordTap = useCallback((entry: WordEntry) => {
    setActiveWord((prev) => (prev === entry.w ? null : entry.w));
  }, []);

  const totalCards = cards.length;
  const completedCards = cards.filter((card) => checked[card.id] === true).length;
  const hasFilledUnchecked = cards.some((card) => {
    if (checked[card.id] === true) return false;
    return (userAnswers[card.id] || '').trim().length > 0;
  });

  return (
    <div className="errorcorrection">
      <div className="errorcorrection__progress">
        <div
          className="errorcorrection__progress-bar"
          style={{ width: `${(completedCards / totalCards) * 100}%` }}
        />
      </div>

      {cards.map((card, cardIdx) => {
        const isCorrect = checked[card.id] === true;
        const isWrong = checked[card.id] === false;

        const beforeError = card.sentence.slice(0, card.errorStart);
        const errorText = card.sentence.slice(card.errorStart, card.errorEnd);
        const afterError = card.sentence.slice(card.errorEnd);

        return (
          <div key={card.id} className={`errorcorrection__card${isCorrect ? ' errorcorrection__card--correct' : ''}`}>
            <div className="errorcorrection__sentence">
              <span className="errorcorrection__number">{cardIdx + 1}</span>
              <RenderTappableText text={beforeError} words={card.words} language={language} activeWord={activeWord} onWordTap={handleWordTap} />
              <span className="errorcorrection__error">
                <RenderTappableText text={errorText} words={card.words} language={language} activeWord={activeWord} onWordTap={handleWordTap} />
              </span>
              <RenderTappableText text={afterError} words={card.words} language={language} activeWord={activeWord} onWordTap={handleWordTap} />
            </div>
            <input
              type="text"
              className={`errorcorrection__input${isCorrect ? ' errorcorrection__input--correct' : ''}${isWrong ? ' errorcorrection__input--wrong' : ''}`}
              value={userAnswers[card.id] || ''}
              onChange={(e) => handleInputChange(card.id, e.target.value)}
              placeholder=""
              disabled={isCorrect}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        );
      })}

      {completedCards < totalCards && (
        <button
          className="errorcorrection__check-btn errorcorrection__check-btn--bottom"
          type="button"
          onClick={handleCheckAll}
          disabled={!hasFilledUnchecked}
        >
          {({ uz: 'Tekshirish', ru: 'Проверить', en: 'Check' } as Record<string, string>)[language]}
        </button>
      )}

      {completedCards === totalCards && (
        <div className="errorcorrection__complete">
          {({ uz: "Hammasi to'g'ri!", ru: 'Все правильно!', en: 'All correct!' } as Record<string, string>)[language]}
        </div>
      )}
    </div>
  );
}
