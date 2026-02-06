'use client';

/**
 * Sentence Component
 *
 * The atomic unit of the reading system.
 * Owns: words, audio button.
 *
 * RESPONSIBILITIES:
 * - Render all word tokens
 * - Render audio button if audio_url exists
 * - Display pinyin and translation when visible (controlled by props)
 *
 * NON-RESPONSIBILITIES:
 * - No knowledge of other sentences
 * - No page-level state management
 */

import React, { useCallback, type MouseEvent } from 'react';
import type { Sentence as SentenceType } from '../types';
import type { Language } from '../types/ui-state';

export interface SentenceProps {
  /** The sentence data */
  sentence: SentenceType;

  /** Whether translation is currently visible */
  isTranslationVisible: boolean;

  /** Whether pinyin is currently visible */
  isPinyinVisible: boolean;

  /** Selected language for translations */
  language: Language;

  /** Whether audio is currently playing for this sentence */
  isAudioPlaying: boolean;

  /** Whether audio is loading for this sentence */
  isAudioLoading: boolean;

  /** Callback when audio button is clicked */
  onAudioClick: (sentenceId: string, audioUrl: string) => void;
}

export const Sentence: React.FC<SentenceProps> = React.memo(function Sentence({
  sentence,
  isTranslationVisible,
  isPinyinVisible,
  language,
  isAudioPlaying,
  isAudioLoading,
  onAudioClick,
}) {
  // Get translation based on selected language
  const translation = language === 'ru' && sentence.text_translation_ru
    ? sentence.text_translation_ru
    : sentence.text_translation;

  // Check if sentence starts with a number pattern like (1), (2), etc.
  const isNumbered = /^[（(]\d+[)）]/.test(sentence.text_original);

  // Check if this is a dialogue item with separate number column
  const hasDialogueNumber = sentence.dialogueNumber !== undefined;

  const handleAudioClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (sentence.audio_url) {
        onAudioClick(sentence.id, sentence.audio_url);
      }
    },
    [sentence.id, sentence.audio_url, onAudioClick]
  );

  // Dialogue layout with number inline with text
  if (hasDialogueNumber) {
    return (
      <div
        className="sentence sentence--dialogue-grid"
        data-sentence-id={sentence.id}
        data-section={sentence.section}
      >
        <div className="sentence__main-line">
          <span className="sentence__number">{sentence.dialogueNumber ? `(${sentence.dialogueNumber})` : ''}</span>
          <span className="sentence__text">{sentence.text_original}</span>
        </div>
        {sentence.pinyin && isPinyinVisible && (
          <div className="sentence__pinyin">{sentence.pinyin}</div>
        )}
        {isTranslationVisible && (
          <div className="sentence__translation-inline">{translation}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`sentence sentence--${sentence.section}${sentence.isIndented ? ' sentence--indented' : ''}`}
      data-sentence-id={sentence.id}
      data-section={sentence.section}
      data-numbered={isNumbered ? 'true' : undefined}
    >
      {/* Speaker label (for dialogue) */}
      {sentence.speaker && (
        <span className="sentence__speaker">{sentence.speaker}</span>
      )}

      {/* Main sentence content */}
      <div className="sentence__body">
        {/* Grammar number badge */}
        {sentence.grammarNumber && (
          <span className="sentence__grammar-number">{sentence.grammarNumber}</span>
        )}

        {/* Checkbox for objectives */}
        {sentence.isCheckbox && (
          <span className="sentence__checkbox" aria-hidden="true">■</span>
        )}

        {/* Text block with Chinese, pinyin, and translation below */}
        <div className="sentence__text-block">
          {/* First line: Chinese text + audio button */}
          <span className="sentence__text-row">
            <span className="sentence__text">{sentence.text_original}</span>
            {/* Audio button (only if audio_url exists) */}
            {sentence.audio_url && (
              <button
                className={`sentence__audio-btn ${isAudioPlaying ? 'sentence__audio-btn--playing' : ''} ${isAudioLoading ? 'sentence__audio-btn--loading' : ''}`}
                onClick={handleAudioClick}
                aria-label={isAudioPlaying ? 'Audioni to\'xtatish' : 'Audioni tinglash'}
                disabled={isAudioLoading}
                type="button"
              >
                {isAudioLoading ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                ) : isAudioPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
            )}
          </span>

          {/* Pinyin below the text (always visible for vocabulary, otherwise conditionally) */}
          {sentence.pinyin && (sentence.section === 'vocabulary' || isPinyinVisible) && (
            <span className="sentence__pinyin">{sentence.pinyin}</span>
          )}

          {/* Translation below pinyin (always visible for vocabulary, otherwise conditionally) */}
          {(sentence.section === 'vocabulary' || isTranslationVisible) && (
            <span className="sentence__translation-inline">{translation}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default Sentence;
