'use client';

/**
 * ImageDescribeExercise Component
 *
 * Exercise where learners type answers into blanks based on images.
 * Each card shows an image with a sentence containing one or more blanks.
 *
 * RESPONSIBILITIES:
 * - Display image cards in a grid
 * - Render sentences with inline text inputs
 * - Validate typed answers against correct answers
 * - Show correct/incorrect feedback
 * - Track progress
 */

import React, { useState, useCallback, useRef } from 'react';

export interface ImageDescribeCard {
  id: string;
  image_url?: string; // optional - for text-only exercises
  parts: { type: 'text' | 'blank'; content?: string }[];
  answers: string[]; // correct answers for each blank, in order
  speaker?: string; // optional - for dialogue exercises
  dialogueNumber?: string; // optional - for numbered dialogues
  pinyin?: string; // optional - pinyin for the sentence
  translation?: string; // optional - translation
}

export interface ImageDescribeExerciseProps {
  cards: ImageDescribeCard[];
  language: 'uz' | 'ru';
}

interface BlankState {
  value: string;
  status: 'empty' | 'correct' | 'wrong';
}

export const ImageDescribeExercise: React.FC<ImageDescribeExerciseProps> = ({
  cards,
  language,
}) => {
  // Track state per blank: cardId-blankIndex -> BlankState
  const [blanks, setBlanks] = useState<Map<string, BlankState>>(new Map());
  const [correctCount, setCorrectCount] = useState(0);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const totalBlanks = cards.reduce(
    (sum, card) => sum + card.answers.length,
    0
  );

  const getBlankKey = (cardId: string, blankIndex: number) =>
    `${cardId}-${blankIndex}`;

  const getBlankState = (key: string): BlankState =>
    blanks.get(key) || { value: '', status: 'empty' };

  const handleInputChange = useCallback(
    (cardId: string, blankIndex: number, value: string) => {
      const key = getBlankKey(cardId, blankIndex);
      setBlanks((prev) => {
        const next = new Map(prev);
        const current = next.get(key);
        // Don't allow changes to correct answers
        if (current?.status === 'correct') return prev;
        next.set(key, { value, status: 'empty' });
        return next;
      });
    },
    []
  );

  const handleCheck = useCallback(
    (cardId: string, blankIndex: number) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const key = getBlankKey(cardId, blankIndex);
      const current = getBlankState(key);
      if (current.status === 'correct') return;

      const correctAnswer = card.answers[blankIndex];
      const isCorrect =
        current.value.trim().toLowerCase() === correctAnswer.toLowerCase();

      setBlanks((prev) => {
        const next = new Map(prev);
        next.set(key, {
          value: isCorrect ? correctAnswer : current.value,
          status: isCorrect ? 'correct' : 'wrong',
        });
        return next;
      });

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      } else {
        // Clear wrong status after animation
        setTimeout(() => {
          setBlanks((prev) => {
            const next = new Map(prev);
            const state = next.get(key);
            if (state?.status === 'wrong') {
              next.set(key, { ...state, status: 'empty' });
            }
            return next;
          });
        }, 600);
      }
    },
    [cards, blanks]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, cardId: string, blankIndex: number) => {
      if (e.key === 'Enter') {
        handleCheck(cardId, blankIndex);
      }
    },
    [handleCheck]
  );

  const isComplete = correctCount === totalBlanks;

  return (
    <div className="imgdesc">
      {/* Progress */}
      <div className="imgdesc__progress">
        <span className="imgdesc__progress-text">
          {correctCount}/{totalBlanks}
        </span>
        <div className="imgdesc__progress-bar">
          <div
            className="imgdesc__progress-fill"
            style={{ width: `${(correctCount / totalBlanks) * 100}%` }}
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="imgdesc__grid">
        {cards.map((card) => {
          let blankIndex = 0;
          const hasDialogue = card.speaker || card.dialogueNumber;

          return (
            <div key={card.id} className="imgdesc__card">
              {card.image_url && (
                <div className="imgdesc__image">
                  <img
                    src={card.image_url}
                    alt=""
                    className="imgdesc__image-img"
                  />
                </div>
              )}
              <div className={`imgdesc__sentence ${hasDialogue ? 'imgdesc__sentence--dialogue' : ''}`}>
                {hasDialogue && (
                  <>
                    <span className="sentence__dialogue-number">
                      {card.dialogueNumber ? `(${card.dialogueNumber})` : ''}
                    </span>
                    <span className="sentence__speaker">
                      {card.speaker ? `${card.speaker}:` : ''}
                    </span>
                  </>
                )}
                <div className="imgdesc__text-content">
                  {card.parts.map((part, idx) => {
                    if (part.type === 'text') {
                      return <span key={idx}>{part.content}</span>;
                    }

                    const currentBlankIndex = blankIndex;
                    blankIndex++;
                    const key = getBlankKey(card.id, currentBlankIndex);
                    const state = getBlankState(key);

                    return (
                      <span
                        key={idx}
                        className={`imgdesc__blank-wrapper ${state.status === 'correct' ? 'imgdesc__blank-wrapper--correct' : ''} ${state.status === 'wrong' ? 'imgdesc__blank-wrapper--wrong' : ''}`}
                      >
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(key, el);
                          }}
                          type="text"
                          className={`imgdesc__input ${state.status === 'correct' ? 'imgdesc__input--correct' : ''} ${state.status === 'wrong' ? 'imgdesc__input--wrong' : ''}`}
                          value={state.value}
                          onChange={(e) =>
                            handleInputChange(
                              card.id,
                              currentBlankIndex,
                              e.target.value
                            )
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, card.id, currentBlankIndex)
                          }
                          disabled={state.status === 'correct'}
                          placeholder="______"
                          autoComplete="off"
                          autoCapitalize="off"
                          spellCheck={false}
                        />
                        {state.status !== 'correct' && state.value.trim() && (
                          <button
                            className="imgdesc__check-btn"
                            onClick={() =>
                              handleCheck(card.id, currentBlankIndex)
                            }
                            aria-label={
                              language === 'ru' ? 'Проверить' : 'Tekshirish'
                            }
                          >
                            ✓
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="imgdesc__complete">
          <span className="imgdesc__complete-icon">🎉</span>
          <span className="imgdesc__complete-text">
            {language === 'ru' ? 'Отлично!' : 'Ajoyib!'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ImageDescribeExercise;
