'use client';

/**
 * LessonHeader Component
 *
 * Renders the lesson banner with:
 * - Large lesson number on the left
 * - Pinyin, Chinese title, and translation on red banner
 *
 * Responsive:
 * - Desktop: horizontal layout matching textbook design
 * - Mobile: stacked layout with smaller elements
 */

import React from 'react';
import type { LessonHeader as LessonHeaderType } from '../types';
import type { Language } from '../types/ui-state';

export interface LessonHeaderProps {
  header: LessonHeaderType;
  language: Language;
}

export const LessonHeader: React.FC<LessonHeaderProps> = React.memo(
  function LessonHeader({ header, language }) {
    // Get translation based on selected language
    const translation = language === 'ru' && header.titleTranslation_ru
      ? header.titleTranslation_ru
      : header.titleTranslation;

    // Get label based on language
    const lessonLabel = language === 'ru' ? 'урок' : 'dars';
    return (
      <header className="lesson-header">
        {/* Lesson badge with number */}
        <div className="lesson-header__badge">
          <span className="lesson-header__number">{header.lessonNumber}</span>
          <span className="lesson-header__label">{lessonLabel}</span>
        </div>

        {/* Title banner */}
        <div className="lesson-header__banner">
          <div className="lesson-header__content">
            {/* Pinyin */}
            <p className="lesson-header__pinyin">{header.pinyin}</p>

            {/* Chinese title */}
            <h1 className="lesson-header__title">{header.title}</h1>

            {/* Translation */}
            <p className="lesson-header__translation">{translation}</p>
          </div>
        </div>
      </header>
    );
  }
);

export default LessonHeader;
