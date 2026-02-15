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

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Page as PageType } from '@/types';
import { Page } from './Page';
import { GuidedLesson } from './GuidedLesson';
import { ReaderControls } from './ReaderControls';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

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
  guided?: boolean;
}

export function ReaderLayout({
  page,
  lessonId,
  pageNum,
  prevNav,
  nextNav,
  bookPath = '',
  guided = false,
}: ReaderLayoutProps) {
  // Pinyin visibility: global toggle for all sentences
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);

  // Translation visibility: global toggle for all sentences
  const [isTranslationVisible, setIsTranslationVisible] = useState(false);

  // Font size: percentage scale (100 = default, range 80-150), persisted
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readvo-font-size');
      return saved ? Number(saved) : 100;
    }
    return 100;
  });
  useEffect(() => {
    localStorage.setItem('readvo-font-size', String(fontSize));
  }, [fontSize]);

  // Language selection (persisted via localStorage)
  const [language, toggleLanguage] = useLanguage();

  // Auth - save progress when page is visited
  const { user, getAccessToken } = useAuth();
  useEffect(() => {
    if (!user) return;
    getAccessToken().then((token) => {
      if (!token) return;
      fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ lesson_id: lessonId, page_num: pageNum }),
      }).catch(() => {});
    });
  }, [user, lessonId, pageNum, getAccessToken]);

  // Active sentence for translation panel
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);

  // Look up active sentence data from page sections
  const activeSentence = useMemo(() => {
    if (!activeSentenceId) return null;
    for (const section of page.sections) {
      for (const sentence of section.sentences) {
        if (sentence.id === activeSentenceId) return sentence;
      }
    }
    return null;
  }, [activeSentenceId, page.sections]);

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

  const handleSentenceClick = useCallback((sentenceId: string) => {
    setActiveSentenceId((prev) => prev === sentenceId ? null : sentenceId);
  }, []);

  return (
    <div className={`reader${isTranslationVisible ? ' reader--with-panel' : ''}`}>
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

      {/* Translation panel (shown when translation toggle is on) */}
      {isTranslationVisible && (
        <div className="page__translation-panel">
          <p className="page__translation-panel-text">
            {activeSentence
              ? (language === 'ru' && activeSentence.text_translation_ru
                  ? activeSentence.text_translation_ru
                  : activeSentence.text_translation)
              : (language === 'ru'
                  ? 'Нажмите на предложение для перевода'
                  : 'Tarjima uchun gapni bosing')}
          </p>
        </div>
      )}

      {guided ? (
        /* Guided step-by-step flow */
        <GuidedLesson
          page={page}
          isPinyinVisible={isPinyinVisible}
          isTranslationVisible={isTranslationVisible}
          fontSize={fontSize}
          language={language}
          lessonId={lessonId}
          pageNum={pageNum}
          prevNav={prevNav}
          nextNav={nextNav}
          bookPath={bookPath}
        />
      ) : (
        <>
          {/* Scroll-based page content */}
          <Page
            page={page}
            isPinyinVisible={isPinyinVisible}
            isTranslationVisible={isTranslationVisible}
            fontSize={fontSize}
            language={language}
            activeSentenceId={activeSentenceId}
            onSentenceClick={handleSentenceClick}
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

              <div className="reader__nav-toggles">
                <button
                  className={`reader__nav-toggle ${isPinyinVisible ? 'reader__nav-toggle--active' : ''}`}
                  onClick={handlePinyinToggle}
                  type="button"
                >
                  Pinyin
                </button>
                <button
                  className={`reader__nav-toggle ${isTranslationVisible ? 'reader__nav-toggle--active' : ''}`}
                  onClick={handleTranslationToggle}
                  type="button"
                >
                  {language === 'ru' ? 'Перевод' : 'Tarjima'}
                </button>
              </div>

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
        </>
      )}
    </div>
  );
}
