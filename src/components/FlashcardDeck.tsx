'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import type { FlashcardDeckData, FlashcardWord } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { shuffleArray } from '../utils/shuffle';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useTrial } from '../hooks/useTrial';
import { Paywall } from './Paywall';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { CoachMarkTour, dismissTip } from './CoachMark';
import type { TourStep } from './CoachMark';
import { trackAll } from '@/utils/analytics';

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
  const [cards, setCards] = useState<FlashcardWord[]>(() => shuffleArray([...deck.words]));
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
  const cardRef = useRef<HTMLDivElement>(null);
  const pinyinBtnRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startX = useRef(0);
  const dragXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Audio playback
  const playAudio = useCallback((url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const el = new Audio(url);
    audioRef.current = el;
    el.play().catch(() => {});
  }, []);

  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  // Analytics: track flashcard view
  useEffect(() => {
    trackAll('ViewContent', 'flashcard_view', 'flashcard_view', {
      content_name: `Flashcards: ${deck.title}`,
      content_category: 'Flashcards',
      content_type: 'product',
    });
  }, [deck.title]);

  const totalCards = cards.length;
  const reviewedCount = knownIds.size + unknownIds.size;
  const isComplete = reviewedCount >= totalCards && totalCards > 0;
  const currentCard = cards[currentIndex];
  const pct = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  const handleKnow = useCallback(() => {
    if (!currentCard || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setKnownIds((prev) => new Set(prev).add(currentCard.id));
    setIsFlipped(false);
    setDragX(0);
    dragXRef.current = 0;
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      isProcessingRef.current = false;
    }, 100);
  }, [currentCard]);

  const handleUnknown = useCallback(() => {
    if (!currentCard || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setUnknownIds((prev) => new Set(prev).add(currentCard.id));
    setIsFlipped(false);
    setDragX(0);
    dragXRef.current = 0;
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      isProcessingRef.current = false;
    }, 100);
  }, [currentCard]);

  const handleSwipe = useCallback((dir: 'left' | 'right') => {
    if (dir === 'right') handleKnow();
    else handleUnknown();
  }, [handleKnow, handleUnknown]);

  // Touch handlers — use refs to avoid stale closures (Bug 2 fix)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    dragXRef.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.touches[0].clientX - startX.current;
    dragXRef.current = dx;
    setDragX(dx);
  }, []);
  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    const dx = dragXRef.current;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (dx > SWIPE_THRESHOLD) handleSwipe('right');
    else if (dx < -SWIPE_THRESHOLD) handleSwipe('left');
    setDragX(0);
    dragXRef.current = 0;
  }, [handleSwipe]);

  // Mouse handlers — attach move/up to document to fix Bug 3 (onMouseLeave accidental swipe)
  const onDocMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startX.current;
    dragXRef.current = dx;
    setDragX(dx);
  }, []);
  const endMouseDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    const dx = dragXRef.current;
    isDraggingRef.current = false;
    setIsDragging(false);
    if (dx > SWIPE_THRESHOLD) handleSwipe('right');
    else if (dx < -SWIPE_THRESHOLD) handleSwipe('left');
    setDragX(0);
    dragXRef.current = 0;
  }, [handleSwipe]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    startX.current = e.clientX;
    dragXRef.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
    e.preventDefault();
  }, []);

  // Cleanup document listeners on unmount
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => onDocMouseMove(e);
    const handleMouseUp = () => endMouseDrag();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [endMouseDrag, isDragging, onDocMouseMove]);

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
    ? (language === 'ru' && currentCard.text_translation_ru ? currentCard.text_translation_ru : language === 'en' && currentCard.text_translation_en ? currentCard.text_translation_en : currentCard.text_translation)
    : '';

  const swipeOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const swipeLabel = dragX > SWIPE_THRESHOLD
    ? ({ uz: 'Bilaman ✓', ru: 'Знаю ✓', en: 'I know ✓' } as Record<string, string>)[language]
    : dragX < -SWIPE_THRESHOLD
      ? ({ uz: 'Bilmayman ✗', ru: 'Не знаю ✗', en: "Don't know ✗" } as Record<string, string>)[language]
      : dragX > 0
        ? ({ uz: 'Bilaman?', ru: 'Знаю?', en: 'I know?' } as Record<string, string>)[language]
        : dragX < 0
          ? ({ uz: 'Bilmayman?', ru: 'Не знаю?', en: "Don't know?" } as Record<string, string>)[language]
          : '';
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
          <div className="dr-hero__watermark">词</div>
          <div className="dr-hero__top-row">
            <Link href={backHref ?? '/chinese?tab=flashcards'} className="dr-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK 1 · {({ uz: 'FLESHKARTALAR', ru: 'ФЛЕШКАРТЫ', en: 'FLASHCARDS' } as Record<string, string>)[language]}</div>
            <h1 className="dr-hero__title">{lessonTitle ?? ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[language]}</h1>
            <div className="dr-hero__pinyin">{lessonPinyin ?? 'cíkǎ'}</div>
            <div className="dr-hero__translation">— {language === 'ru' ? (lessonTitleTranslation_ru || 'Флешкарты') : language === 'en' ? (lessonTitleTranslation || 'Flashcards') : (lessonTitleTranslation || 'Fleshkartalar')} —</div>
          </div>
        </div>

        {isComplete ? (
          <div className="hanzi-done">
            <div className="hanzi-done__title">
              {({ uz: 'Barakalla! 🎉', ru: 'Отлично! 🎉', en: 'Well done! 🎉' } as Record<string, string>)[language]}
            </div>
            <div className="hanzi-done__stats">
              {({ uz: `Bilaman: ${knownIds.size} · Bilmayman: ${unknownIds.size}`, ru: `Знаю: ${knownIds.size} · Не знаю: ${unknownIds.size}`, en: `Know: ${knownIds.size} · Don't know: ${unknownIds.size}` } as Record<string, string>)[language]}
            </div>
            <div className="hanzi-done__buttons">
              {unknownIds.size > 0 && (
                <button className="hanzi-done__restart-btn" onClick={handleRestartUnknown} type="button">
                  {({ uz: `Bilmaganlarni takrorlash (${unknownIds.size})`, ru: `Повторить незнакомые (${unknownIds.size})`, en: `Review unknown (${unknownIds.size})` } as Record<string, string>)[language]}
                </button>
              )}
              <button className="hanzi-done__back-btn" onClick={handleRestartAll} type="button">
                {({ uz: 'Boshidan boshlash', ru: 'Начать сначала', en: 'Restart all' } as Record<string, string>)[language]}
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
              <div style={{ fontSize: 11, color: '#ccc' }}>{({ uz: '← suring →', ru: '← листать →', en: '← swipe →' } as Record<string, string>)[language]}</div>
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
              style={{ userSelect: 'none', touchAction: 'pan-y' }}
            >
              <div ref={cardRef} style={{ perspective: 800, width: '100%', height: 260, position: 'relative', cursor: 'pointer' }}>
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


                <div
                  onClick={() => { if (!isDragging && Math.abs(dragX) < 5) { setIsFlipped((f) => !f); dismissTip('flashcard-tour'); } }}
                  style={{
                    width: '100%', height: '100%',
                    transformStyle: 'preserve-3d',
                    transition: dragX !== 0 ? 'none' : 'transform 0.45s',
                    transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg) rotateY(${isFlipped ? 180 : 0}deg)`,
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
                      <div style={{ fontSize: translation.length > 20 ? 18 : 22, fontWeight: 600, color: '#1a1a2e', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>{translation}</div>
                    )}
                    <div style={{ fontSize: 11, color: '#ccc', marginTop: 16 }}>
                      {({ uz: 'bosing — javobni ko\'ring', ru: 'нажмите — посмотрите ответ', en: 'tap to see answer' } as Record<string, string>)[language]}
                    </div>
                    {currentCard.audio_url && direction === 'cn' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); playAudio(currentCard.audio_url!); }}
                        style={{ position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5zM14 3.23v2.06a6.51 6.51 0 0 1 0 13.42v2.06A8.51 8.51 0 0 0 14 3.23z"/></svg>
                      </button>
                    )}
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
                        <div style={{ fontSize: translation.length > 20 ? 22 : translation.length > 12 ? 28 : 36, fontWeight: 600, color: '#fff', marginTop: 10, textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>{translation}</div>
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
                    {currentCard.audio_url && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); playAudio(currentCard.audio_url!); }}
                        style={{ position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5zM14 3.23v2.06a6.51 6.51 0 0 1 0 13.42v2.06A8.51 8.51 0 0 0 14 3.23z"/></svg>
                      </button>
                    )}
                    <div style={{ fontSize: 11, color: '#fca5a580', marginTop: 16 }}>{({ uz: '← bilmayman | bilaman →', ru: '← не знаю | знаю →', en: "← don't know | know →" } as Record<string, string>)[language]}</div>
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
                ✗ {({ uz: 'Bilmayman', ru: 'Не знаю', en: "Don't know" } as Record<string, string>)[language]}
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
                {({ uz: 'Bilaman', ru: 'Знаю', en: 'I know' } as Record<string, string>)[language]} ✓
              </button>
            </div>

          </div>
        ) : null}

        <nav className="story__bottom-bar">
          <div className="story__bottom-bar-inner">
            <button
              ref={pinyinBtnRef}
              className={`reader__nav-toggle ${isPinyinVisible ? 'reader__nav-toggle--active' : ''}`}
              onClick={() => setIsPinyinVisible((p) => !p)}
              type="button"
            >
              Pinyin
            </button>
          </div>
        </nav>
      </main>
      <CoachMarkTour
        tourId="flashcard-tour"
        lang={language}
        steps={[
          { tipId: 'fc-tap', targetRef: cardRef, text: { uz: 'Tarjimani ko\'rish uchun kartani bosing', ru: 'Нажмите на карточку, чтобы увидеть перевод', en: 'Tap the card to see the translation' } },
          { tipId: 'fc-swipe-left', targetRef: cardRef, text: { uz: 'So\'zni bilmasangiz chapga suring', ru: 'Свайп влево, если вы не знаете слово', en: 'Swipe left if you don\'t know the word' } },
          { tipId: 'fc-swipe-right', targetRef: cardRef, text: { uz: 'So\'zni bilsangiz o\'ngga suring', ru: 'Свайп вправо, если вы знаете слово', en: 'Swipe right if you know the word' } },
          { tipId: 'fc-pinyin', targetRef: pinyinBtnRef, text: { uz: 'Pinyinni yoqish/o\'chirish', ru: 'Нажмите, чтобы вкл/выкл пиньинь', en: 'Toggle pinyin on/off' }, forceAbove: true },
        ] as TourStep[]}
      />
      <PageFooter />
    </>
  );
};

export default FlashcardDeck;
