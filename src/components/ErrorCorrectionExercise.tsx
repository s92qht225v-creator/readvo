'use client';

import React, { useState, useCallback } from 'react';
import type { Language } from '../types/ui-state';

interface Card {
  id: string;
  sentence: string;
  errorStart: number;
  errorEnd: number;
  correctAnswer: string;
  alternateAnswers?: string[];
}

interface Props {
  cards: Card[];
  language: Language;
}

export function ErrorCorrectionExercise({ cards, language }: Props) {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    cards.forEach((card) => { init[card.id] = ''; });
    return init;
  });
  const [checked, setChecked] = useState<Record<string, boolean | null>>({});

  const handleInputChange = useCallback((cardId: string, value: string) => {
    setUserAnswers((prev) => ({ ...prev, [cardId]: value }));
    setChecked((prev) => ({ ...prev, [cardId]: null }));
  }, []);

  const handleCheck = useCallback((card: Card) => {
    const userVal = (userAnswers[card.id] || '').trim().toLowerCase();
    const isCorrect = userVal === card.correctAnswer.toLowerCase()
      || (card.alternateAnswers || []).some((alt) => alt.toLowerCase() === userVal);
    setChecked((prev) => ({ ...prev, [card.id]: isCorrect }));
  }, [userAnswers]);

  const totalCards = cards.length;
  const completedCards = cards.filter((card) => checked[card.id] === true).length;

  return (
    <div className="errorcorrection">
      {/* Progress */}
      <div className="errorcorrection__progress">
        <div
          className="errorcorrection__progress-bar"
          style={{ width: `${(completedCards / totalCards) * 100}%` }}
        />
      </div>

      {cards.map((card, cardIdx) => {
        const isCorrect = checked[card.id] === true;
        const isWrong = checked[card.id] === false;

        // Split sentence into: before error, error, after error
        const beforeError = card.sentence.slice(0, card.errorStart);
        const errorText = card.sentence.slice(card.errorStart, card.errorEnd);
        const afterError = card.sentence.slice(card.errorEnd);

        return (
          <div key={card.id} className={`errorcorrection__card${isCorrect ? ' errorcorrection__card--correct' : ''}`}>
            <span className="errorcorrection__number">{cardIdx + 1}</span>
            <p className="errorcorrection__sentence">
              {beforeError}
              <span className="errorcorrection__error">{errorText}</span>
              {afterError}
            </p>
            <div className="errorcorrection__answer-row">
              <input
                type="text"
                className={`errorcorrection__input${isCorrect ? ' errorcorrection__input--correct' : ''}${isWrong ? ' errorcorrection__input--wrong' : ''}`}
                value={userAnswers[card.id] || ''}
                onChange={(e) => handleInputChange(card.id, e.target.value)}
                placeholder={language === 'ru' ? 'Исправление...' : "To'g'rilash..."}
                disabled={isCorrect}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {!isCorrect && (
                <button
                  className="errorcorrection__check-btn"
                  type="button"
                  onClick={() => handleCheck(card)}
                  disabled={!(userAnswers[card.id] || '').trim()}
                >
                  {language === 'ru' ? 'Проверить' : 'Tekshirish'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {completedCards === totalCards && (
        <div className="errorcorrection__complete">
          {language === 'ru' ? 'Все правильно!' : "Hammasi to'g'ri!"}
        </div>
      )}
    </div>
  );
}
