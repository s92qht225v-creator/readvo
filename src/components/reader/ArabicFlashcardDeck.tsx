'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

  const [deck, setDeck] = useState<Deck | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHarakat, setShowHarakat] = useState(true);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/arabic/flashcards/${level}`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        setDeck(data.deck as Deck);
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [level, getAccessToken, authLoading]);

  const cards = deck?.cards ?? [];
  const card = cards[idx];

  const advance = useCallback((wasKnown: boolean) => {
    if (wasKnown) setKnown((k) => k + 1);
    setFlipped(false);
    if (idx + 1 >= cards.length) setDone(true);
    else setIdx((i) => i + 1);
  }, [idx, cards.length]);

  const restart = useCallback(() => { setIdx(0); setFlipped(false); setKnown(0); setDone(false); }, []);

  const speak = useCallback(async (text: string) => {
    const url = await resolveTtsUrlAr(text);
    if (url) play(text, url);
  }, [play]);

  if (authLoading) return <div className="loading-spinner" />;

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
            <div className="dr-hero__level">{level.toUpperCase()} · {({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[language]}</div>
          </div>
        </div>

        {status === 'loading' && <div className="loading-spinner" />}
        {status === 'error' && <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>Could not load.</div>}

        {status === 'loaded' && deck && !done && card && (
          <section className="home__content ar-fc">
            <div className="ar-fc__progress"><div className="ar-fc__progress-bar" style={{ width: `${(idx / cards.length) * 100}%` }} /></div>
            <div className="ar-fc__count">{idx + 1} / {cards.length}</div>

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
              <button type="button" className="ar-fc__btn ar-fc__btn--no" onClick={() => advance(false)}>{({ uz: 'Bilmayman', ru: 'Не знаю', en: "Don't know" } as Record<string, string>)[language]}</button>
              <button type="button" className="ar-fc__btn ar-fc__btn--yes" onClick={() => advance(true)}>{({ uz: 'Bilaman', ru: 'Знаю', en: 'Know' } as Record<string, string>)[language]}</button>
            </div>

            <nav className="story__bottom-bar">
              <div className="story__bottom-bar-inner">
                <button className={`reader__nav-toggle ${showHarakat ? 'reader__nav-toggle--active' : ''}`} onClick={() => setShowHarakat((v) => !v)} type="button" aria-pressed={showHarakat}>Harakat</button>
              </div>
            </nav>
          </section>
        )}

        {status === 'loaded' && done && (
          <section className="home__content ar-fc__done">
            <div className="ar-fc__done-title">{({ uz: 'Tugadi!', ru: 'Готово!', en: 'Done!' } as Record<string, string>)[language]}</div>
            <div className="ar-fc__done-stats">{known} / {cards.length} {({ uz: 'bilingan', ru: 'известно', en: 'known' } as Record<string, string>)[language]}</div>
            <button type="button" className="ar-fc__btn ar-fc__btn--yes" onClick={restart}>{({ uz: 'Qaytadan', ru: 'Заново', en: 'Restart' } as Record<string, string>)[language]}</button>
          </section>
        )}
        <PageFooter />
      </main>
    </>
  );
}
