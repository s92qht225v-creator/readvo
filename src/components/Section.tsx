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

import React, { useState, useEffect } from 'react';
import type { Section as SectionType } from '../types';
import type { Language } from '../types/ui-state';
import { Sentence } from './Sentence';
import { MatchingExercise } from './MatchingExercise';
import { FillBlankExercise } from './FillBlankExercise';
import { MultipleChoiceExercise } from './MultipleChoiceExercise';
import { ImageDescribeExercise } from './ImageDescribeExercise';
import { TableFillExercise } from './TableFillExercise';
import { TypedFillBlankExercise } from './TypedFillBlankExercise';
import { ErrorCorrectionExercise } from './ErrorCorrectionExercise';
import { WordChoiceExercise } from './WordChoiceExercise';
import { TextErrorExercise } from './TextErrorExercise';

/** Parse **bold** and _italic_ markdown in text, returning React nodes (supports bold inside italic) */
function parseBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|_[^_\n]+_)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <em key={i}>{parseBold(part.slice(1, -1))}</em>;
    }
    return part;
  });
}

/** Renders tip translation with support for multi-bullet grid lines */
function renderTipTranslation(text: string): React.ReactNode {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let gridLines: string[][] = [];

  const flushGrid = () => {
    if (gridLines.length === 0) return;
    const maxCols = Math.max(...gridLines.map(l => l.length));
    result.push(
      <div key={`grid-${result.length}`} className="section__tip-grid" style={{ gridTemplateColumns: `repeat(${maxCols}, auto)` }}>
        {gridLines.map((items, ri) =>
          items.map((item, ci) => <span key={`${ri}-${ci}`}>{parseInlineMarkdown(item)}</span>)
        )}
      </div>
    );
    gridLines = [];
  };

  lines.forEach((line, i) => {
    // Count bullet items on this line
    const bulletItems = line.split('•').filter(s => s.trim()).map(s => '• ' + s.trim());
    if (bulletItems.length >= 2) {
      gridLines.push(bulletItems);
    } else {
      flushGrid();
      if (i > 0) result.push(<br key={`br-${i}`} />);
      result.push(<React.Fragment key={`line-${i}`}>{parseInlineMarkdown(line)}</React.Fragment>);
    }
  });
  flushGrid();

  return result;
}

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

function VocabPhrase({ text, translation }: { text: string; translation: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);
  return (
    <span
      className={`grammar-table__phrase${open ? ' grammar-table__phrase--open' : ''}`}
      onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
    >
      {parseInlineMarkdown(text)}
      {open && <span className="grammar-table__cell-tooltip">{translation}</span>}
    </span>
  );
}

