'use client';

/**
 * GuidedLesson - Step-by-Step Lesson Flow
 *
 * Replaces the scroll-based Page component with a guided flow
 * where each section is shown one at a time with Next/Back navigation.
 *
 * Design inspired by Headway-style textbooks:
 * - Large step numbers with instructions
 * - One step visible at a time
 * - Progress bar at top
 * - Clean navigation at bottom
 */

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { Page as PageType } from '../types';
import type { Language } from '../types/ui-state';
import { Section } from './Section';
import { LessonHeader } from './LessonHeader';
import { useAudioPlayer } from '../hooks';

interface NavLink {
  lessonId: string;
  pageNum: number;
}

export interface GuidedLessonProps {
  page: PageType;
  isPinyinVisible: boolean;
  isTranslationVisible: boolean;
  fontSize: number;
  language: Language;
  lessonId: string;
  pageNum: string;
  prevNav: NavLink | null;
  nextNav: NavLink | null;
  bookPath: string;
}

/** Default step instructions by section type */
const STEP_INSTRUCTIONS: Record<string, { uz: string; ru: string }> = {
  objectives: { uz: 'Dars maqsadlari', ru: 'Цели урока' },
  vocabulary: { uz: 'Yangi so\'zlarni o\'rganing', ru: 'Выучите новые слова' },
  grammar: { uz: 'Grammatikani o\'rganing', ru: 'Изучите грамматику' },
  text: { uz: 'Dialogni o\'qing va tinglang', ru: 'Прочитайте и послушайте' },
  fillblank: { uz: 'Mashqni bajaring', ru: 'Выполните упражнение' },
  multiplechoice: { uz: 'To\'g\'ri javobni tanlang', ru: 'Выберите правильный ответ' },
  tip: { uz: 'Foydali maslahat', ru: 'Полезный совет' },
  tonguetwister: { uz: 'Tez aytishni takrorlang', ru: 'Повторите скороговорку' },
};

