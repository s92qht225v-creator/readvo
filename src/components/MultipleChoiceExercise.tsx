'use client';

/**
 * MultipleChoiceExercise Component
 *
 * Interactive exercise where users choose the correct option (A/B/C) for each question.
 * Each question has its own set of options.
 */

import React, { useState, useCallback } from 'react';

export interface MCOption {
  label: string;
  word: string;
  pinyin: string;
}

export interface MCQuestion {
  id: string;
  number: number;
  parts: { type: 'text' | 'blank'; content?: string }[];
  options: MCOption[];
  correctOptionLabel: string;
}

export interface MultipleChoiceExerciseProps {
  questions: MCQuestion[];
  language: 'uz' | 'ru';
}

export const MultipleChoiceExercise: React.FC<MultipleChoiceExerciseProps> = ({
  questions,
  language,
}) => {
  const [correctAnswers, setCorrectAnswers] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [wrongAttempt, setWrongAttempt] = useState<string | null>(null);

  const handleOptionClick = useCallback((questionId: string, optionLabel: string) => {
    if (correctAnswers.has(questionId)) return;

    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    if (question.correctOptionLabel === optionLabel) {
      setCorrectAnswers((prev) => new Set([...prev, questionId]));
      setSelectedAnswers((prev) => {
        const next = new Map(prev);
        next.set(questionId, optionLabel);
        return next;
      });
    } else {
      setSelectedAnswers((prev) => {
        const next = new Map(prev);
        next.set(questionId, optionLabel);
        return next;
      });
      setWrongAttempt(questionId);
      setTimeout(() => setWrongAttempt(null), 600);
    }
  }, [correctAnswers, questions]);

  const isComplete = correctAnswers.size === questions.length;
  const progress = correctAnswers.size;
  const total = questions.length;

  return (
    <div className="mc">
      {/* Progress */}
      <div className="mc__progress">
        <span className="mc__progress-text">{progress}/{total}</span>
        <div className="mc__progress-bar">
          <div
            className="mc__progress-fill"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="mc__questions">
        {questions.map((question) => {
          const isCorrect = correctAnswers.has(question.id);
          const isWrong = wrongAttempt === question.id;
          const selected = selectedAnswers.get(question.id);

          return (
            <div
              key={question.id}
              className={`mc__question ${isCorrect ? 'mc__question--correct' : ''} ${isWrong ? 'mc__question--wrong' : ''}`}
            >
              {/* Question sentence with blank */}
              <div className="mc__sentence">
                <span className="mc__number">({question.number})</span>
                <span className="mc__text">
                  {question.parts.map((part, idx) => {
                    if (part.type === 'text') {
                      return <span key={idx}>{part.content}</span>;
                    }
                    // Blank - show selected answer or placeholder
                    const selectedOption = question.options.find((o) => o.label === selected);
                    return (
                      <span
                        key={idx}
                        className={`mc__blank ${isCorrect ? 'mc__blank--correct' : ''} ${isWrong ? 'mc__blank--wrong' : ''}`}
                      >
                        {selectedOption ? selectedOption.word : '______'}
                      </span>
                    );
                  })}
                </span>
              </div>

              {/* Options A/B/C */}
              <div className="mc__options">
                {question.options.map((option) => {
                  const isSelectedOption = selected === option.label;
                  const isCorrectOption = isCorrect && option.label === question.correctOptionLabel;
                  const isWrongOption = isWrong && isSelectedOption;

                  return (
                    <button
                      key={option.label}
                      className={`mc__option ${isCorrectOption ? 'mc__option--correct' : ''} ${isWrongOption ? 'mc__option--wrong' : ''}`}
                      onClick={() => handleOptionClick(question.id, option.label)}
                      disabled={isCorrect}
                    >
                      <span className="mc__option-label">{option.label}</span>
                      <span className="mc__option-content">
                        <span className="mc__option-pinyin">{option.pinyin}</span>
                        <span className="mc__option-word">{option.word}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {isComplete && (
        <div className="mc__complete">
          <span className="mc__complete-icon">🎉</span>
          <span className="mc__complete-text">
            {language === 'ru' ? 'Отлично!' : 'Ajoyib!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceExercise;
