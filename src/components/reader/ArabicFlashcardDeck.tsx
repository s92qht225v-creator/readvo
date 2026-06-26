'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { Paywall } from '@/components/Paywall';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { stripHarakat } from '@/lib/reader/harakat';
import { resolveTtsUrlAr } from '@/utils/ttsAudioAr';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { ArabicGrade } from '@/lib/arabicSrs';
import '@/styles/arabic.css';
import type { Language } from '@/types/ui-state';

interface Card { id: string; ar: string; translit: string; uz: string; ru: string; en: string; }
interface Deck { id: string; level: string; title_uz: string; title_ru: string; title_en: string; cards: Card[]; }

const tr = (c: Card, l: Language) => (l === 'ru' ? c.ru : l === 'en' ? c.en : c.uz);

export function ArabicFlashcardDeck({ level }: { level: string }) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language] = useLanguage();
  const { play } = useAudioPlayer();

  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  // The session "stack": cards that are due now plus never-seen cards, built
  // once on load. null = not built yet. Grading removes a card; "move to back"
  // re-queues it within the session.
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [showHarakat, setShowHarakat] = useState(true);
  const [reviewed, setReviewed] = useState(0);
  const builtRef = useRef(false);

  const cardId = useCallback((c: Card) => `ar:${level}:${c.id}`, [level]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      const token = await getAccessToken();
      if (!token) { if (!cancelled) setStatus('locked'); return; }
      try {
        const [deckRes, revRes] = await Promise.all([
          fetch(`/api/content/arabic/flashcards/${level}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/flashcards/reviews?prefix=ar:${level}:`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (cancelled) return;
        if (deckRes.status === 401 || deckRes.status === 402) { setStatus('locked'); return; }
        if (!deckRes.ok) { setStatus('error'); return; }
        const deck = (await deckRes.json()).deck as Deck;
        const dueByCard: Record<string, number> = {};
        if (revRes.ok) {
          for (const r of ((await revRes.json()).reviews ?? []) as { card_id: string; due_at: string }[]) {
            dueByCard[r.card_id] = new Date(r.due_at).getTime();
          }
        }
        const now = Date.now();
        // "Due only": a never-seen card (no row) counts as due immediately.
        const stack = deck.cards.filter((c) => {
          const due = dueByCard[`ar:${level}:${c.id}`];
          return due === undefined || due <= now;
        });
        if (!builtRef.current) { builtRef.current = true; setQueue(stack); }
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [level, getAccessToken, authLoading]);

  const card = queue?.[0];

  const grade = useCallback((g: ArabicGrade) => {
    const c = queue?.[0];
    if (!c) return;
    setFlipped(false);
    setReviewed((n) => n + 1);
    setQueue((q) => (q ? q.slice(1) : q));
    void (async () => {
      const token = await getAccessToken();
      if (!token) return;
      void fetch('/api/arabic/flashcards/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ card_id: cardId(c), grade: g }),
      });
    })();
  }, [queue, getAccessToken, cardId]);

  const moveToBack = useCallback(() => {
    setFlipped(false);
    setQueue((q) => (q && q.length > 1 ? [...q.slice(1), q[0]] : q));
  }, []);

  const speak = useCallback(async (text: string) => {
    const url = await resolveTtsUrlAr(text);
    if (url) play(text, url);
  }, [play]);

  if (authLoading) return <div className="loading-spinner" />;

  const total = (queue?.length ?? 0) + reviewed;
  const t = (uz: string, ru: string, en: string) => ({ uz, ru, en } as Record<string, string>)[language];

  return (
    <>
      {status === 'locked' && <Paywall />}
      <main className="home theme-ar">
        <div className="dr-hero">
          <div className="dr-hero__top-row">
            <Link href="/arabic/flashcards" className="dr-back-btn" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{level.toUpperCase()} · {t('Fleshkartalar', 'Флешкарты', 'Flashcards')}</div>
          </div>
        </div>

        {status === 'loading' && <div className="loading-spinner" />}
        {status === 'error' && <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>Could not load.</div>}

        {status === 'loaded' && card && (
          <section className="home__content ar-fc">
            <div className="ar-fc__progress"><div className="ar-fc__progress-bar" style={{ width: total ? `${(reviewed / total) * 100}%` : '0%' }} /></div>
            <div className="ar-fc__count">{queue?.length} {t('qoldi', 'осталось', 'left')}</div>

            <div className="ar-fc__card-wrap" onClick={() => setFlipped((f) => !f)}>
              <div className={`ar-fc__card ${flipped ? 'ar-fc__card--flipped' : ''}`}>
                <div className="ar-fc__face ar-fc__face--front reader-core--arabic" dir="rtl">
                  <div className="ar-text">{showHarakat ? card.ar : stripHarakat(card.ar)}</div>
                  <div className="ar-translit" dir="ltr">{card.translit}</div>
                  <button type="button" className="ar-fc__audio" onClick={(e) => { e.stopPropagation(); void speak(card.ar); }} aria-label="Play">🔊</button>
                </div>
                <div className="ar-fc__face ar-fc__face--back">
                  <div className="ar-fc__answer">{tr(card, language)}</div>
                </div>
              </div>
            </div>

            <div className="ar-fc__actions">
              <button type="button" className="ar-fc__btn ar-fc__btn--no" onClick={() => grade('dontKnow')}>{t('Bilmayman', 'Не знаю', "Don't know")}</button>
              <button type="button" className="ar-fc__btn ar-fc__btn--yes" onClick={() => grade('know')}>{t('Bilaman', 'Знаю', 'Know')}</button>
            </div>
            <button type="button" className="ar-fc__btn ar-fc__btn--back" onClick={moveToBack}>{t('Oxiriga oʻtkazish', 'В конец стопки', 'Move to back of stack')}</button>

            <nav className="story__bottom-bar">
              <div className="story__bottom-bar-inner">
                <button className={`reader__nav-toggle ${showHarakat ? 'reader__nav-toggle--active' : ''}`} onClick={() => setShowHarakat((v) => !v)} type="button" aria-pressed={showHarakat}>Harakat</button>
              </div>
            </nav>
          </section>
        )}

        {status === 'loaded' && queue && queue.length === 0 && (
          <section className="home__content ar-fc__done">
            <div className="ar-fc__done-title">
              {reviewed > 0 ? t('Tugadi!', 'Готово!', 'Done!') : t('Hozircha takrorlash yoʻq', 'Пока нечего повторять', 'Nothing to repeat right now')}
            </div>
            {reviewed > 0 && (
              <div className="ar-fc__done-stats">{reviewed} {t('ta karta koʻrildi', 'карточек просмотрено', 'cards reviewed')}</div>
            )}
            <Link href="/arabic/flashcards" className="ar-fc__btn ar-fc__btn--yes" style={{ textDecoration: 'none', textAlign: 'center' }}>
              {t('Fleshkartalar', 'К флешкартам', 'Back to flashcards')}
            </Link>
          </section>
        )}
        <PageFooter />
      </main>
    </>
  );
}
