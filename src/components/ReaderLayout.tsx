'use client';

/**
 * ReaderLayout - Client Component for Reader Page
 *
 * Handles the entire reader layout including:
 * - Fixed header with ReadVo logo and controls
 * - Page content
 * - Fixed bottom navigation
 *
 * This is a client component because:
 * - Controls need state management (pinyin, translation, font size)
 * - Page content is interactive (word popups, audio)
 */

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import type { Page as PageType } from '@/types';
import { Page } from './Page';
import { ReaderControls } from './ReaderControls';
import { useLanguage } from '../hooks/useLanguage';

interface NavLink {
  lessonId: string;
  pageNum: number;
}

export interface ReaderLayoutProps {
  page: PageType;
  lessonId: string;
  pageNum: string;
  prevNav: NavLink | null;
  nextNav: NavLink | null;
  bookPath?: string;
}

export function ReaderLayout({
  page,
  lessonId,
  pageNum,
  prevNav,
  nextNav,
  bookPath = '',
}: ReaderLayoutProps) {
  // Pinyin visibility: global toggle for all sentences
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);

  // Translation visibility: global toggle for all sentences
  const [isTranslationVisible, setIsTranslationVisible] = useState(true);

  // Font size: percentage scale (100 = default, range 80-150)
  const [fontSize, setFontSize] = useState(100);

  // Language selection (persisted via localStorage)
  const [language, toggleLanguage] = useLanguage();

  // Handlers
  const handlePinyinToggle = useCallback(() => {
    setIsPinyinVisible((prev) => !prev);
  }, []);

  const handleTranslationToggle = useCallback(() => {
    setIsTranslationVisible((prev) => !prev);
  }, []);

  const handleFontIncrease = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 10, 150));
  }, []);

  const handleFontDecrease = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 10, 80));
  }, []);

  const handleLanguageToggle = toggleLanguage;

  return (
    <div className="reader">
      {/* Fixed header with logo and controls */}
      <header className="reader__header">
        <div className="reader__header-inner">
          <Link href={bookPath || '/'} className="reader__home">
            ReadVo
          </Link>
          <ReaderControls
            isPinyinVisible={isPinyinVisible}
            onPinyinToggle={handlePinyinToggle}
            isTranslationVisible={isTranslationVisible}
            onTranslationToggle={handleTranslationToggle}
            fontSize={fontSize}
            onFontIncrease={handleFontIncrease}
            onFontDecrease={handleFontDecrease}
            language={language}
            onLanguageToggle={handleLanguageToggle}
            pageNumber={page.pageNumber}
          />
        </div>
      </header>

      {/* Page content */}
      <Page
        page={page}
        isPinyinVisible={isPinyinVisible}
        isTranslationVisible={isTranslationVisible}
        fontSize={fontSize}
        language={language}
      />

      {/* Fixed bottom navigation */}
      <nav className="reader__bottom-nav">
        <div className="reader__bottom-nav-inner">
          {prevNav ? (
            <Link
              href={`${bookPath}/lesson/${prevNav.lessonId}/page/${prevNav.pageNum}`}
              className="reader__nav-btn"
            >
              ← {language === 'ru' ? 'Назад' : 'Oldingi'}
            </Link>
          ) : (
            <span className="reader__nav-btn reader__nav-btn--disabled">
              ← {language === 'ru' ? 'Назад' : 'Oldingi'}
            </span>
          )}

          <span className="reader__location">
            {language === 'ru'
              ? `урок ${lessonId} / стр. ${pageNum}`
              : `${lessonId}-dars / ${pageNum}-sahifa`
            }
          </span>

          {nextNav ? (
            <Link
              href={`${bookPath}/lesson/${nextNav.lessonId}/page/${nextNav.pageNum}`}
              className="reader__nav-btn"
            >
              {language === 'ru' ? 'Далее' : 'Keyingi'} →
            </Link>
          ) : (
            <span className="reader__nav-btn reader__nav-btn--disabled">
              {language === 'ru' ? 'Далее' : 'Keyingi'} →
            </span>
          )}
        </div>
      </nav>
    </div>
  );
}
