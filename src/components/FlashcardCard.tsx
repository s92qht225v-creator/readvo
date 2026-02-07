'use client';

import React, { useCallback, type MouseEvent } from 'react';
import type { FlashcardWord } from '../types';
import type { Language } from '../types/ui-state';

export interface FlashcardCardProps {
  word: FlashcardWord;
  isFlipped: boolean;
  isPinyinVisible: boolean;
  language: Language;
  direction: 'cn' | 'native';
  isAudioPlaying: boolean;
  isAudioLoading: boolean;
  onFlip: () => void;
  onAudioClick: (wordId: string, audioUrl: string) => void;
}

export const FlashcardCard: React.FC<FlashcardCardProps> = ({
  word,
  isFlipped,
  isPinyinVisible,
  language,
  direction,
  isAudioPlaying,
  isAudioLoading,
  onFlip,
  onAudioClick,
}) => {
  const translation = language === 'ru' && word.text_translation_ru
    ? word.text_translation_ru
    : word.text_translation;

  const handleAudioClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (word.audio_url) {
        onAudioClick(word.id, word.audio_url);
      }
    },
    [word.id, word.audio_url, onAudioClick]
  );

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
                {word.audio_url && (
                  <button
                    className={`flashcard__audio-btn${isAudioPlaying ? ' flashcard__audio-btn--playing' : ''}${isAudioLoading ? ' flashcard__audio-btn--loading' : ''}`}
                    onClick={handleAudioClick}
                    disabled={isAudioLoading}
                    type="button"
                    aria-label="Audio"
                  >
                    {isAudioLoading ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                    ) : isAudioPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                )}
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
                {word.audio_url && (
                  <button
                    className={`flashcard__audio-btn${isAudioPlaying ? ' flashcard__audio-btn--playing' : ''}${isAudioLoading ? ' flashcard__audio-btn--loading' : ''}`}
                    onClick={handleAudioClick}
                    disabled={isAudioLoading}
                    type="button"
                    aria-label="Audio"
                  >
                    {isAudioLoading ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                    ) : isAudioPlaying ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16"/>
                        <rect x="14" y="4" width="4" height="16"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                )}
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
