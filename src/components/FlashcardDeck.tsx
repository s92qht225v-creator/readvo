'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { FlashcardDeckData, FlashcardWord } from '../types';
import { FlashcardCard } from './FlashcardCard';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useLanguage } from '../hooks/useLanguage';

export interface FlashcardDeckProps {
  deck: FlashcardDeckData;
  bookPath: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ deck, bookPath }) => {
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
      {/* Header */}
      <div className="flashcard-page__header">
        <Link href={bookPath} className="flashcard-page__back">
          ← {language === 'ru' ? 'Назад' : 'Ortga'}
        </Link>
        <h1 className="flashcard-page__title">{title}</h1>
        <div className="flashcard-page__controls">
          <button
            className="flashcard-page__toggle flashcard-page__toggle--dir"
            onClick={() => setDirection((d) => d === 'cn' ? 'native' : 'cn')}
            type="button"
            title={language === 'ru' ? 'Направление' : 'Yo\'nalish'}
          >
            {direction === 'cn' ? `中→${language === 'ru' ? 'RU' : 'UZ'}` : `${language === 'ru' ? 'RU' : 'UZ'}→中`}
          </button>
          <button
            className={`flashcard-page__toggle${isPinyinVisible ? ' flashcard-page__toggle--active' : ''}`}
            onClick={() => setIsPinyinVisible((p) => !p)}
            type="button"
            title={language === 'ru' ? 'Пиньинь' : 'Pinyin'}
          >
            拼
          </button>
          <button
            className="flashcard-page__toggle flashcard-page__toggle--lang"
            onClick={toggleLanguage}
            type="button"
          >
            {language === 'uz' ? 'UZ' : 'RU'}
          </button>
        </div>
      </div>

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
            isAudioPlaying={audio.isPlaying(currentCard.id)}
            isAudioLoading={audio.isLoading(currentCard.id)}
            onFlip={handleFlip}
            onAudioClick={handleAudioClick}
          />

          {/* Action buttons - visible only when flipped */}
          <div className={`flashcard__actions${!isFlipped ? ' flashcard__actions--hidden' : ''}`}>
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
    </main>
  );
};

export default FlashcardDeck;
