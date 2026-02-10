'use client';

/**
 * MatchingExercise Component
 *
 * Interactive exercise where users match images to words/phrases.
 * Tap an image, then tap the matching word to make a connection.
 *
 * RESPONSIBILITIES:
 * - Display grid of images
 * - Display word options with pinyin
 * - Handle tap-to-match interaction
 * - Show correct/incorrect feedback
 * - Track progress
 */

import React, { useState, useCallback, useEffect } from 'react';
import { shuffleArray } from '../utils/shuffle';

export interface MatchingItem {
  id: string;
  image_url: string;
  word: string;
  pinyin: string;
  translation?: string;
  translation_ru?: string;
}

export interface MatchingExerciseProps {
  items: MatchingItem[];
  instruction?: string;
  instruction_ru?: string;
  language: 'uz' | 'ru';
}

interface MatchState {
  selectedImageId: string | null;
  matchedPairs: Set<string>;
  wrongAttempt: string | null;
}

export const MatchingExercise: React.FC<MatchingExerciseProps> = ({
  items,
  instruction,
  instruction_ru,
  language,
}) => {
  const [state, setState] = useState<MatchState>({
    selectedImageId: null,
    matchedPairs: new Set(),
    wrongAttempt: null,
  });

  // Shuffle words only on client after hydration to avoid mismatch
  const [shuffledWords, setShuffledWords] = useState<MatchingItem[]>(items);
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    if (!isShuffled) {
      setShuffledWords(shuffleArray(items));
      setIsShuffled(true);
    }
  }, [items, isShuffled]);

  const handleImageClick = useCallback((itemId: string) => {
    // Don't allow selecting already matched images
    if (state.matchedPairs.has(itemId)) return;

    setState((prev) => ({
      ...prev,
      selectedImageId: prev.selectedImageId === itemId ? null : itemId,
      wrongAttempt: null,
    }));
  }, [state.matchedPairs]);

  const handleWordClick = useCallback((itemId: string) => {
    // Don't allow selecting already matched words
    if (state.matchedPairs.has(itemId)) return;

    // If no image selected, do nothing
    if (!state.selectedImageId) return;

    // Check if it's a match
    if (state.selectedImageId === itemId) {
      // Correct match!
      setState((prev) => ({
        selectedImageId: null,
        matchedPairs: new Set([...prev.matchedPairs, itemId]),
        wrongAttempt: null,
      }));
    } else {
      // Wrong match - show feedback
      setState((prev) => ({
        ...prev,
        wrongAttempt: itemId,
      }));

      // Clear wrong attempt after animation
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          wrongAttempt: null,
        }));
      }, 600);
    }
  }, [state.selectedImageId]);

  const isComplete = state.matchedPairs.size === items.length;
  const progress = state.matchedPairs.size;
  const total = items.length;

  const getInstruction = () => {
    if (language === 'ru' && instruction_ru) return instruction_ru;
    return instruction;
  };

  return (
    <div className="matching">
      {/* Progress */}
      <div className="matching__progress">
        <span className="matching__progress-text">
          {progress}/{total}
        </span>
        <div className="matching__progress-bar">
          <div
            className="matching__progress-fill"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Images Grid */}
      <div className="matching__images">
        {items.map((item) => {
          const isMatched = state.matchedPairs.has(item.id);
          const isSelected = state.selectedImageId === item.id;

          return (
            <button
              key={item.id}
              className={`matching__image-card ${isSelected ? 'matching__image-card--selected' : ''} ${isMatched ? 'matching__image-card--matched' : ''}`}
              onClick={() => handleImageClick(item.id)}
              disabled={isMatched}
              aria-label={`Image for ${item.word}`}
            >
              <img
                src={item.image_url}
                alt=""
                className="matching__image"
              />
              {isMatched && (
                <div className="matching__check">✓</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Word Options */}
      <div className="matching__words">
        {shuffledWords.map((item) => {
          const isMatched = state.matchedPairs.has(item.id);
          const isWrong = state.wrongAttempt === item.id;

          return (
            <button
              key={item.id}
              className={`matching__word-card ${isMatched ? 'matching__word-card--matched' : ''} ${isWrong ? 'matching__word-card--wrong' : ''}`}
              onClick={() => handleWordClick(item.id)}
              disabled={isMatched}
            >
              <span className="matching__word-pinyin">{item.pinyin}</span>
              <span className="matching__word-text">{item.word}</span>
            </button>
          );
        })}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="matching__complete">
          <span className="matching__complete-icon">🎉</span>
          <span className="matching__complete-text">
            {language === 'ru' ? 'Отлично!' : 'Ajoyib!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default MatchingExercise;
