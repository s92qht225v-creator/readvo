'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { FlashcardDeckData, FlashcardWord } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useLanguage } from '../hooks/useLanguage';
import { shuffleArray } from '../utils/shuffle';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTrial } from '../hooks/useTrial';
import { Paywall } from './Paywall';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';

export interface FlashcardDeckProps {
  deck: FlashcardDeckData;
  bookPath: string;
  backHref?: string;
  lessonTitle?: string;
  lessonPinyin?: string;
  lessonTitleTranslation?: string;
  lessonTitleTranslation_ru?: string;
}

const SWIPE_THRESHOLD = 80;

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ deck, bookPath, backHref, lessonTitle, lessonPinyin, lessonTitleTranslation, lessonTitleTranslation_ru }) => {
  const { isLoading: authLoading } = useRequireAuth();
  const trial = useTrial();
  const [cards, setCards] = useState<FlashcardWord[]>([...deck.words]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [unknownIds, setUnknownIds] = useState<Set<string>>(new Set());
  const [language] = useLanguage();
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);
  const [direction] = useState<'cn' | 'native'>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('blim-flashcard-mode') : null;
      return saved === 'uz-zh' ? 'native' : 'cn';
    } catch { return 'cn'; }
  });
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const audio = useAudioPlayer();

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
  const pct = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  const handleAudioClick = useCallback(() => {
    if (!currentCard?.audio_url) return;
    if (audio.isPlaying(currentCard.id)) {
      audio.stop();
    } else {
      audio.play(currentCard.id, currentCard.audio_url);
    }
  }, [audio, currentCard]);

  const handleKnow = useCallback(() => {
    if (!currentCard) return;
    setKnownIds((prev) => new Set(prev).add(currentCard.id));
    setIsFlipped(false);
    setDragX(0);
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 100);
  }, [currentCard]);

  const handleUnknown = useCallback(() => {
    if (!currentCard) return;
    setUnknownIds((prev) => new Set(prev).add(currentCard.id));
    setIsFlipped(false);
    setDragX(0);
    setTimeout(() => setCurrentIndex((prev) => prev + 1), 100);
  }, [currentCard]);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    if (dir === 'right') handleKnow();
    else handleUnknown();
  }, [handleKnow, handleUnknown]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) setDragX(e.touches[0].clientX - startX.current);
  }, [isDragging]);
  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragX > SWIPE_THRESHOLD) handleSwipe('right');
    else if (dragX < -SWIPE_THRESHOLD) handleSwipe('left');
    else setDragX(0);
  }, [dragX, handleSwipe]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
    e.preventDefault();
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) setDragX(e.clientX - startX.current);
  }, [isDragging]);
  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    if (dragX > SWIPE_THRESHOLD) handleSwipe('right');
    else if (dragX < -SWIPE_THRESHOLD) handleSwipe('left');
    else setDragX(0);
  }, [dragX, handleSwipe]);

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

  const translation = currentCard
    ? (language === 'ru' && currentCard.text_translation_ru ? currentCard.text_translation_ru : currentCard.text_translation)
    : '';

  const swipeOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const swipeLabel = dragX > SWIPE_THRESHOLD
    ? (language === 'ru' ? 'Знаю ✓' : 'Bilaman ✓')
    : dragX < -SWIPE_THRESHOLD
      ? (language === 'ru' ? 'Не знаю ✗' : 'Bilmayman ✗')
      : dragX > 0
        ? (language === 'ru' ? 'Знаю?' : 'Bilaman?')
        : (language === 'ru' ? 'Не знаю?' : 'Bilmayman?');
  const swipeBg = dragX > SWIPE_THRESHOLD ? '#dcfce7' : dragX < -SWIPE_THRESHOLD ? '#fee2e2' : '#f5f5f8';
  const swipeBorder = dragX > SWIPE_THRESHOLD ? '#22c55e' : dragX < -SWIPE_THRESHOLD ? '#ef4444' : '#e0e0e6';
  const swipeColor = dragX > SWIPE_THRESHOLD ? '#16a34a' : dragX < -SWIPE_THRESHOLD ? '#ef4444' : '#999';

  if (authLoading) return <div className="loading-spinner" />;
  // Topic decks have no lesson field — treat as free; lesson 1 is always free
  const isFreeContent = deck.id.startsWith('topic-') || deck.words[0]?.lesson === 1;
  const showPaywall = trial?.isTrialExpired && !isFreeContent;

  return (
    <>
      {showPaywall && <Paywall />}
      <main className={`home${showPaywall ? ' paywall-blur' : ''}`}>
        <div className="dr-hero">
          <div className="dr-hero__top-row">
            <Link href={backHref ?? '/chinese?tab=flashcards'} className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK 1 · {language === 'ru' ? 'ФЛЕШКАРТЫ' : 'FLESHKARTALAR'}</div>
            <h1 className="dr-hero__title">{lessonTitle ?? '词卡'}</h1>
            <div className="dr-hero__pinyin">{lessonPinyin ?? 'cíkǎ'}</div>
            <div className="dr-hero__translation">— {language === 'ru' ? (lessonTitleTranslation_ru || 'Флешкарты') : (lessonTitleTranslation || 'Fleshkartalar')} —</div>
          </div>
        </div>

        {isComplete ? (
          <div className="flashcard__complete">
            <span className="flashcard__complete-text">
              {language === 'ru' ? 'Отлично! Все карточки просмотрены!' : 'Ajoyib! Barcha kartalar ko\'rib chiqildi!'}
            </span>
            <div className="flashcard__stats">
              <div className="flashcard__stat">
                <span className="flashcard__stat-value flashcard__stat-value--known">{knownIds.size}</span>
                <span className="flashcard__stat-label">{language === 'ru' ? 'Знаю' : 'Bilaman'}</span>
              </div>
              <div className="flashcard__stat">
                <span className="flashcard__stat-value flashcard__stat-value--unknown">{unknownIds.size}</span>
                <span className="flashcard__stat-label">{language === 'ru' ? 'Не знаю' : 'Bilmayman'}</span>
              </div>
            </div>
            <div className="flashcard__restart-btns">
              {unknownIds.size > 0 && (
                <button className="flashcard__restart-btn" onClick={handleRestartUnknown} type="button">
                  {language === 'ru' ? `Повторить незнакомые (${unknownIds.size})` : `Bilmaganlarni takrorlash (${unknownIds.size})`}
                </button>
              )}
              <button className="flashcard__restart-btn" onClick={handleRestartAll} type="button">
                {language === 'ru' ? 'Начать сначала' : 'Boshidan boshlash'}
              </button>
            </div>
          </div>
        ) : currentCard ? (
          <div style={{ padding: '0 16px', maxWidth: 520, margin: '0 auto', paddingTop: 16 }}>
            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 4 }}>
                <span>{Math.min(currentIndex + 1, totalCards)} / {totalCards}</span>
                <span>{pct}%</span>
              </div>
              <div style={{ height: 4, background: '#f5f5f8', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #dc2626, #f87171)',
                  borderRadius: 4,
                  width: `${pct}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>

            {/* Score indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#fee2e2', borderRadius: 8, padding: '5px 12px',
              }}>
                <span style={{ fontSize: 12, color: '#ef4444' }}>✗</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{unknownIds.size}</span>
              </div>
              <div style={{ fontSize: 11, color: '#ccc' }}>{language === 'ru' ? '← листать →' : '← suring →'}</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#dcfce7', borderRadius: 8, padding: '5px 12px',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>{knownIds.size}</span>
                <span style={{ fontSize: 12, color: '#16a34a' }}>✓</span>
              </div>
            </div>

            {/* Card with swipe */}
            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ userSelect: 'none', touchAction: 'pan-y' }}
            >
              <div style={{ perspective: 800, width: '100%', height: 260, position: 'relative', cursor: 'pointer' }}>
                {/* Swipe indicator */}
                {Math.abs(dragX) > 20 && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    left: dragX < -SWIPE_THRESHOLD ? 'auto' : 16,
                    right: dragX < -SWIPE_THRESHOLD ? 16 : 'auto',
                    zIndex: 10,
                    padding: '6px 16px',
                    borderRadius: 8,
                    background: swipeBg,
                    border: `2px solid ${swipeBorder}`,
                    fontSize: 13,
                    fontWeight: 700,
                    color: swipeColor,
                    opacity: swipeOpacity,
                    pointerEvents: 'none',
                  }}>
                    {swipeLabel}
                  </div>
                )}

                {/* Audio button */}
                {currentCard.audio_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAudioClick(); }}
                    style={{
                      position: 'absolute', top: 12, right: 12, zIndex: 10,
                      width: 32, height: 32, borderRadius: '50%',
                      background: audio.isPlaying(currentCard.id) ? '#dc2626' : '#f5f5f8',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    type="button"
                    aria-label="Audio"
                  >
                    {audio.isLoading(currentCard.id) ? (
                      <span style={{ width: 14, height: 14, border: '2px solid #dc2626', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    ) : audio.isPlaying(currentCard.id) ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#999"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>
                )}

                <div
                  onClick={() => { if (!isDragging && Math.abs(dragX) < 5) setIsFlipped((f) => !f); }}
                  style={{
                    width: '100%', height: '100%',
                    transformStyle: 'preserve-3d',
                    transition: dragX !== 0 ? 'none' : 'transform 0.45s',
                    transform: `rotateY(${isFlipped ? 180 : 0}deg) translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
                  }}
                >
                  {/* Front */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    background: '#fff', borderRadius: 16,
                    border: '1px solid #e0e0e6',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: 20,
                  }}>
                    {direction === 'cn' ? (
                      <>
                        <div style={{ fontSize: 52, fontWeight: 300, color: '#1a1a2e' }}>{currentCard.text_original}</div>
                        {isPinyinVisible && (
                          <div style={{ fontSize: 16, color: '#dc2626', marginTop: 8 }}>{currentCard.pinyin}</div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a2e', textAlign: 'center' }}>{translation}</div>
                    )}
                    <div style={{ fontSize: 11, color: '#ccc', marginTop: 16 }}>
                      {language === 'ru' ? 'нажмите — посмотрите ответ' : 'bosing — javobni ko\'ring'}
                    </div>
                  </div>

                  {/* Back */}
                  <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    borderRadius: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: 20,
                  }}>
                    {direction === 'cn' ? (
                      <>
                        <div style={{ fontSize: 22, fontWeight: 300, color: '#fca5a5' }}>{currentCard.text_original}</div>
                        <div style={{ fontSize: 36, fontWeight: 600, color: '#fff', marginTop: 10, textAlign: 'center' }}>{translation}</div>
                        <div style={{ fontSize: 15, color: '#fca5a5', marginTop: 10 }}>{currentCard.pinyin}</div>
                      </>
                    ) : (
                      <>
                        {isPinyinVisible && (
                          <div style={{ fontSize: 15, color: '#fca5a5' }}>{currentCard.pinyin}</div>
                        )}
                        <div style={{ fontSize: 48, fontWeight: 300, color: '#fff', marginTop: 4 }}>{currentCard.text_original}</div>
                        <div style={{ fontSize: 18, color: '#fca5a5', marginTop: 8, textAlign: 'center' }}>{translation}</div>
                      </>
                    )}
                    <div style={{ fontSize: 11, color: '#fca5a580', marginTop: 16 }}>{language === 'ru' ? '← не знаю | знаю →' : '← bilmayman | bilaman →'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={handleUnknown}
                style={{
                  flex: 1, padding: 12, border: '2px solid #fca5a5', borderRadius: 10,
                  background: '#fff', color: '#ef4444', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                type="button"
              >
                ✗ {language === 'ru' ? 'Не знаю' : 'Bilmayman'}
              </button>
              <button
                onClick={handleKnow}
                style={{
                  flex: 1, padding: 12, border: '2px solid #86efac', borderRadius: 10,
                  background: '#fff', color: '#16a34a', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                type="button"
              >
                {language === 'ru' ? 'Знаю' : 'Bilaman'} ✓
              </button>
            </div>

          </div>
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
          </div>
        </nav>
      </main>
      <PageFooter />
    </>
  );
};

export default FlashcardDeck;
