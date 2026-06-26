'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import type { FlashcardDeckData, FlashcardWord } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuth } from '../hooks/useAuth';
import { useTrial } from '../hooks/useTrial';
import { usePrimeAudioToken } from '../hooks/useAudioToken';
import { protectAudioUrlSync } from '../lib/audio/token-client';
import { resolveTtsUrl } from '@/utils/ttsAudio';
import type { ArabicGrade } from '../lib/arabicSrs';
import { Paywall } from './Paywall';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { LadderExercise } from './flashcards/LadderExercise';
import { trackAll } from '@/utils/analytics';
import '@/styles/arabic.css';

export interface FlashcardDeckProps {
  deck: FlashcardDeckData;
  bookPath: string;
  backHref?: string;
  lessonTitle?: string;
  lessonPinyin?: string;
  lessonTitleTranslation?: string;
  lessonTitleTranslation_ru?: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ deck, backHref, lessonTitle, lessonPinyin, lessonTitleTranslation, lessonTitleTranslation_ru }) => {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const trial = useTrial();
  const [language] = useLanguage();

  // Session "stack": cards due now + never-seen cards, built once. Grading
  // removes a card; "move to back" re-queues it within the session.
  const [phase, setPhase] = useState<'loading' | 'review' | 'empty'>('loading');
  const [queue, setQueue] = useState<FlashcardWord[]>([]);
  const [reviewed, setReviewed] = useState(0);
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);
  const tokenRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const builtRef = useRef(false);
  // Prefetched TTS URLs (by word id) for cards without recorded audio, so a tap
  // can play synchronously inside the user gesture (mobile blocks play() after
  // an await). Warmed on deck load.
  const ttsUrlsRef = useRef<Record<string, string>>({});
  const prefetchedRef = useRef(false);
  // Cards answered wrong at least once this session → when they're finally
  // gotten right they schedule sooner ('dontKnow') instead of 'know'.
  const missedRef = useRef<Set<string>>(new Set());

  const cardId = useCallback((w: FlashcardWord) => `${deck.id}:${w.id}`, [deck.id]);

  usePrimeAudioToken();

  // Resolves once the clip actually starts playing (or fails / times out), so
  // callers can show a loading spinner until then.
  const playAudio = useCallback((url: string) => {
    if (audioRef.current) audioRef.current.pause();
    const el = new Audio(protectAudioUrlSync(url));
    audioRef.current = el;
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      el.onplaying = finish;
      el.onerror = finish;
      el.play().catch(finish);
      setTimeout(finish, 6000);
    });
  }, []);
  // Play a card's audio: recorded `audio_url` when present, otherwise MiMo TTS
  // (cached). Lets the listening rung work on every card even though recorded
  // audio is sparse for topic decks.
  const playCardAudio = useCallback(async (w: FlashcardWord) => {
    // Synchronous path (recorded audio or already-prefetched TTS) keeps play()
    // inside the user gesture so mobile doesn't block it.
    const ready = w.audio_url ?? ttsUrlsRef.current[w.id];
    if (ready) { await playAudio(ready); return; }
    const url = await resolveTtsUrl(w.text_original);
    if (url) { ttsUrlsRef.current[w.id] = url; await playAudio(url); }
  }, [playAudio]);
  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }, []);

  // Warm TTS for words without recorded audio so the listening rung (and the 🔊
  // on other rungs) plays instantly on tap. Sequential, once per deck.
  useEffect(() => {
    if (prefetchedRef.current || !deck.words.length) return;
    prefetchedRef.current = true;
    let cancelled = false;
    (async () => {
      for (const w of deck.words) {
        if (w.audio_url || !w.text_original?.trim() || ttsUrlsRef.current[w.id]) continue;
        const url = await resolveTtsUrl(w.text_original);
        if (cancelled) return;
        if (url) ttsUrlsRef.current[w.id] = url;
      }
    })();
    return () => { cancelled = true; };
  }, [deck.words]);

  useEffect(() => {
    trackAll('ViewContent', 'flashcard_view', 'flashcard_view', {
      content_name: `Flashcards: ${deck.title}`, content_category: 'Flashcards', content_type: 'product',
    });
  }, [deck.title]);

  // Build the session once: due cards + never-seen cards (a card with no review
  // row counts as due immediately — "Due only" semantics).
  useEffect(() => {
    if (authLoading || builtRef.current) return;
    builtRef.current = true;
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (cancelled) return;
      tokenRef.current = token;

      const dueByCard: Record<string, number> = {};
      if (token) {
        try {
          const res = await fetch(`/api/flashcards/reviews?prefix=${encodeURIComponent(deck.id + ':')}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            for (const r of ((await res.json()).reviews ?? []) as { card_id: string; due_at: string }[]) {
              dueByCard[r.card_id] = new Date(r.due_at).getTime();
            }
          }
        } catch { /* offline → treat all as new */ }
      }
      if (cancelled) return;
      const now = Date.now();
      const stack = deck.words.filter((w) => {
        const due = dueByCard[cardId(w)];
        return due === undefined || due <= now;
      });
      missedRef.current = new Set();
      setQueue(stack);
      setPhase(stack.length === 0 ? 'empty' : 'review');
    })();
    return () => { cancelled = true; };
  }, [authLoading, deck.id, deck.words, getAccessToken, cardId]);

  const card = queue[0];
  const t = (uz: string, ru: string, en: string) => ({ uz, ru, en } as Record<string, string>)[language];

  // Exercise outcome: correct → schedule + drop from the session; wrong → mark
  // missed and re-queue to the back so it comes around again this session.
  const onResult = useCallback((correct: boolean) => {
    const w = queue[0];
    if (!w) return;
    const id = cardId(w);
    if (correct) {
      const g: ArabicGrade = missedRef.current.has(id) ? 'dontKnow' : 'know';
      setReviewed((n) => n + 1);
      setQueue((q) => q.slice(1));
      if (tokenRef.current) {
        fetch('/api/flashcards/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ card_id: id, grade: g }),
        }).catch(() => {});
      }
    } else {
      missedRef.current.add(id);
      setQueue((q) => (q.length > 1 ? [...q.slice(1), q[0]] : q));
    }
  }, [queue, cardId]);

  if (authLoading) return <div className="loading-spinner" />;
  const isFreeContent = deck.id.startsWith('topic-') || deck.words[0]?.lesson === 1;
  const showPaywall = trial?.isTrialExpired && !isFreeContent;
  const total = queue.length + reviewed;

  return (
    <>
      {showPaywall && <Paywall />}
      <main className={`home${showPaywall ? ' paywall-blur' : ''}`}>
        <div className="dr-hero">
          <div className="dr-hero__watermark">词</div>
          <div className="dr-hero__top-row">
            <Link href={backHref ?? '/chinese/flashcards'} className="dr-back-btn" aria-label={t('Orqaga', 'Назад', 'Back')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{t('FLESHKARTALAR', 'ФЛЕШКАРТЫ', 'FLASHCARDS')}</div>
            <h1 className="dr-hero__title">{lessonTitle ?? t('Fleshkartalar', 'Флешкарты', 'Flashcards')}</h1>
            <div className="dr-hero__pinyin">{lessonPinyin ?? 'cíkǎ'}</div>
            <div className="dr-hero__translation">— {language === 'ru' ? (lessonTitleTranslation_ru || 'Флешкарты') : language === 'en' ? (lessonTitleTranslation || 'Flashcards') : (lessonTitleTranslation || 'Fleshkartalar')} —</div>
          </div>
        </div>

        {phase === 'loading' && <div className="loading-spinner" />}

        {phase === 'review' && card && (
          <section className="home__content ar-fc">
            <div className="ar-fc__progress"><div className="ar-fc__progress-bar" style={{ width: total ? `${(reviewed / total) * 100}%` : '0%' }} /></div>
            <div className="ar-fc__count">{queue.length} {t('qoldi', 'осталось', 'left')}</div>

            <LadderExercise
              key={cardId(card)}
              card={card}
              deck={deck.words}
              language={language}
              showPinyin={isPinyinVisible}
              onAudio={() => playCardAudio(card)}
              onResult={onResult}
            />

            <nav className="story__bottom-bar">
              <div className="story__bottom-bar-inner">
                <button className={`reader__nav-toggle ${isPinyinVisible ? 'reader__nav-toggle--active' : ''}`} onClick={() => setIsPinyinVisible((p) => !p)} type="button">Pinyin</button>
              </div>
            </nav>
          </section>
        )}

        {(phase === 'empty' || (phase === 'review' && queue.length === 0)) && (
          <section className="home__content ar-fc__done">
            <div className="ar-fc__done-title">
              {reviewed > 0 ? t('Barakalla! 🎉', 'Отлично! 🎉', 'Well done! 🎉') : t('Hozircha takrorlash yoʻq', 'Пока нечего повторять', 'Nothing to repeat right now')}
            </div>
            {reviewed > 0 && (
              <div className="ar-fc__done-stats">{reviewed} {t('ta karta koʻrildi', 'карточек просмотрено', 'cards reviewed')}</div>
            )}
            <Link href={backHref ?? '/chinese/flashcards'} className="ar-fc__btn ar-fc__btn--yes" style={{ textDecoration: 'none', textAlign: 'center' }}>
              {t('Toʻplamlarga qaytish', 'К колодам', 'Back to decks')}
            </Link>
          </section>
        )}
        <PageFooter />
      </main>
    </>
  );
};

export default FlashcardDeck;
