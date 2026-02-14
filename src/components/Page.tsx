'use client';

/**
 * Page Component
 *
 * Top-level container for a textbook page.
 * Manages all UI state for the page.
 *
 * RESPONSIBILITIES:
 * - Render all sections in order
 * - Coordinate audio playback (via useAudioPlayer hook)
 *
 * STATE DELEGATED:
 * - audio: managed by useAudioPlayer hook (singleton, concurrency-safe)
 */

import React, { useCallback } from 'react';
import type { Page as PageType } from '../types';
import type { Language } from '../types/ui-state';
import { Section } from './Section';
import { LessonHeader } from './LessonHeader';
import { useAudioPlayer } from '../hooks';

export interface PageProps {
  /** The page data */
  page: PageType;

  /** Whether pinyin is visible (controlled by parent) */
  isPinyinVisible: boolean;

  /** Whether translation is visible (controlled by parent) */
  isTranslationVisible: boolean;

  /** Font size percentage (controlled by parent) */
  fontSize: number;

  /** Selected language for translations */
  language: Language;

  /** Currently active/selected sentence ID (for translation panel) */
  activeSentenceId?: string | null;

  /** Callback when a sentence is tapped */
  onSentenceClick?: (sentenceId: string) => void;
}

export const Page: React.FC<PageProps> = React.memo(function Page({
  page,
  isPinyinVisible,
  isTranslationVisible,
  fontSize,
  language,
  activeSentenceId,
  onSentenceClick,
}) {
  // Audio player - uses singleton with concurrency guard
  const audioPlayer = useAudioPlayer();

  /**
   * Handle audio button click → play/stop audio
   *
   * The useAudioPlayer hook handles:
   * - Stopping any currently playing audio before starting new
   * - Toggle behavior (clicking same sentence stops it)
   * - Race condition protection
   */
  const handleAudioClick = useCallback(
    (sentenceId: string, audioUrl: string) => {
      // If this sentence is currently playing, stop it (toggle off)
      if (audioPlayer.isPlaying(sentenceId)) {
        audioPlayer.stop();
      } else {
        // Play new audio - hook automatically stops any current playback
        audioPlayer.play(sentenceId, audioUrl);
      }
    },
    [audioPlayer]
  );

  /**
   * Handle section audio button click → play/stop section audio
   */
  const handleSectionAudioClick = useCallback(
    (sectionId: string, audioUrl: string) => {
      // If this section is currently playing, stop it (toggle off)
      if (audioPlayer.isPlaying(sectionId)) {
        audioPlayer.stop();
      } else {
        // Play new audio - hook automatically stops any current playback
        audioPlayer.play(sectionId, audioUrl);
      }
    },
    [audioPlayer]
  );

  return (
    <article
      className="page"
      data-page-id={page.id}
      style={{ '--font-scale': `${fontSize / 100}` } as React.CSSProperties}
    >
      {/* Lesson header banner (only if present) */}
      {page.lessonHeader && <LessonHeader header={page.lessonHeader} language={language} />}

      {/* Simple page header (fallback if no lesson header) */}
      {!page.lessonHeader && page.title && (
        <header className="page__header">
          <h1 className="page__title">{page.title}</h1>
        </header>
      )}

      {/* Page content - sections */}
      <div className="page__content">
        {page.sections.map((section) => (
          <Section
            key={section.id}
            section={section}
            isPinyinVisible={isPinyinVisible}
            isTranslationVisible={isTranslationVisible}
            language={language}
            playingSentenceId={audioPlayer.state.playingSentenceId}
            loadingAudioSentenceId={audioPlayer.state.loadingSentenceId}
            onAudioClick={handleAudioClick}
            playingSectionId={audioPlayer.state.playingSentenceId}
            loadingSectionId={audioPlayer.state.loadingSentenceId}
            onSectionAudioClick={handleSectionAudioClick}
            activeSentenceId={activeSentenceId}
            onSentenceClick={onSentenceClick}
          />
        ))}
      </div>

      {/* Audio error display (optional, shows if audio fails) */}
      {audioPlayer.state.error && (
        <div className="page__audio-error" role="alert">
          {audioPlayer.state.error}
        </div>
      )}
    </article>
  );
});

export default Page;
