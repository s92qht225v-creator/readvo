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

import React, { useCallback } from 'react';
import type { Sentence as SentenceType } from '../types';
import type { Language } from '../types/ui-state';
import { alignPinyinToText } from '../utils/rubyText';

/** Renders Chinese text with character-aligned pinyin below using ruby tags */
function RubyText({ text, pinyin, show }: { text: string; pinyin: string; show: boolean }) {
  const pairs = alignPinyinToText(text, pinyin);
  return (
    <>
      {pairs.map((p, i) =>
        p.pinyin ? (
          <ruby key={i}>
            {p.char}
            <rp>(</rp>
            <rt style={show ? undefined : { visibility: 'hidden' }}>{p.pinyin}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i}>{p.char}</span>
        )
      )}
    </>
  );
}

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

  /** Callback when sentence is tapped (for translation panel) */
  onSentenceClick?: (sentenceId: string) => void;

  /** Whether this sentence is currently active/selected */
  isActive?: boolean;
}

export const Sentence: React.FC<SentenceProps> = React.memo(function Sentence({
  sentence,
  isTranslationVisible,
  isPinyinVisible,
  language,
  isAudioPlaying,
  isAudioLoading,
  onAudioClick,
  onSentenceClick,
  isActive,
}) {
  // Get translation based on selected language
  const translation = language === 'ru' && sentence.text_translation_ru
    ? sentence.text_translation_ru
    : sentence.text_translation;

  // Determine if pinyin should be shown
  const showPinyin = sentence.section === 'objectives' ? false
    : isPinyinVisible;

  // Check if sentence starts with a number pattern like (1), (2), etc.
  const isNumbered = sentence.text_original ? /^[（(]\d+[)）]/.test(sentence.text_original) : false;

  // Check if this is a dialogue item with separate number column
  const hasDialogueNumber = sentence.dialogueNumber !== undefined;

  // Sentences with always-visible inline translations don't need the panel
  const hasInlineTranslation = sentence.section === 'vocabulary' || sentence.section === 'objectives' || (sentence.section === 'grammar' && !sentence.pinyin);

  const handleSentenceClick = useCallback(() => {
    if (!hasInlineTranslation) {
      onSentenceClick?.(sentence.id);
    }
    // Auto-play audio when sentence is tapped (if it has audio)
    if (sentence.audio_url) {
      onAudioClick(sentence.id, sentence.audio_url);
    }
  }, [sentence.id, sentence.audio_url, onSentenceClick, onAudioClick, hasInlineTranslation]);

  // Image-only sentence (e.g., textbook table scan in grammar sections)
  if (sentence.image_url && (!sentence.text_original || sentence.text_original.trim() === '')) {
    return (
      <div className="sentence sentence--image-only" data-sentence-id={sentence.id}>
        <img
          src={sentence.image_url}
          alt="Textbook content"
          className="sentence__inline-image"
        />
      </div>
    );
  }

  // Dialogue layout with number inline with text
  if (hasDialogueNumber) {
    return (
      <div
        className={`sentence sentence--dialogue-grid${sentence.dialogueNumber ? ' sentence--dialogue-start' : ' sentence--dialogue-reply'}${isActive ? ' sentence--active' : ''}`}
        data-sentence-id={sentence.id}
        data-section={sentence.section}
        onClick={handleSentenceClick}
      >
        <span className="sentence__number">{sentence.dialogueNumber ? `(${sentence.dialogueNumber})` : ''}</span>
        <div className="sentence__dialogue-content">
          {sentence.speaker && (
            <span className="sentence__speaker">{sentence.speaker}</span>
          )}
          <div className="sentence__text-block">
            <span className="sentence__text">
              {sentence.pinyin ? (
                <RubyText text={sentence.text_original} pinyin={sentence.pinyin} show={showPinyin} />
              ) : sentence.text_original}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`sentence sentence--${sentence.section}${sentence.isIndented ? ' sentence--indented' : ''}${isActive ? ' sentence--active' : ''}${isAudioPlaying ? ' sentence--playing' : ''}${sentence.audio_url ? ' sentence--has-audio' : ''}`}
      data-sentence-id={sentence.id}
      data-section={sentence.section}
      data-numbered={isNumbered ? 'true' : undefined}
      onClick={handleSentenceClick}
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
          {/* Chinese text (tap sentence to play audio) */}
          {sentence.text_original && (
            <span className="sentence__text">
              {sentence.pinyin && sentence.section !== 'objectives' ? (
                <RubyText text={sentence.text_original} pinyin={sentence.pinyin} show={showPinyin} />
              ) : sentence.text_original}
            </span>
          )}

          {/* Translation (always visible inline for vocabulary/objectives/grammar explanations; examples use panel) */}
          {(sentence.section === 'vocabulary' || sentence.section === 'objectives' || (sentence.section === 'grammar' && !sentence.pinyin)) && (
            <span className="sentence__translation-inline">{translation}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default Sentence;
