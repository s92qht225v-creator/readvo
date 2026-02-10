'use client';

/**
 * FillBlankExercise Component
 *
 * Interactive exercise where users fill blanks in sentences by selecting word options.
 * Tap a blank, then tap a word option to fill it in.
 * Supports multiple blanks per sentence via correctOptionIds array.
 */

import React, { useState, useCallback, useMemo } from 'react';

export interface FillBlankOption {
  id: string;
  label: string; // A, B, C, D, E...
  word: string;
  pinyin: string;
}

export interface FillBlankSentence {
  id: string;
  number?: number;
  parts: SentencePart[];
  correctOptionId: string;
  correctOptionIds?: readonly string[]; // For multi-blank sentences
  speaker?: string;
}

export interface SentencePart {
  type: 'text' | 'blank';
  content?: string;
}

export interface FillBlankExerciseProps {
  options: FillBlankOption[];
  sentences: FillBlankSentence[];
  language: 'uz' | 'ru';
}

interface FillState {
  selectedBlankKey: string | null; // "sentenceId-blankIndex"
  filledBlanks: Map<string, string>; // blankKey -> optionId
  correctBlanks: Set<string>; // set of correct blankKeys
  wrongAttempt: string | null; // blankKey of wrong attempt
}

// Get the correct option ID for a specific blank in a sentence
function getCorrectOptionForBlank(sentence: FillBlankSentence, blankIndex: number): string {
  if (sentence.correctOptionIds && sentence.correctOptionIds[blankIndex] !== undefined) {
    return sentence.correctOptionIds[blankIndex];
  }
  // Fall back to single correctOptionId for single-blank sentences
  return sentence.correctOptionId;
}

// Count blanks in a sentence
function countBlanks(sentence: FillBlankSentence): number {
  return sentence.parts.filter((p) => p.type === 'blank').length;
}

export const FillBlankExercise: React.FC<FillBlankExerciseProps> = ({
  options,
  sentences,
  language,
}) => {
  const [state, setState] = useState<FillState>({
    selectedBlankKey: null,
    filledBlanks: new Map(),
    correctBlanks: new Set(),
    wrongAttempt: null,
  });

  // Check if a sentence has any blanks (interactive) vs just text (static)
  const hasBlank = (sentence: FillBlankSentence) =>
    sentence.parts.some((part) => part.type === 'blank');

  // Track which sentences are fully complete (all blanks correct)
  const completeSentences = useMemo(() => {
    const complete = new Set<string>();
    for (const sentence of sentences) {
      if (!hasBlank(sentence)) continue;
      const blankCount = countBlanks(sentence);
      let allCorrect = true;
      for (let i = 0; i < blankCount; i++) {
        if (!state.correctBlanks.has(`${sentence.id}-${i}`)) {
          allCorrect = false;
          break;
        }
      }
      if (allCorrect) complete.add(sentence.id);
    }
    return complete;
  }, [state.correctBlanks, sentences]);

  const handleBlankClick = useCallback((blankKey: string) => {
    if (state.correctBlanks.has(blankKey)) return;

    setState((prev) => ({
      ...prev,
      selectedBlankKey: prev.selectedBlankKey === blankKey ? null : blankKey,
      wrongAttempt: null,
    }));
  }, [state.correctBlanks]);

  const handleOptionClick = useCallback((optionId: string) => {
    if (!state.selectedBlankKey) return;

    // Parse blankKey: "sentenceId-blankIndex"
    const lastDash = state.selectedBlankKey.lastIndexOf('-');
    const sentenceId = state.selectedBlankKey.substring(0, lastDash);
    const blankIndex = parseInt(state.selectedBlankKey.substring(lastDash + 1), 10);

    const sentence = sentences.find((s) => s.id === sentenceId);
    if (!sentence) return;

    const correctOptionId = getCorrectOptionForBlank(sentence, blankIndex);

    if (correctOptionId === optionId) {
      // Correct!
      setState((prev) => {
        const newFilled = new Map(prev.filledBlanks);
        newFilled.set(state.selectedBlankKey!, optionId);
        return {
          selectedBlankKey: null,
          filledBlanks: newFilled,
          correctBlanks: new Set([...prev.correctBlanks, state.selectedBlankKey!]),
          wrongAttempt: null,
        };
      });
    } else {
      // Wrong
      const blankKey = state.selectedBlankKey;
      setState((prev) => {
        const newFilled = new Map(prev.filledBlanks);
        newFilled.set(blankKey, optionId);
        return {
          ...prev,
          filledBlanks: newFilled,
          wrongAttempt: blankKey,
        };
      });

      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          wrongAttempt: null,
        }));
      }, 600);
    }
  }, [state.selectedBlankKey, sentences]);

  const getOptionWord = (optionId: string) => {
    const option = options.find((o) => o.id === optionId);
    return option?.word || '';
  };

  // Only count sentences with blanks for progress
  const interactiveSentences = sentences.filter(hasBlank);
  const isComplete = completeSentences.size === interactiveSentences.length;
  const progress = completeSentences.size;
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
            style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Word Options */}
      <div className="fillblank__options">
        {options.map((option) => (
          <button
            key={option.id}
            className={`fillblank__option ${state.selectedBlankKey ? 'fillblank__option--active' : ''}`}
            onClick={() => handleOptionClick(option.id)}
            disabled={!state.selectedBlankKey}
          >
            <span className="fillblank__option-label">{option.label}</span>
            <span className="fillblank__option-word">{option.word}</span>
          </button>
        ))}
      </div>

      {/* Sentences */}
      <div className="fillblank__sentences">
        {sentences.map((sentence) => {
          const sentenceComplete = completeSentences.has(sentence.id);
          let blankIndex = 0;

          return (
            <div
              key={sentence.id}
              className={`fillblank__sentence ${sentenceComplete ? 'fillblank__sentence--correct' : ''}`}
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
                  const currentBlankIndex = blankIndex;
                  blankIndex++;
                  const blankKey = `${sentence.id}-${currentBlankIndex}`;
                  const isSelected = state.selectedBlankKey === blankKey;
                  const isCorrect = state.correctBlanks.has(blankKey);
                  const isWrong = state.wrongAttempt === blankKey;
                  const filledOptionId = state.filledBlanks.get(blankKey);

                  return (
                    <button
                      key={idx}
                      className={`fillblank__blank ${isSelected ? 'fillblank__blank--selected' : ''} ${isCorrect ? 'fillblank__blank--correct' : ''} ${isWrong ? 'fillblank__blank--wrong' : ''}`}
                      onClick={() => handleBlankClick(blankKey)}
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
