'use client';

/**
 * ReaderLayout - Client Component for Reader Page
 *
 * Handles the entire reader layout including:
 * - Fixed header with Blim logo and controls
 * - Page content
 * - Fixed bottom navigation
 *
 * This is a client component because:
 * - Controls need state management (pinyin, translation, font size)
 * - Page content is interactive (word popups, audio)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { Page as PageType } from '@/types';
import { Page } from './Page';
import { GuidedLesson } from './GuidedLesson';
import { ReaderControls } from './ReaderControls';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTrial } from '../hooks/useTrial';
import { Paywall } from './Paywall';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { trackAll } from '@/utils/analytics';

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
  hidePinyin?: boolean;
  /** URL segment for navigation: 'lesson' (default) or 'unit' */
  navSegment?: string;
}

export function ReaderLayout({
  page,
  lessonId,
  pageNum,
  prevNav,
  nextNav,
  bookPath = '',
  guided = false,
  hidePinyin = false,
  navSegment = 'lesson',
}: ReaderLayoutProps) {
  const { isLoading: authLoading } = useRequireAuth();

  // Pinyin visibility: global toggle for all sentences
  const [isPinyinVisible, setIsPinyinVisible] = useState(!hidePinyin);

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
  const trial = useTrial();
  const isFreeContent = lessonId === '1';
  const showPaywall = trial?.isTrialExpired && !isFreeContent;
  useEffect(() => {
    if (!user || showPaywall) return;
    getAccessToken().then((token) => {
      if (!token) return;
      fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ lesson_id: lessonId, page_num: Number(pageNum) }),
      }).catch(() => {});
    });
  }, [user, lessonId, pageNum, getAccessToken, showPaywall]);

  // Analytics: track content view
  useEffect(() => {
    trackAll('ViewContent', 'lesson_view', 'lesson_view', {
      content_name: `Lesson ${lessonId} Page ${pageNum}`,
      content_category: 'Lesson',
      content_type: 'product',
    });
  }, [lessonId, pageNum]);

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

  // Auth guard — redirect to landing if not logged in
  if (authLoading) return <div className="loading-spinner" />;

  return (
    <>
      {showPaywall && <Paywall />}
      <div className={`reader${isTranslationVisible ? ' reader--with-panel' : ''}${showPaywall ? ' paywall-blur' : ''}`}>
      {/* Fixed header with logo and controls */}
      <header className="reader__header">
        <div className="reader__header-inner">
          <Link href={bookPath || '/'} className="reader__home">
            <Image src="/logo-red.svg" alt="Blim" width={64} height={22} className="reader__home-logo" priority />
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
          <BannerMenu />
        </div>
      </header>

      {/* Translation panel (shown when translation toggle is on) */}
      {isTranslationVisible && (
        <div className="page__translation-panel">
          <p className="page__translation-panel-text">
            {activeSentence
              ? (language === 'ru' && activeSentence.text_translation_ru
                  ? activeSentence.text_translation_ru
                  : language === 'en' && activeSentence.text_translation_en
                  ? activeSentence.text_translation_en
                  : activeSentence.text_translation)
              : ({ uz: 'Tarjima uchun gapni bosing', ru: 'Нажмите на предложение для перевода', en: 'Tap a sentence to translate' } as Record<string, string>)[language]}
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
                  href={`${bookPath}/${navSegment}/${prevNav.lessonId}/page/${prevNav.pageNum}`}
                  className="reader__nav-btn"
                >
                  ← {({ uz: 'Oldingi', ru: 'Назад', en: 'Prev' } as Record<string, string>)[language]}
                </Link>
              ) : (
                <span className="reader__nav-btn reader__nav-btn--disabled">
                  ← {({ uz: 'Oldingi', ru: 'Назад', en: 'Prev' } as Record<string, string>)[language]}
                </span>
              )}

              <div className="reader__nav-toggles">
                {!hidePinyin && (
                  <button
                    className={`reader__nav-toggle ${isPinyinVisible ? 'reader__nav-toggle--active' : ''}`}
                    onClick={handlePinyinToggle}
                    type="button"
                  >
                    Pinyin
                  </button>
                )}
                <button
                  className={`reader__nav-toggle ${isTranslationVisible ? 'reader__nav-toggle--active' : ''}`}
                  onClick={handleTranslationToggle}
                  type="button"
                >
                  {({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language]}
                </button>
              </div>

              {nextNav ? (
                <Link
                  href={`${bookPath}/${navSegment}/${nextNav.lessonId}/page/${nextNav.pageNum}`}
                  className="reader__nav-btn"
                >
                  {({ uz: 'Keyingi', ru: 'Далее', en: 'Next' } as Record<string, string>)[language]} →
                </Link>
              ) : (
                <span className="reader__nav-btn reader__nav-btn--disabled">
                  {({ uz: 'Keyingi', ru: 'Далее', en: 'Next' } as Record<string, string>)[language]} →
                </span>
              )}
            </div>
          </nav>
        </>
      )}
      </div>
      <PageFooter />
    </>
  );
}
