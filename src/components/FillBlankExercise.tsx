'use client';

/**
 * FillBlankExercise Component
 *
 * Interactive exercise where users fill blanks in sentences by selecting word options.
 * Tap a blank, then tap a word option to fill it in.
 *
 * RESPONSIBILITIES:
 * - Display word options (A, B, C, D, E...)
 * - Display sentences with clickable blanks
 * - Handle tap-to-fill interaction
 * - Show correct/incorrect feedback
 * - Track progress
 */

import React, { useState, useCallback } from 'react';

export interface FillBlankOption {
  id: string;
  label: string; // A, B, C, D, E...
  word: string;
  pinyin: string;
}

export interface FillBlankSentence {
  id: string;
  number?: number; // (1), (2), (3)... - optional for dialogue continuations
  parts: SentencePart[];
  correctOptionId: string;
  speaker?: string; // Optional speaker name for dialogues
}

export interface SentencePart {
  type: 'text' | 'blank';
  content?: string; // For text parts
}

export interface FillBlankExerciseProps {
  options: FillBlankOption[];
  sentences: FillBlankSentence[];
  language: 'uz' | 'ru';
}

interface FillState {
  selectedBlankId: string | null;
  filledBlanks: Map<string, string>; // sentenceId -> optionId
  correctBlanks: Set<string>;
  wrongAttempt: string | null;
}

export const FillBlankExercise: React.FC<FillBlankExerciseProps> = ({
  options,
  sentences,
  language,
}) => {
  const [state, setState] = useState<FillState>({
    selectedBlankId: null,
    filledBlanks: new Map(),
    correctBlanks: new Set(),
    wrongAttempt: null,
  });

  const handleBlankClick = useCallback((sentenceId: string) => {
    // Don't allow selecting already correct blanks
    if (state.correctBlanks.has(sentenceId)) return;

    setState((prev) => ({
      ...prev,
      selectedBlankId: prev.selectedBlankId === sentenceId ? null : sentenceId,
      wrongAttempt: null,
    }));
  }, [state.correctBlanks]);

  const handleOptionClick = useCallback((optionId: string) => {
    // If no blank selected, do nothing
    if (!state.selectedBlankId) return;

    const sentence = sentences.find((s) => s.id === state.selectedBlankId);
    if (!sentence) return;

    // Check if it's correct
    if (sentence.correctOptionId === optionId) {
      // Correct!
      setState((prev) => {
        const newFilled = new Map(prev.filledBlanks);
        newFilled.set(sentence.id, optionId);
        return {
          selectedBlankId: null,
          filledBlanks: newFilled,
          correctBlanks: new Set([...prev.correctBlanks, sentence.id]),
          wrongAttempt: null,
        };
      });
    } else {
      // Wrong - show feedback
      setState((prev) => {
        const newFilled = new Map(prev.filledBlanks);
        newFilled.set(sentence.id, optionId);
        return {
          ...prev,
          filledBlanks: newFilled,
          wrongAttempt: sentence.id,
        };
      });

      // Clear wrong attempt after animation
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          wrongAttempt: null,
        }));
      }, 600);
    }
  }, [state.selectedBlankId, sentences]);

  const getOptionWord = (optionId: string) => {
    const option = options.find((o) => o.id === optionId);
    return option?.word || '';
  };

  // Check if a sentence has any blanks (interactive) vs just text (static)
  const hasBlank = (sentence: FillBlankSentence) =>
    sentence.parts.some((part) => part.type === 'blank');

  // Only count sentences with blanks for progress
  const interactiveSentences = sentences.filter(hasBlank);
  const isComplete = state.correctBlanks.size === interactiveSentences.length;
  const progress = state.correctBlanks.size;
  const total = interactiveSentences.length;

  return (
    <div className="fillblank">
      {/* Progress */}
      <div className="fillblank__progress">
        <span className="fillblank__progress-text">
          {progress}/{total}
        </span>
        <div className="fillblank__progress-bar">
          <div
            className="fillblank__progress-fill"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Word Options */}
      <div className="fillblank__options">
        {options.map((option) => (
          <button
            key={option.id}
            className={`fillblank__option ${state.selectedBlankId ? 'fillblank__option--active' : ''}`}
            onClick={() => handleOptionClick(option.id)}
            disabled={!state.selectedBlankId}
          >
            <span className="fillblank__option-label">{option.label}</span>
            <span className="fillblank__option-word">{option.word}</span>
          </button>
        ))}
      </div>

      {/* Sentences */}
      <div className="fillblank__sentences">
        {sentences.map((sentence) => {
          const isSelected = state.selectedBlankId === sentence.id;
          const isCorrect = state.correctBlanks.has(sentence.id);
          const isWrong = state.wrongAttempt === sentence.id;
          const filledOptionId = state.filledBlanks.get(sentence.id);

          return (
            <div
              key={sentence.id}
              className={`fillblank__sentence ${isCorrect ? 'fillblank__sentence--correct' : ''} ${isWrong ? 'fillblank__sentence--wrong' : ''}`}
            >
              <span className="fillblank__sentence-number">
                {sentence.number !== undefined ? `(${sentence.number})` : ''}
              </span>
              <div className="fillblank__sentence-content">
                {sentence.speaker && (
                  <span className="fillblank__speaker">{sentence.speaker}：</span>
                )}
                {sentence.parts.map((part, idx) => {
                  if (part.type === 'text') {
                    return <span key={idx}>{part.content}</span>;
                  }
                  // Blank
                  return (
                    <button
                      key={idx}
                      className={`fillblank__blank ${isSelected ? 'fillblank__blank--selected' : ''} ${isCorrect ? 'fillblank__blank--correct' : ''} ${isWrong ? 'fillblank__blank--wrong' : ''}`}
                      onClick={() => handleBlankClick(sentence.id)}
                      disabled={isCorrect}
                    >
                      {filledOptionId ? getOptionWord(filledOptionId) : '______'}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="fillblank__complete">
          <span className="fillblank__complete-icon">🎉</span>
          <span className="fillblank__complete-text">
            {language === 'ru' ? 'Отлично!' : 'Ajoyib!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default FillBlankExercise;