export const GuidedLesson: React.FC<GuidedLessonProps> = React.memo(function GuidedLesson({
  page,
  isPinyinVisible,
  isTranslationVisible,
  fontSize,
  language,
  lessonId,
  pageNum,
  prevNav,
  nextNav,
  bookPath,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const audioPlayer = useAudioPlayer();

  const totalSteps = page.sections.length;
  const section = page.sections[currentStep];

  // Section type → CSS modifier
  const stepStyleMap: Record<string, string> = {
    text: 'dialogue', grammar: 'grammar', vocabulary: 'vocab',
    fillblank: 'exercise', multiplechoice: 'exercise',
    objectives: 'objectives', tip: 'tip',
  };
  const stepStyle = section ? (stepStyleMap[section.type] || '') : '';
  const stepImage = section?.image_url || null;

  // Get step instruction text
  const stepInstruction = useMemo(() => {
    if (!section) return '';
    const defaults = STEP_INSTRUCTIONS[section.type];
    if (section.instruction) {
      // Use the Uzbek/Russian part of the instruction (after Chinese)
      const parts = section.instruction.split('。');
      const localPart = parts.length > 1 ? parts.slice(1).join('。').trim() : section.instruction;
      if (language === 'ru' && section.instruction_ru) {
        const ruParts = section.instruction_ru.split('。');
        return ruParts.length > 1 ? ruParts.slice(1).join('。').trim() : section.instruction_ru;
      }
      return localPart || (defaults ? (language === 'ru' ? defaults.ru : defaults.uz) : '');
    }
    return defaults ? (language === 'ru' ? defaults.ru : defaults.uz) : '';
  }, [section, language]);

  // Audio handlers (same as Page.tsx)
  const handleAudioClick = useCallback(
    (sentenceId: string, audioUrl: string) => {
      if (audioPlayer.isPlaying(sentenceId)) {
        audioPlayer.stop();
      } else {
        audioPlayer.play(sentenceId, audioUrl);
      }
    },
    [audioPlayer]
  );

  const handleSectionAudioClick = useCallback(
    (sectionId: string, audioUrl: string) => {
      if (audioPlayer.isPlaying(sectionId)) {
        audioPlayer.stop();
      } else {
        audioPlayer.play(sectionId, audioUrl);
      }
    },
    [audioPlayer]
  );

  // Navigation
  const goNext = useCallback(() => {
    audioPlayer.stop();
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalSteps, audioPlayer]);

  const goBack = useCallback(() => {
    audioPlayer.stop();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [audioPlayer]);

  const goToStep = useCallback((step: number) => {
    audioPlayer.stop();
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [audioPlayer]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <article
      className="guided"
      data-page-id={page.id}
      style={{ '--font-scale': `${fontSize / 100}` } as React.CSSProperties}
    >
      {/* Progress bar */}
      <div className="guided__progress-bar">
        <div
          className="guided__progress-fill"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="guided__step-dots">
        {page.sections.map((_, i) => (
          <button
            key={i}
            className={`guided__dot${i === currentStep ? ' guided__dot--active' : ''}${i < currentStep ? ' guided__dot--done' : ''}`}
            onClick={() => goToStep(i)}
            aria-label={`${language === 'ru' ? 'Шаг' : 'Qadam'} ${i + 1}`}
          />
        ))}
      </div>

      {/* Lesson header (only on first step of page 1) */}
      {currentStep === 0 && page.lessonHeader && (
        <LessonHeader header={page.lessonHeader} language={language} />
      )}

      {/* Step layout: content (+ optional image on right) */}
      <div className={`guided__step-layout${stepImage ? ' guided__step-layout--with-image' : ''}`}>
        <div className="guided__step-main">
          {/* Step header: number + instruction */}
          <div className="guided__step-header">
            <span className="guided__step-number">{currentStep + 1}</span>
            <span className="guided__step-instruction">{stepInstruction}</span>
          </div>

          {/* Step content card */}
          <div className={`guided__step-content${stepStyle ? ` guided__step-content--${stepStyle}` : ''}`}>
            {section && (
              <Section
                key={section.id}
                section={section}
                isPinyinVisible={isPinyinVisible}
                isTranslationVisible={section.type === 'objectives' ? true : isTranslationVisible}
                language={language}
                playingSentenceId={audioPlayer.state.playingSentenceId}
                loadingAudioSentenceId={audioPlayer.state.loadingSentenceId}
                onAudioClick={handleAudioClick}
                playingSectionId={audioPlayer.state.playingSentenceId}
                loadingSectionId={audioPlayer.state.loadingSentenceId}
                onSectionAudioClick={handleSectionAudioClick}
              />
            )}
          </div>
        </div>

        {/* Right column: image */}
        {stepImage && (
          <div className="guided__step-image">
            <img src={stepImage} alt="" />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="guided__nav">
        {!isFirstStep ? (
          <button className="guided__nav-btn guided__nav-btn--secondary" onClick={goBack}>
            ← {language === 'ru' ? 'Назад' : 'Orqaga'}
          </button>
        ) : prevNav ? (
          <Link
            href={`${bookPath}/lesson/${prevNav.lessonId}/page/${prevNav.pageNum}`}
            className="guided__nav-btn guided__nav-btn--secondary"
          >
            ← {language === 'ru' ? 'Пред. стр.' : 'Oldingi sahifa'}
          </Link>
        ) : (
          <span />
        )}

        <span className="guided__step-counter">
          {currentStep + 1} / {totalSteps}
        </span>

        {!isLastStep ? (
          <button className="guided__nav-btn guided__nav-btn--primary" onClick={goNext}>
            {language === 'ru' ? 'Далее' : 'Keyingi'} →
          </button>
        ) : nextNav ? (
          <Link
            href={`${bookPath}/lesson/${nextNav.lessonId}/page/${nextNav.pageNum}`}
            className="guided__nav-btn guided__nav-btn--primary"
          >
            {language === 'ru' ? 'След. стр.' : 'Keyingi sahifa'} →
          </Link>
        ) : (
          <Link
            href={bookPath}
            className="guided__nav-btn guided__nav-btn--primary"
          >
            {language === 'ru' ? 'Завершить' : 'Tugatish'} ✓
          </Link>
        )}
      </div>

      {/* Audio error */}
      {audioPlayer.state.error && (
        <div className="page__audio-error" role="alert">
          {audioPlayer.state.error}
        </div>
      )}
    </article>
  );
});

export default GuidedLesson;
