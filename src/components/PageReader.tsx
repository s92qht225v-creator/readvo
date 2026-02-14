'use client';

/**
 * PageReader - Client Component Wrapper
 *
 * Wraps the Page component for use in Next.js App Router.
 * This is a client component because Page has interactive state:
 * - Word popup
 * - Translation toggle
 * - Audio playback
 *
 * Also manages the controls state that is shared between:
 * - ReaderControls (in header)
 * - Page component (content rendering)
 */

import React, { useState, useCallback } from 'react';
import type { Page as PageType } from '@/types';
import { Page } from './Page';
import { ReaderControls } from './ReaderControls';
import { useLanguage } from '../hooks/useLanguage';

export interface PageReaderProps {
  page: PageType;
}

export function PageReader({ page }: PageReaderProps) {
  // Pinyin visibility: global toggle for all sentences
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);

  // Translation visibility: global toggle for all sentences
  const [isTranslationVisible, setIsTranslationVisible] = useState(false);

  // Font size: percentage scale (100 = default, range 80-150)
  const [fontSize, setFontSize] = useState(100);

  // Language: persisted to localStorage via useLanguage hook
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
    <>
      {/* Controls rendered via portal to header */}
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

      {/* Page content */}
      <Page
        page={page}
        isPinyinVisible={isPinyinVisible}
        isTranslationVisible={isTranslationVisible}
        fontSize={fontSize}
        language={language}
      />
    </>
  );
}
