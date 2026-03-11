'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type { Language } from '../types/ui-state';

interface WordEntry {
  w: string;
  t: string;
  tr: string;
}

interface ErrorItem {
  id: number;
  errorStart: number;
  errorEnd: number;
  correctAnswer: string;
  alternateAnswers?: string[];
}

interface Props {
  passage: string;
  errors: ErrorItem[];
  words?: WordEntry[];
  language: Language;
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

export function TextErrorExercise({ passage, errors, words, language }: Props) {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean | null>>({});
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

  const handleInputChange = useCallback((errorId: number, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [errorId]: value }));
    setChecked((prev) => ({ ...prev, [errorId]: null }));
  }, []);

  const handleCheckAll = useCallback(() => {
    setChecked((prev) => {
      const updated = { ...prev };
      errors.forEach((err) => {
        if (updated[err.id] === true) return;
        const answer = (userAnswers[err.id] || '').trim();
        if (!answer) return;
        const userVal = answer.toLowerCase();
        const isCorrect = userVal === err.correctAnswer.toLowerCase()
          || (err.alternateAnswers || []).some((alt) => alt.toLowerCase() === userVal);
        updated[err.id] = isCorrect;
      });
      return updated;
    });
  }, [errors, userAnswers]);

  const totalErrors = errors.length;
  const completedErrors = errors.filter((err) => checked[err.id] === true).length;
  const hasFilledUnchecked = errors.some((err) => {
    if (checked[err.id] === true) return false;
    return (userAnswers[err.id] || '').trim().length > 0;
  });

  // Build passage with bolded errors and superscript numbers
  const passageParts: React.ReactNode[] = [];
  let lastIdx = 0;
  const sortedErrors = [...errors].sort((a, b) => a.errorStart - b.errorStart);

  sortedErrors.forEach((err) => {
    // Text before this error
    if (err.errorStart > lastIdx) {
      const before = passage.slice(lastIdx, err.errorStart);
      passageParts.push(
        <React.Fragment key={`t-${lastIdx}`}>
          <RenderTappableText text={before} words={words} language={language} activeWord={activeWord} onWordTap={handleWordTap} />
        </React.Fragment>
      );
    }
    // The error text (no visual markers — students must find errors themselves)
    const errorText = passage.slice(err.errorStart, err.errorEnd);
    passageParts.push(
      <React.Fragment key={`e-${err.id}`}>
        <RenderTappableText text={errorText} words={words} language={language} activeWord={activeWord} onWordTap={handleWordTap} />
      </React.Fragment>
    );
    lastIdx = err.errorEnd;
  });

  // Text after the last error
  if (lastIdx < passage.length) {
    passageParts.push(
      <React.Fragment key={`t-${lastIdx}`}>
        <RenderTappableText text={passage.slice(lastIdx)} words={words} language={language} activeWord={activeWord} onWordTap={handleWordTap} />
      </React.Fragment>
    );
  }

  return (
    <div className="texterror">
      <div className="texterror__progress">
        <div
          className="texterror__progress-bar"
          style={{ width: `${totalErrors > 0 ? (completedErrors / totalErrors) * 100 : 0}%` }}
        />
      </div>

      <div className="texterror__passage">
        {passageParts}
      </div>

      <div className="texterror__inputs">
        {errors.map((err) => {
          const isCorrect = checked[err.id] === true;
          const isWrong = checked[err.id] === false;

          return (
            <div key={err.id} className={`texterror__input-row${isCorrect ? ' texterror__input-row--correct' : ''}`}>
              <span className="texterror__input-num">{err.id}</span>
              <input
                type="text"
                className={`texterror__input${isCorrect ? ' texterror__input--correct' : ''}${isWrong ? ' texterror__input--wrong' : ''}`}
                value={userAnswers[err.id] || ''}
                onChange={(e) => handleInputChange(err.id, e.target.value)}
                disabled={isCorrect}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          );
        })}
      </div>

      {completedErrors < totalErrors && (
        <button
          className="texterror__check-btn"
          type="button"
          onClick={handleCheckAll}
          disabled={!hasFilledUnchecked}
        >
          {({ uz: 'Tekshirish', ru: 'Проверить', en: 'Check' } as Record<string, string>)[language]}
        </button>
      )}

      {completedErrors === totalErrors && totalErrors > 0 && (
        <div className="texterror__complete">
          {({ uz: "Hammasi to'g'ri!", ru: 'Все правильно!', en: 'All correct!' } as Record<string, string>)[language]}
        </div>
      )}
    </div>
  );
}
