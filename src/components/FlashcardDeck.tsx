'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { FlashcardDeckData, FlashcardWord } from '../types';
import { FlashcardCard } from './FlashcardCard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useLanguage } from '../hooks/useLanguage';
import { shuffleArray } from '../utils/shuffle';
import { useTrial } from '../hooks/useTrial';
import { Paywall } from './Paywall';

export interface FlashcardDeckProps {
  deck: FlashcardDeckData;
  bookPath: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ deck, bookPath }) => {
  // Trial check — lesson 1 flashcards are free
  const trial = useTrial();
  const isFreeContent = deck.words[0]?.lesson === 1;
  if (trial?.isTrialExpired && !isFreeContent) {
    return <Paywall />;
  }

  const [cards, setCards] = useState<FlashcardWord[]>([...deck.words]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set());
  const [language, toggleLanguage] = useLanguage();
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);
  const [direction, setDirection] = useState<'cn' | 'native'>('cn');
  const audio = useAudioPlayer();

  // Shuffle on mount to avoid hydration mismatch
  useEffect(() => {
    if (!isShuffled) {
      setCards(shuffleArray([...deck.words]));
      setIsShuffled(true);
    }
  }, [deck.words, isShuffled]);

  const totalCards = cards.length;
  const reviewedCount = knownIds.size + unknownIds.size;
  const isComplete = reviewedCount >= totalCards && totalCards > 0;
  const currentCard = cards[currentIndex];

  const handleAudioClick = useCallback((wordId: string, audioUrl: string) => {
    if (audio.isPlaying(wordId)) {
      audio.stop();
    } else {
      audio.play(wordId, audioUrl);
    }
  }, [audio]);

  const handleFlip = useCallback(() => {
    if (!isComplete) {
      setIsFlipped((prev) => !prev);
    }
  }, [isComplete]);

  const handleKnow = useCallback(() => {
    if (!currentCard) return;
    setKnownIds((prev) => new Set(prev).add(currentCard.id));
    setIsFlipped(false);
    // Small delay for flip animation before advancing
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 150);
  }, [currentCard]);

  const handleUnknown = useCallback(() => {
    if (!currentCard) return;
    setUnknownIds((prev) => new Set(prev).add(currentCard.id));
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 150);
  }, [currentCard]);

  const handleRestartUnknown = useCallback(() => {
    const unknownCards = cards.filter((c) => unknownIds.has(c.id));
    setCards(shuffleArray(unknownCards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
    setUnknownIds(new Set());
  }, [cards, unknownIds]);

  const handleRestartAll = useCallback(() => {
    setCards(shuffleArray([...deck.words]));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
    setUnknownIds(new Set());
  }, [deck.words]);

  const title = language === 'ru' && deck.title_ru ? deck.title_ru : deck.title;

  return (
    <main className="flashcard-page">
      <header className="reader__header">
        <div className="reader__header-inner">
          <Link href={`${bookPath}/flashcards`} className="reader__home">
            <img src="/logo-red.svg" alt="Blim" className="reader__home-logo" />
          </Link>
          <div className="reader__controls">
            <button
              className="page__lang-btn"
              onClick={toggleLanguage}
              type="button"
            >
              {language === 'uz' ? 'RU' : 'UZ'}
            </button>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="flashcard__progress">
        <span className="flashcard__progress-text">
          {reviewedCount}/{totalCards}
        </span>
        <div className="flashcard__progress-bar">
          <div
            className="flashcard__progress-fill"
            style={{ width: `${totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Card or completion */}
      {/* Audio FAB - screen level, outside card */}
      {!isComplete && currentCard?.audio_url && (
        <button
          className={`flashcard__audio-fab${audio.isPlaying(currentCard.id) ? ' flashcard__audio-fab--playing' : ''}${audio.isLoading(currentCard.id) ? ' flashcard__audio-fab--loading' : ''}`}
          onClick={() => handleAudioClick(currentCard.id, currentCard.audio_url!)}
          disabled={audio.isLoading(currentCard.id)}
          type="button"
          aria-label="Audio"
        >
          {audio.isLoading(currentCard.id) ? (
            <span className="flashcard__audio-fab-spinner" />
          ) : audio.isPlaying(currentCard.id) ? (
            <svg className="flashcard__audio-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="flashcard__audio-fab-icon" width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}

      {isComplete ? (
        <div className="flashcard__complete">
          <span className="flashcard__complete-text">
            {language === 'ru' ? 'Отлично! Все карточки просмотрены!' : 'Ajoyib! Barcha kartalar ko\'rib chiqildi!'}
          </span>
          <div className="flashcard__stats">
            <div className="flashcard__stat">
              <span className="flashcard__stat-value flashcard__stat-value--known">{knownIds.size}</span>
              <span className="flashcard__stat-label">
                {language === 'ru' ? 'Знаю' : 'Bilaman'}
              </span>
            </div>
            <div className="flashcard__stat">
              <span className="flashcard__stat-value flashcard__stat-value--unknown">{unknownIds.size}</span>
              <span className="flashcard__stat-label">
                {language === 'ru' ? 'Не знаю' : 'Bilmayman'}
              </span>
            </div>
          </div>
          <div className="flashcard__restart-btns">
            {unknownIds.size > 0 && (
              <button
                className="flashcard__restart-btn"
                onClick={handleRestartUnknown}
                type="button"
              >
                {language === 'ru'
                  ? `Повторить незнакомые (${unknownIds.size})`
                  : `Bilmaganlarni takrorlash (${unknownIds.size})`}
              </button>
            )}
            <button
              className="flashcard__restart-btn"
              onClick={handleRestartAll}
              type="button"
            >
              {language === 'ru' ? 'Начать сначала' : 'Boshidan boshlash'}
            </button>
          </div>
        </div>
      ) : currentCard ? (
        <>
          <FlashcardCard
            word={currentCard}
            isFlipped={isFlipped}
            isPinyinVisible={isPinyinVisible}
            language={language}
            direction={direction}
            onFlip={handleFlip}
          />

          {/* Action buttons - always visible */}
          <div className="flashcard__actions">
            <button
              className="flashcard__action-btn flashcard__action-btn--unknown"
              onClick={handleUnknown}
              type="button"
            >
              {language === 'ru' ? 'Не знаю' : 'Bilmayman'}
            </button>
            <button
              className="flashcard__action-btn flashcard__action-btn--know"
              onClick={handleKnow}
              type="button"
            >
              {language === 'ru' ? 'Знаю' : 'Bilaman'}
            </button>
          </div>
        </>
      ) : null}

      <nav className="story__bottom-bar">
        <div className="story__bottom-bar-inner">
          <button
            className={`reader__nav-toggle ${isPinyinVisible ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setIsPinyinVisible((p) => !p)}
            type="button"
          >
            Pinyin
          </button>
          <button
            className="reader__nav-toggle"
            onClick={() => setDirection((d) => d === 'cn' ? 'native' : 'cn')}
            type="button"
          >
            {direction === 'cn' ? `中 › ${language === 'ru' ? 'RU' : 'UZ'}` : `${language === 'ru' ? 'RU' : 'UZ'} › 中`}
          </button>
        </div>
      </nav>
    </main>
  );
};

export default FlashcardDeck;
