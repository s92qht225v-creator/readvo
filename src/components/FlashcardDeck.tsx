'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import type { FlashcardDeckData, FlashcardWord } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { shuffleArray } from '../utils/shuffle';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuth } from '../hooks/useAuth';
import { useTrial } from '../hooks/useTrial';
import { usePrimeAudioToken } from '../hooks/useAudioToken';
import { protectAudioUrlSync } from '../lib/audio/token-client';
import { newCardState, schedule, type Grade, type CardState } from '../lib/srs';
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

const NEW_PER_SESSION = 20; // cap brand-new cards introduced per study session

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ deck, bookPath, backHref, lessonTitle, lessonPinyin, lessonTitleTranslation, lessonTitleTranslation_ru }) => {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const trial = useTrial();
  const [language] = useLanguage();

  // Spaced-repetition session queue. The current card is always queue[0];
  // grading shifts it off (or re-queues it to the back on "Again").
  const [phase, setPhase] = useState<'loading' | 'review' | 'empty'>('loading');
  const [queue, setQueue] = useState<FlashcardWord[]>([]);
  const [sessionTotal, setSessionTotal] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0); // unique cards passed (good/easy)
  const reviewedRef = useRef<Set<string>>(new Set());
  const tokenRef = useRef<string | null>(null);
  // Per-card SRS state (from the server), used to show each grade's next interval.
  const stateRef = useRef<Map<string, CardState>>(new Map());

  const [isFlipped, setIsFlipped] = useState(false);
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);
  const [direction] = useState<'cn' | 'native'>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('blim-flashcard-mode') : null;
      return saved === 'uz-zh' ? 'native' : 'cn';
    } catch { return 'cn'; }
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const pinyinBtnRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);

  const cardId = useCallback((w: FlashcardWord) => `${deck.id}:${w.id}`, [deck.id]);

  usePrimeAudioToken();

  // Audio playback
  const playAudio = useCallback((url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const el = new Audio(protectAudioUrlSync(url));
    audioRef.current = el;
    el.play().catch(() => {});
  }, []);
  useEffect(() => {
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, []);

  // Analytics
  useEffect(() => {
    trackAll('ViewContent', 'flashcard_view', 'flashcard_view', {
      content_name: `Flashcards: ${deck.title}`,
      content_category: 'Flashcards',
      content_type: 'product',
    });
  }, [deck.title]);

  // Build the study session from the user's review state: cards that are DUE
  // plus a capped number of NEW cards. Falls back to a plain shuffle (no
  // persistence) if the user has no token.
  //
  // Built ONCE per mount — `builtRef` guards against the effect re-running
  // (deck.words / other deps aren't always referentially stable), which would
  // otherwise rebuild the session on every grade and wipe the in-session queue.
  const builtRef = useRef(false);
  useEffect(() => {
    if (authLoading || builtRef.current) return;
    builtRef.current = true;
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (cancelled) return;
      tokenRef.current = token;

      let session: FlashcardWord[];
      if (!token) {
        session = shuffleArray([...deck.words]);
      } else {
        let byId = new Map<string, { due_at: string }>();
        try {
          const res = await fetch(`/api/flashcards/reviews?prefix=${encodeURIComponent(deck.id + ':')}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          type Row = { card_id: string; due_at: string; ease: number; interval_days: number; reps: number; lapses: number };
          const rows: Row[] = data.reviews ?? [];
          byId = new Map(rows.map((r) => [r.card_id, r]));
          stateRef.current = new Map(rows.map((r) => [r.card_id, { reps: r.reps, lapses: r.lapses, ease: r.ease, intervalDays: r.interval_days, dueAt: r.due_at }]));
        } catch { /* offline → treat all as new */ }
        if (cancelled) return;
        const now = Date.now();
        const due: FlashcardWord[] = [];
        const fresh: FlashcardWord[] = [];
        for (const w of deck.words) {
          const r = byId.get(cardId(w));
          if (!r) fresh.push(w);
          else if (new Date(r.due_at).getTime() <= now) due.push(w);
        }
        session = [...shuffleArray(due), ...shuffleArray(fresh).slice(0, NEW_PER_SESSION)];
      }

      if (cancelled) return;
      reviewedRef.current = new Set();
      setReviewedCount(0);
      setSessionTotal(session.length);
      setQueue(session);
      setPhase(session.length === 0 ? 'empty' : 'review');
    })();
    return () => { cancelled = true; };
  }, [authLoading, deck.id, deck.words, getAccessToken, cardId]);

  const currentCard = queue[0];
  const isComplete = phase === 'review' && queue.length === 0;
  const pct = sessionTotal > 0 ? Math.round((reviewedCount / sessionTotal) * 100) : 0;

  // Next interval (in days) each grade would schedule for the current card,
  // so the buttons can show "in N days".
  const curState = currentCard ? (stateRef.current.get(cardId(currentCard)) ?? newCardState()) : null;
  const goodDays = curState ? schedule(curState, 'good').intervalDays : 1;
  const easyDays = curState ? schedule(curState, 'easy').intervalDays : 4;
  const daysLabel = (n: number) => ({
    uz: `${n} kundan keyin qaytarish`,
    ru: `повторить через ${n} дн.`,
    en: `repeat in ${n} ${n === 1 ? 'day' : 'days'}`,
  } as Record<string, string>)[language];

  // Grade the current card: persist + re-schedule, then advance the queue.
  // "Again" re-queues the card to the back so it reappears this session.
  const grade = useCallback((g: Grade) => {
    const card = queue[0];
    if (!card || isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (tokenRef.current) {
      fetch('/api/flashcards/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ card_id: cardId(card), grade: g }),
      }).catch(() => {});
    }

    // Keep the local state in sync so the next interval shown on the buttons
    // stays accurate (e.g. for a re-queued "again" card).
    const id = cardId(card);
    stateRef.current.set(id, schedule(stateRef.current.get(id) ?? newCardState(), g));

    if (g !== 'again') {
      reviewedRef.current.add(id);
      setReviewedCount(reviewedRef.current.size);
    }

    // Advance the queue: "again" re-queues to the back, know/easy drops it.
    setIsFlipped(false);
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      return g === 'again' ? [...rest, first] : rest;
    });
    isProcessingRef.current = false;
  }, [queue, cardId]);

  // Render the current card as a tap-to-flip card (no movement animation).
  const renderCard = (card: FlashcardWord) => {
    const flipped = isFlipped;
    const tr = language === 'ru' && card.text_translation_ru ? card.text_translation_ru
      : language === 'en' && card.text_translation_en ? card.text_translation_en
      : card.text_translation;
    const audioBtn = (bg: string) => card.audio_url ? (
      <button type="button" onClick={(e) => { e.stopPropagation(); playAudio(card.audio_url!); }}
        style={{ position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: '50%', border: 'none', background: bg, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.5v7a4.49 4.49 0 0 0 2.5-3.5zM14 3.23v2.06a6.51 6.51 0 0 1 0 13.42v2.06A8.51 8.51 0 0 0 14 3.23z"/></svg>
      </button>
    ) : null;

    return (
      <div
        key={cardId(card)}
        role="button"
        tabIndex={0}
        aria-label={({ uz: 'Kartani aylantirish', ru: 'Перевернуть карточку', en: 'Flip card' } as Record<string, string>)[language]}
        onClick={() => { setIsFlipped((f) => !f); dismissTip('flashcard-tour'); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsFlipped((f) => !f); dismissTip('flashcard-tour'); } }}
        style={{
          position: 'absolute', inset: 0, cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.4s',
          transform: `rotateY(${flipped ? 180 : 0}deg)`,
        }}
      >
        {/* Front */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: '#fff', borderRadius: 3, border: '1px solid #e0e0e6', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {direction === 'cn' ? (
            <>
              <div lang="zh-Hans" style={{ fontSize: 52, fontWeight: 300, color: '#1a1a2e' }}>{card.text_original}</div>
              {isPinyinVisible && <div style={{ fontSize: 16, color: '#dc2626', marginTop: 8 }}>{card.pinyin}</div>}
            </>
          ) : (
            <div style={{ fontSize: tr.length > 20 ? 18 : 22, fontWeight: 600, color: '#1a1a2e', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>{tr}</div>
          )}
          <div style={{ fontSize: 11, color: '#ccc', marginTop: 16 }}>
            {({ uz: 'bosing — javobni ko\'ring', ru: 'нажмите — посмотрите ответ', en: 'tap to see answer' } as Record<string, string>)[language]}
          </div>
          {direction === 'cn' && audioBtn('#dc2626')}
        </div>
        {/* Back */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          {direction === 'cn' ? (
            <>
              <div lang="zh-Hans" style={{ fontSize: 22, fontWeight: 300, color: '#fca5a5' }}>{card.text_original}</div>
              <div style={{ fontSize: tr.length > 20 ? 22 : tr.length > 12 ? 28 : 36, fontWeight: 600, color: '#fff', marginTop: 10, textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>{tr}</div>
              <div style={{ fontSize: 15, color: '#fca5a5', marginTop: 10 }}>{card.pinyin}</div>
            </>
          ) : (
            <>
              {isPinyinVisible && <div style={{ fontSize: 15, color: '#fca5a5' }}>{card.pinyin}</div>}
              <div lang="zh-Hans" style={{ fontSize: 48, fontWeight: 300, color: '#fff', marginTop: 4 }}>{card.text_original}</div>
              <div style={{ fontSize: 18, color: '#fca5a5', marginTop: 8, textAlign: 'center' }}>{tr}</div>
            </>
          )}
          {audioBtn('rgba(255,255,255,0.2)')}
        </div>
      </div>
    );
  };

  if (authLoading) return <div className="loading-spinner" />;
  const isFreeContent = deck.id.startsWith('topic-') || deck.words[0]?.lesson === 1;
  const showPaywall = trial?.isTrialExpired && !isFreeContent;

  return (
    <>
      {showPaywall && <Paywall />}
      <main className={`home${showPaywall ? ' paywall-blur' : ''}`}>
        <div className="dr-hero">
          <div className="dr-hero__watermark">词</div>
          <div className="dr-hero__top-row">
            <Link href={backHref ?? '/chinese/flashcards'} className="dr-back-btn" aria-label={({ uz: 'Orqaga', ru: 'Назад', en: 'Back' } as Record<string, string>)[language]}>
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

        {phase === 'loading' ? (
          <div className="loading-spinner" />
        ) : phase === 'empty' ? (
          <div className="hanzi-done">
            <div className="hanzi-done__title">
              {({ uz: 'Hammasi takrorlangan! 🎉', ru: 'Всё повторено! 🎉', en: 'All caught up! 🎉' } as Record<string, string>)[language]}
            </div>
            <div className="hanzi-done__stats">
              {({ uz: 'Bu to\'plamda hozircha takrorlash uchun karta yo\'q. Keyinroq qaytib keling.', ru: 'В этой колоде пока нечего повторять. Загляните позже.', en: 'Nothing to review in this deck right now. Come back later.' } as Record<string, string>)[language]}
            </div>
            <div className="hanzi-done__buttons">
              <Link href={backHref ?? '/chinese/flashcards'} className="hanzi-done__back-btn">
                {({ uz: 'To\'plamlarga qaytish', ru: 'К колодам', en: 'Back to decks' } as Record<string, string>)[language]}
              </Link>
            </div>
          </div>
        ) : isComplete ? (
          <div className="hanzi-done">
            <div className="hanzi-done__title">
              {({ uz: 'Barakalla! 🎉', ru: 'Отлично! 🎉', en: 'Well done! 🎉' } as Record<string, string>)[language]}
            </div>
            <div className="hanzi-done__stats">
              {({ uz: `${reviewedCount} ta karta takrorlandi`, ru: `Повторено карточек: ${reviewedCount}`, en: `${reviewedCount} cards reviewed` } as Record<string, string>)[language]}
            </div>
            <div className="hanzi-done__buttons">
              <Link href={backHref ?? '/chinese/flashcards'} className="hanzi-done__back-btn">
                {({ uz: 'To\'plamlarga qaytish', ru: 'К колодам', en: 'Back to decks' } as Record<string, string>)[language]}
              </Link>
            </div>
          </div>
        ) : currentCard ? (
          <div style={{ padding: '0 16px', maxWidth: 520, margin: '0 auto', paddingTop: 16 }}>
            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7177', marginBottom: 4 }}>
                <span>{reviewedCount} / {sessionTotal}</span>
                <span>{pct}%</span>
              </div>
              <div style={{ height: 4, background: '#f5f5f8', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #dc2626, #f87171)',
                  borderRadius: 3,
                  width: `${pct}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>


            {/* Card — tap to flip */}
            <div ref={cardRef} style={{ perspective: 900, width: '100%', height: 260, position: 'relative' }}>
              {renderCard(currentCard)}
            </div>

            {/* Grade buttons: I know / Easy on top, I don't know full-width below */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              <button
                onClick={() => grade('good')}
                style={{ width: '100%', padding: 13, border: 'none', borderRadius: 3, background: '#16a34a', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}
                type="button"
              >
                {daysLabel(goodDays)}
              </button>
              <button
                onClick={() => grade('easy')}
                style={{ width: '100%', padding: 13, border: 'none', borderRadius: 3, background: '#2563eb', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}
                type="button"
              >
                {daysLabel(easyDays)}
              </button>
              <button
                onClick={() => grade('again')}
                style={{ width: '100%', padding: 13, border: 'none', borderRadius: 3, background: '#dc2626', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}
                type="button"
              >
                {({ uz: 'shu sessiyada qaytariladi', ru: 'повторить в этой сессии', en: 'repeat this session' } as Record<string, string>)[language]}
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
          { tipId: 'fc-grade', targetRef: cardRef, text: { uz: 'Bilsangiz "Yaxshi", bilmasangiz "Qayta" — eslab qolganingizga qarab kartalar takrorlanadi', ru: 'Знаете — «Хорошо», нет — «Заново». Карточки возвращаются по мере запоминания', en: 'Grade Good if you knew it, Again if not — cards come back based on how well you remember' } },
          { tipId: 'fc-pinyin', targetRef: pinyinBtnRef, text: { uz: 'Pinyinni yoqish/o\'chirish', ru: 'Нажмите, чтобы вкл/выкл пиньинь', en: 'Toggle pinyin on/off' }, forceAbove: true },
        ] as TourStep[]}
      />
      <PageFooter />
    </>
  );
};

export default FlashcardDeck;