function VocabCell({ children, translation, multiline, translationLines }: { children: React.ReactNode; translation: string; multiline?: boolean; translationLines?: string[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);
  return (
    <div
      className={`grammar-table__cell grammar-table__cell--vocab${open ? ' grammar-table__cell--vocab-open' : ''}`}
      onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
    >
      {children}
      {open && <span className="grammar-table__cell-tooltip">{translation}</span>}
    </div>
  );
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
    if (language === 'en' && section.contextTranslation_en) {
      return section.contextTranslation_en;
    }
    return section.contextTranslation;
  };

  const getInstruction = () => {
    if (language === 'ru' && section.instruction_ru) {
      return section.instruction_ru;
    }
    if (language === 'en' && section.instruction_en) {
      return section.instruction_en;
    }
    return section.instruction;
  };

  const getTipTranslation = () => {
    if (language === 'ru' && section.tip?.translation_ru) {
      return section.tip.translation_ru;
    }
    if (language === 'en' && section.tip?.translation_en) {
      return section.tip.translation_en;
    }
    return section.tip?.translation;
  };

  const getHeading = () => {
    if (language === 'ru' && section.heading_ru) {
      return section.heading_ru;
    }
    if (language === 'en' && section.heading_en) {
      return section.heading_en;
    }
    return section.heading;
  };

  const getSubheading = () => {
    if (language === 'ru' && section.subheading_ru) {
      return section.subheading_ru;
    }
    if (language === 'en' && section.subheading_en) {
      return section.subheading_en;
    }
    if (language === 'uz' && section.subheading_uz) {
      return section.subheading_uz;
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
      {(section.heading || (section.subheading && !section.exerciseLetter)) && (
        <div className={`section__header${!section.heading && section.subheading ? ' section__header--subheading-only' : ''}`}>
          {section.heading && <h2 className="section__heading">{getHeading()}</h2>}
          {section.heading_sub && (
            <span className="section__heading-sub">
              {language === 'ru' && section.heading_sub_ru ? section.heading_sub_ru : language === 'en' && section.heading_sub_en ? section.heading_sub_en : section.heading_sub}
            </span>
          )}
          {section.subheading && (
            <span className="section__subheading">{getSubheading()}</span>
          )}
        </div>
      )}

      {/* For text sections: instruction above context card (with play button) */}
      {section.type === 'text' && getInstruction() && (
        <div className={`section__instruction-row${!section.exerciseLetter ? ' section__instruction-row--bullet' : ''}`} {...(section.audio_url ? { 'data-audio-section-id': section.id, 'data-audio-url': section.audio_url } : {})}>
          {section.exerciseLetter && <span className="section__instruction-checkbox" aria-hidden="true">{section.exerciseLetter}</span>}
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
          {getContextTranslation() && (
            <p className="section__context-translation">{getContextTranslation()}</p>
          )}
        </div>
      )}

      {/* Instruction for non-text sections (original position with play button) */}
      {section.type !== 'text' && getInstruction() && (
        <div className={`section__instruction-row${!section.exerciseLetter ? ' section__instruction-row--bullet' : ''}`} {...(section.audio_url ? { 'data-audio-section-id': section.id, 'data-audio-url': section.audio_url } : {})}>
          {section.exerciseLetter && <span className="section__instruction-checkbox" aria-hidden="true">{section.exerciseLetter}</span>}
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

      {/* Subheading after instruction (e.g. "Across" / "Down" for crosswords, where exerciseLetter is also set) */}
      {section.subheading && section.exerciseLetter && (
        <div className="section__header section__header--subheading-only">
          <span className="section__subheading">{getSubheading()}</span>
        </div>
      )}

      {/* Content: image + sentences */}
      {(section.image_url || section.tip || section.sentences.length > 0 || section.matchingItems || section.multipleChoiceData || section.fillBlankData || section.imageDescribeData || section.tableFillData || section.typedFillBlankData || section.errorCorrectionData || section.wordChoiceData || section.textErrorData || (section.type === 'bonus' && section.video_url) || section.grammarTableData || section.image_url_bottom || (section.images_bottom && section.images_bottom.length > 0)) && (
      <div className={`section__content ${section.image_url ? 'section__content--with-image' : ''}`}>
        {/* Top image (optional, original textbook scan) */}
        {section.image_url !== undefined && (
          <div className="section__image">
            {section.image_url ? (
              <img
                src={section.image_url}
                alt={section.heading || 'Section image'}
                className="section__image-img"
              />
            ) : (
              <div className="section__image-placeholder" />
            )}
          </div>
        )}

        {/* Tip box (optional) — rendered after image but before sentences, unless grammar table exists (then after table) */}
        {section.tip && !section.grammarTableData && (
          <div className="section__tip">
            {section.tip.label && (
              <span className="section__tip-label">{language === 'ru' && section.tip.label_ru ? section.tip.label_ru : language === 'en' && section.tip.label_en ? section.tip.label_en : (section.tip.label_uz || section.tip.label)}</span>
            )}
            <p className="section__tip-text">{section.tip.text}</p>
            {section.tip.pinyin && isPinyinVisible && (
              <p className="section__tip-pinyin">{section.tip.pinyin}</p>
            )}
            {getTipTranslation() && (
              <div className="section__tip-translation">{renderTipTranslation(getTipTranslation()!)}</div>
            )}
            {section.tip.vocabList && (
              <div className="section__tip-vocab">
                {section.tip.vocabList.map((item, i) =>
                  item.header ? (
                    <div key={i} className="section__tip-vocab-header">{language === 'ru' ? (item.ru || item.en) : language === 'en' ? (item.en || item.uz) : (item.uz || item.en)}</div>
                  ) : (
                    <div key={i} className="section__tip-vocab-row">
                      <span className="section__tip-vocab-en">{item.en}</span>
                      <span className="section__tip-vocab-tr">{language === 'ru' ? item.ru : language === 'en' ? (item.en || item.uz) : item.uz}</span>
                    </div>
                  )
                )}
              </div>
            )}
            {(language === 'ru' ? section.tip.translationBottom_ru : language === 'en' ? (section.tip.translationBottom_en || section.tip.translationBottom) : section.tip.translationBottom) && (
              <div className="section__tip-translation">{renderTipTranslation((language === 'ru' ? section.tip.translationBottom_ru : language === 'en' ? (section.tip.translationBottom_en || section.tip.translationBottom) : section.tip.translationBottom)!)}</div>
            )}
          </div>
        )}

        {/* Sentences, Matching Exercise, or Fill-Blank Exercise */}
        {(section.sentences.length > 0 || section.matchingItems || section.multipleChoiceData || section.fillBlankData || section.imageDescribeData || section.tableFillData || section.typedFillBlankData || section.errorCorrectionData || section.wordChoiceData || section.textErrorData || (section.type === 'bonus' && section.video_url)) && (
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
          ) : section.type === 'typedfillblank' && section.typedFillBlankData ? (
            <TypedFillBlankExercise
              cards={section.typedFillBlankData.cards.map((card) => ({
                id: card.id,
                number: card.number,
                parts: card.parts.map((p) => ({ type: p.type, content: p.content })),
                answers: [...card.answers],
                alternateAnswers: card.alternateAnswers?.map((alts) => alts ? [...alts] : []),
                prefilled: card.prefilled,
                words: card.words?.map((w) => ({ w: w.w, t: w.t, tr: w.tr })),
              }))}
              images={section.typedFillBlankData.images?.map((img) => ({
                label: img.label,
                caption: img.caption,
                image_url: img.image_url,
              }))}
              wordBank={section.typedFillBlankData.wordBank ? [...section.typedFillBlankData.wordBank] : undefined}
              layout={section.typedFillBlankData.layout}
              language={language}
            />
          ) : section.type === 'errorcorrection' && section.errorCorrectionData ? (
            <ErrorCorrectionExercise
              cards={section.errorCorrectionData.cards.map((card) => ({
                id: card.id,
                sentence: card.sentence,
                errorStart: card.errorStart,
                errorEnd: card.errorEnd,
                correctAnswer: card.correctAnswer,
                alternateAnswers: card.alternateAnswers ? [...card.alternateAnswers] : undefined,
                words: card.words?.map((w) => ({ w: w.w, t: w.t, tr: w.tr })),
              }))}
              language={language}
            />
          ) : section.type === 'wordchoice' && section.wordChoiceData ? (
            <WordChoiceExercise
              cards={section.wordChoiceData.cards.map((card) => ({
                id: card.id,
                parts: card.parts.map((p) => ({ type: p.type, content: p.content, options: p.options ? [...p.options] : undefined, correct: p.correct })),
                words: card.words?.map((w) => ({ w: w.w, t: w.t, tr: w.tr })),
              }))}
              language={language}
              layout={section.wordChoiceData.layout as 'ab-choice' | undefined}
            />
          ) : section.type === 'texterror' && section.textErrorData ? (
            <TextErrorExercise
              passage={section.textErrorData.passage}
              errors={section.textErrorData.errors.map((err) => ({
                id: err.id,
                errorStart: err.errorStart,
                errorEnd: err.errorEnd,
                correctAnswer: err.correctAnswer,
                alternateAnswers: err.alternateAnswers ? [...err.alternateAnswers] : undefined,
              }))}
              words={section.textErrorData.words?.map((w) => ({ w: w.w, t: w.t, tr: w.tr }))}
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
            {(() => {
              const hasSubHeaders = section.grammarTableData!.subHeaders || section.grammarTableData!.subHeaders_ru || section.grammarTableData!.subHeaders_en;
              const hasHeaders = section.grammarTableData!.headers.some(h => h.trim() !== '');
              if (!hasHeaders && !hasSubHeaders) return null;
              const displayHeaders = hasSubHeaders
                ? (language === 'ru' && section.grammarTableData!.subHeaders_ru
                  ? section.grammarTableData!.subHeaders_ru
                  : language === 'en' && section.grammarTableData!.subHeaders_en
                  ? section.grammarTableData!.subHeaders_en
                  : section.grammarTableData!.subHeaders || section.grammarTableData!.headers)
                : section.grammarTableData!.headers;
              return (
              <div className="grammar-table__row grammar-table__row--header" style={{ gridTemplateColumns: `repeat(${section.grammarTableData!.headers.length}, 1fr)` }}>
                {displayHeaders.map((header, i) => (
                  <div key={i} className="grammar-table__cell grammar-table__cell--header">
                    <span className="grammar-table__cell-label">{header}</span>
                  </div>
                ))}
              </div>
              );
            })()}
            {section.grammarTableData.rows.map((row, rowIdx) => {
              const translatedCells = (language === 'ru' && row.cells_ru) ? row.cells_ru : (language === 'en' && row.cells_en) ? row.cells_en : (row.cells_uz || row.cells);
              return (
              <div key={rowIdx} className="grammar-table__row" style={{ gridTemplateColumns: `repeat(${section.grammarTableData!.headers.length}, 1fr)` }}>
                {row.cells.map((cell, cellIdx) => {
                  const translatedCell = translatedCells[cellIdx] || cell;
                  const addSlashBreaks = (s: string) => s.replace(/\//g, '/\u200B');

                  // Multiline cell: render each line as its own clickable phrase
                  const englishLines = cell.split('\n');
                  const translatedLines = translatedCell.split('\n');
                  if (englishLines.length > 1) {
                    // Check if entire cell is wrapped in italic markers (e.g. multiline example sentence)
                    const cellIsItalic = cell.startsWith('_') && cell.endsWith('_');
                    // Strip outer italic markers from each line for rendering
                    const stripItalic = (s: string) => s.replace(/^_/, '').replace(/_$/, '');
                    return (
                      <div key={cellIdx} className={`grammar-table__cell grammar-table__cell--phrases${cellIsItalic ? ' grammar-table__cell--italic' : ''}`}>
                        {englishLines.map((line, li) => {
                          const tLine = translatedLines[li] || line;
                          const dashIdx = tLine.indexOf(' – ');
                          const tr = dashIdx !== -1 ? tLine.slice(dashIdx + 3) : tLine !== line ? tLine : undefined;
                          const displayLine = stripItalic(line);
                          if (tr && !cellIsItalic) return <VocabPhrase key={li} text={displayLine} translation={tr} />;
                          return <span key={li} className={tr && !cellIsItalic ? '' : 'grammar-table__phrase-plain'}>{parseInlineMarkdown(displayLine)}</span>;
                        })}
                      </div>
                    );
                  }

                  const isItalic = cell.startsWith('_') && cell.endsWith('_') && cell.length > 2;
                  // Italic label: first column italic (e.g. _adjectives_) — should show translated
                  // Italic example: non-first column italic (e.g. _I saw the film_) — always English
                  const isItalicLabel = isItalic && cellIdx === 0;
                  const isItalicExample = isItalic && cellIdx !== 0;
                  // Vocab tooltip pattern: translated cell has ' – ' suffix (e.g. "**act** – harakat qilmoq")
                  const dashIdx = translatedCell.indexOf(' – ');
                  const hasVocabTooltip = !isItalic && dashIdx !== -1;
                  // "Use" description pattern: 2-column row where the OTHER cell is italic (example sentence)
                  const isUseDescription = !isItalic && !hasVocabTooltip
                    && row.cells.length === 2
                    && row.cells.some(c => c.startsWith('_') && c.endsWith('_'));
                  const displayCell = (isItalicLabel || isUseDescription) ? translatedCell : cell;
                  const inner = displayCell.replace(/^_|_$/g, '');
                  const parts = inner.split(/(\*\*[^*]+\*\*)/).map((part, pi) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={pi}>{addSlashBreaks(part.slice(2, -2))}</strong>
                      : addSlashBreaks(part)
                  );
                  const content = isItalic ? <em>{parts}</em> : parts;
                  // Show tooltip when translated cell differs from English (covers vocab tooltip + prepositional phrases)
                  const tooltipText = hasVocabTooltip ? translatedCell.slice(dashIdx + 3)
                    : (!isItalicLabel && !isUseDescription && !isItalicExample && translatedCell !== cell) ? translatedCell
                    : undefined;
                  if (tooltipText) {
                    return <VocabCell key={cellIdx} translation={tooltipText}>{content}</VocabCell>;
                  }
                  return <div key={cellIdx} className="grammar-table__cell">{content}</div>;
                })}
              </div>
              );
            })}
          </div>
        )}

        {/* Tip box — rendered after grammar table when both exist */}
        {section.tip && section.grammarTableData && (
          <div className="section__tip">
            {section.tip.label && (
              <span className="section__tip-label">{language === 'ru' && section.tip.label_ru ? section.tip.label_ru : language === 'en' && section.tip.label_en ? section.tip.label_en : (section.tip.label_uz || section.tip.label)}</span>
            )}
            <p className="section__tip-text">{section.tip.text}</p>
            {section.tip.pinyin && isPinyinVisible && (
              <p className="section__tip-pinyin">{section.tip.pinyin}</p>
            )}
            {getTipTranslation() && (
              <div className="section__tip-translation">{renderTipTranslation(getTipTranslation()!)}</div>
            )}
            {section.tip.vocabList && (
              <div className="section__tip-vocab">
                {section.tip.vocabList.map((item, i) =>
                  item.header ? (
                    <div key={i} className="section__tip-vocab-header">{language === 'ru' ? (item.ru || item.en) : language === 'en' ? (item.en || item.uz) : (item.uz || item.en)}</div>
                  ) : (
                    <div key={i} className="section__tip-vocab-row">
                      <span className="section__tip-vocab-en">{item.en}</span>
                      <span className="section__tip-vocab-tr">{language === 'ru' ? item.ru : language === 'en' ? (item.en || item.uz) : item.uz}</span>
                    </div>
                  )
                )}
              </div>
            )}
            {(language === 'ru' ? section.tip.translationBottom_ru : language === 'en' ? (section.tip.translationBottom_en || section.tip.translationBottom) : section.tip.translationBottom) && (
              <div className="section__tip-translation">{renderTipTranslation((language === 'ru' ? section.tip.translationBottom_ru : language === 'en' ? (section.tip.translationBottom_en || section.tip.translationBottom) : section.tip.translationBottom)!)}</div>
            )}
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
