'use client';

import React from 'react';
import type { FlashcardWord } from '../types';
import type { Language } from '../types/ui-state';

export interface FlashcardCardProps {
  word: FlashcardWord;
  isFlipped: boolean;
  isPinyinVisible: boolean;
  language: Language;
  direction: 'cn' | 'native';
  onFlip: () => void;
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({
  word,
  isFlipped,
  isPinyinVisible,
  language,
  direction,
  onFlip,
}) => {
  const translation = language === 'ru' && word.text_translation_ru
    ? word.text_translation_ru
    : word.text_translation;

  return (
    <div className="flashcard__card-container">
      <div
        className={`flashcard__card${isFlipped ? ' flashcard__card--flipped' : ''}`}
        onClick={onFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onFlip(); }}
      >
        {/* Front face */}
        <div className="flashcard__face flashcard__face--front">
          <div className="flashcard__front-content">
            {direction === 'cn' ? (
              <>
                <span className="flashcard__chinese">{word.text_original}</span>
                {isPinyinVisible && (
                  <span className="flashcard__pinyin">{word.pinyin}</span>
                )}
              </>
            ) : (
              <span className="flashcard__translation">{translation}</span>
            )}
          </div>
          <span className="flashcard__tap-hint">
            {language === 'ru' ? 'Нажмите, чтобы перевернуть' : 'Kartani aylantirish uchun bosing'}
          </span>
        </div>

        {/* Back face */}
        <div className="flashcard__face flashcard__face--back">
          <div className="flashcard__front-content">
            {direction === 'cn' ? (
              <>
                <span className="flashcard__translation">{translation}</span>
                <span className="flashcard__back-chinese">{word.text_original}</span>
                <span className="flashcard__back-pinyin">{word.pinyin}</span>
              </>
            ) : (
              <>
                <span className="flashcard__chinese">{word.text_original}</span>
                {isPinyinVisible && (
                  <span className="flashcard__pinyin">{word.pinyin}</span>
                )}
                <span className="flashcard__back-translation">{translation}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardCard;
