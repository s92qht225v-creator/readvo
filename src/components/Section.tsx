'use client';

/**
 * Section Component
 *
 * Groups sentences by type with optional heading.
 * Purely structural - no interaction logic.
 *
 * RESPONSIBILITIES:
 * - Render section heading if present
 * - Render all sentences in order
 * - Apply section-type styling
 *
 * NON-RESPONSIBILITIES:
 * - No state management
 * - No interaction handling (passed through to sentences)
 */

import React from 'react';
import type { Section as SectionType } from '../types';
import type { Language } from '../types/ui-state';
import { Sentence } from './Sentence';
import { MatchingExercise } from './MatchingExercise';
import { FillBlankExercise } from './FillBlankExercise';
import { MultipleChoiceExercise } from './MultipleChoiceExercise';
import { ImageDescribeExercise } from './ImageDescribeExercise';
import { TableFillExercise } from './TableFillExercise';

export interface SectionProps {
  /** The section data */
  section: SectionType;

  /** Whether pinyin is visible globally */
  isPinyinVisible: boolean;

  /** Whether translation is visible globally */
  isTranslationVisible: boolean;

  /** Selected language for translations */
  language: Language;

  /** Currently playing sentence ID (or null) */
  playingSentenceId: string | null;

  /** Sentence ID with loading audio (or null) */
  loadingAudioSentenceId: string | null;

  /** Callback when audio button is clicked */
  onAudioClick: (sentenceId: string, audioUrl: string) => void;

  /** Currently playing section ID (or null) */
  playingSectionId: string | null;

  /** Section ID with loading audio (or null) */
  loadingSectionId: string | null;

  /** Callback when section audio button is clicked */
  onSectionAudioClick: (sectionId: string, audioUrl: string) => void;

  /** Currently active/selected sentence ID (for translation panel) */
  activeSentenceId?: string | null;

  /** Callback when a sentence is tapped */
  onSentenceClick?: (sentenceId: string) => void;
}

export const Section: React.FC<SectionProps> = React.memo(function Section({
  section,
  isPinyinVisible,
  isTranslationVisible,
  language,
  playingSentenceId,
  loadingAudioSentenceId,
  onAudioClick,
  playingSectionId,
  loadingSectionId,
  onSectionAudioClick,
  activeSentenceId,
  onSentenceClick,
}) {
  // Helper to get translation based on language
  const getContextTranslation = () => {
    if (language === 'ru' && section.contextTranslation_ru) {
      return section.contextTranslation_ru;
    }
    return section.contextTranslation;
  };

  const getInstruction = () => {
    if (language === 'ru' && section.instruction_ru) {
      return section.instruction_ru;
    }
    return section.instruction;
  };

  const getTipTranslation = () => {
    if (language === 'ru' && section.tip?.translation_ru) {
      return section.tip.translation_ru;
    }
    return section.tip?.translation;
  };

  const getHeading = () => {
    if (language === 'ru' && section.heading_ru) {
      return section.heading_ru;
    }
    return section.heading;
  };

  const getSubheading = () => {
    if (language === 'ru' && section.subheading_ru) {
      return section.subheading_ru;
    }
    return section.subheading;
  };

  return (
    <section
      className={`section section--${section.type}`}
      data-section-id={section.id}
      data-section-type={section.type}
    >
      {/* Section heading (optional) */}
      {section.heading && (
        <div className="section__header">
          <h2 className="section__heading">{getHeading()}</h2>
          {section.subheading && (
            <span className="section__subheading">{getSubheading()}</span>
          )}
        </div>
      )}

      {/* For text sections: instruction above context card (with play button) */}
      {section.type === 'text' && getInstruction() && (
        <div className="section__instruction-row" {...(section.audio_url ? { 'data-audio-section-id': section.id, 'data-audio-url': section.audio_url } : {})}>
          <span className="section__instruction-checkbox" aria-hidden="true">■</span>
          <p className="section__instruction">{getInstruction()}</p>
          {section.audio_url && (
            <button
              className={`section__audio-btn ${playingSectionId === section.id ? 'section__audio-btn--playing' : ''}`}
              onClick={() => onSectionAudioClick(section.id, section.audio_url!)}
              disabled={loadingSectionId === section.id}
              aria-label={playingSectionId === section.id ? 'Stop audio' : 'Play all'}
            >
              {loadingSectionId === section.id ? (
                <span className="section__audio-loading" />
              ) : playingSectionId === section.id ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}

      {/* Context/narration (optional, for text sections) */}
      {section.context && (
        <div className="section__context">
          <p className="section__context-text">{section.context}</p>
          {getContextTranslation() && (
            <p className="section__context-translation">{getContextTranslation()}</p>
          )}
        </div>
      )}

      {/* Instruction for non-text sections (original position with play button) */}
      {section.type !== 'text' && getInstruction() && (
        <div className="section__instruction-row" {...(section.audio_url ? { 'data-audio-section-id': section.id, 'data-audio-url': section.audio_url } : {})}>
          <span className="section__instruction-checkbox" aria-hidden="true">■</span>
          <p className="section__instruction">{getInstruction()}</p>
          {/* Play all button for section audio */}
          {section.audio_url && (
            <button
              className={`section__audio-btn ${playingSectionId === section.id ? 'section__audio-btn--playing' : ''}`}
              onClick={() => onSectionAudioClick(section.id, section.audio_url!)}
              disabled={loadingSectionId === section.id}
              aria-label={playingSectionId === section.id ? 'Stop audio' : 'Play all'}
            >
              {loadingSectionId === section.id ? (
                <span className="section__audio-loading" />
              ) : playingSectionId === section.id ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}

      {/* Content: image + sentences */}
      {(section.image_url || section.tip || section.sentences.length > 0 || section.matchingItems || section.multipleChoiceData || section.fillBlankData || section.imageDescribeData || section.tableFillData || (section.type === 'bonus' && section.video_url) || section.grammarTableData || section.image_url_bottom || (section.images_bottom && section.images_bottom.length > 0)) && (
      <div className={`section__content ${section.image_url ? 'section__content--with-image' : ''}`}>
        {/* Top image (optional, original textbook scan) */}
        {section.image_url && (
          <div className="section__image">
            <img
              src={section.image_url}
              alt={section.heading || 'Section image'}
              className="section__image-img"
            />
          </div>
        )}

        {/* Tip box (optional, e.g., "小语助力") — rendered after image */}
        {section.tip && (
          <div className="section__tip">
            {section.tip.label && (
              <span className="section__tip-label">{section.tip.label}</span>
            )}
            <p className="section__tip-text">{section.tip.text}</p>
            {section.tip.pinyin && isPinyinVisible && (
              <p className="section__tip-pinyin">{section.tip.pinyin}</p>
            )}
            {getTipTranslation() && (
              <p className="section__tip-translation">{getTipTranslation()}</p>
            )}
          </div>
        )}

        {/* Sentences, Matching Exercise, or Fill-Blank Exercise */}
        {(section.sentences.length > 0 || section.matchingItems || section.multipleChoiceData || section.fillBlankData || section.imageDescribeData || section.tableFillData || (section.type === 'bonus' && section.video_url)) && (
        <div className="section__sentences">
          {section.type === 'matching' && section.matchingItems ? (
            <MatchingExercise
              items={section.matchingItems.map((item) => ({
                id: item.id,
                image_url: item.image_url,
                word: item.word,
                pinyin: item.pinyin,
                translation: item.translation,
                translation_ru: item.translation_ru,
              }))}
              instruction={section.instruction}
              instruction_ru={section.instruction_ru}
              language={language}
            />
          ) : section.type === 'multiplechoice' && section.multipleChoiceData ? (
            <MultipleChoiceExercise
              questions={section.multipleChoiceData.questions.map((q) => ({
                id: q.id,
                number: q.number,
                parts: q.parts.map((p) => ({ type: p.type, content: p.content })),
                options: q.options.map((o) => ({ label: o.label, word: o.word, pinyin: o.pinyin })),
                correctOptionLabel: q.correctOptionLabel,
              }))}
              language={language}
            />
          ) : section.type === 'fillblank' && section.fillBlankData ? (
            <FillBlankExercise
              options={section.fillBlankData.options.map((opt) => ({
                id: opt.id,
                label: opt.label,
                word: opt.word,
                pinyin: opt.pinyin,
              }))}
              sentences={section.fillBlankData.sentences.map((sent) => ({
                id: sent.id,
                number: sent.number,
                parts: sent.parts.map((part) => ({
                  type: part.type,
                  content: part.content,
                })),
                correctOptionId: sent.correctOptionId,
                correctOptionIds: sent.correctOptionIds,
                speaker: sent.speaker,
              }))}
              language={language}
            />
          ) : section.type === 'imagedescribe' && section.imageDescribeData ? (
            <ImageDescribeExercise
              cards={section.imageDescribeData.cards.map((card) => ({
                id: card.id,
                image_url: card.image_url,
                parts: card.parts.map((p) => ({ type: p.type, content: p.content })),
                answers: [...card.answers],
                speaker: card.speaker,
                dialogueNumber: card.dialogueNumber,
                pinyin: card.pinyin,
                translation: card.translation,
              }))}
              language={language}
            />
          ) : section.type === 'activity' && section.tableFillData ? (
            <TableFillExercise
              options={section.tableFillData.options.map((opt) => ({
                id: opt.id,
                label: opt.label,
                word: opt.word,
                pinyin: opt.pinyin,
              }))}
              columns={section.tableFillData.columns.map((col) => ({
                id: col.id,
                label: col.label,
                pinyin: col.pinyin,
              }))}
              language={language}
            />
          ) : section.type === 'bonus' && section.video_url ? (
            <div className="bonus__video-wrapper">
              <video
                className="bonus__video"
                controls
                preload="metadata"
                playsInline
              >
                <source src={section.video_url} type="video/mp4" />
              </video>
            </div>
          ) : (
            section.sentences.map((sentence) => (
              <Sentence
                key={sentence.id}
                sentence={sentence}
                isTranslationVisible={isTranslationVisible}
                isPinyinVisible={isPinyinVisible}
                language={language}
                isAudioPlaying={playingSentenceId === sentence.id}
                isAudioLoading={loadingAudioSentenceId === sentence.id}
                onAudioClick={onAudioClick}
                onSentenceClick={onSentenceClick}
                isActive={activeSentenceId === sentence.id}
              />
            ))
          )}
        </div>
        )}

        {/* Grammar table (optional, for grammar sections with tabular data) */}
        {section.grammarTableData && (
          <div className="grammar-table">
            {section.grammarTableData.headers.some(h => h.trim() !== '') && (
            <div className="grammar-table__row grammar-table__row--header" style={{ gridTemplateColumns: `repeat(${section.grammarTableData.headers.length}, 1fr)` }}>
              {section.grammarTableData.headers.map((header, i) => (
                <div key={i} className="grammar-table__cell grammar-table__cell--header">
                  <span className="grammar-table__cell-label">{header}</span>
                  {(() => {
                    const sub = language === 'ru' && section.grammarTableData!.subHeaders_ru?.[i]
                      ? section.grammarTableData!.subHeaders_ru[i]
                      : section.grammarTableData!.subHeaders?.[i];
                    return sub ? <span className="grammar-table__cell-sub">{sub}</span> : null;
                  })()}
                </div>
              ))}
            </div>
            )}
            {section.grammarTableData.rows.map((row, rowIdx) => (
              <div key={rowIdx} className="grammar-table__row" style={{ gridTemplateColumns: `repeat(${section.grammarTableData!.headers.length}, 1fr)` }}>
                {row.cells.map((cell, cellIdx) => (
                  <div key={cellIdx} className="grammar-table__cell">
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Bottom image (optional, appears after sentences) */}
        {section.image_url_bottom && (
          <div className="section__image">
            <img
              src={section.image_url_bottom}
              alt={`${section.heading || 'Section image'} continued`}
              className="section__image-img"
            />
          </div>
        )}

        {/* Multiple bottom images (optional, 2x2 grid) */}
        {section.images_bottom && section.images_bottom.length > 0 && (
          <div className="section__images-grid">
            {section.images_bottom.map((url, idx) => (
              <div key={idx} className="section__images-grid-item">
                <img
                  src={url}
                  alt={`${section.heading || 'Section'} example ${idx + 1}`}
                  className="section__images-grid-img"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </section>
  );
});

export default Section;
