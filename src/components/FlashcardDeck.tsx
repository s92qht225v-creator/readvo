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
import { LadderExercise, STAGE_COUNT } from './flashcards/LadderExercise';
import { Confetti } from './flashcards/Confetti';
import { unlockSfx, isMuted, setMuted, playComplete } from '@/utils/sfx';
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

type LadderItem = { word: FlashcardWord; stage: number };

// Drop the current card (index 0) and re-insert `item` at a random spot among
// the rest — NOT at the very back — so cards at different stages interleave
// (the same review type doesn't come in a row). Never index 0 → no immediate
// repeat. A lone remaining card just stays.
function requeue(q: LadderItem[], item: LadderItem): LadderItem[] {
  const rest = q.slice(1);
  if (rest.length === 0) return [item];
  const at = 1 + Math.floor(Math.random() * rest.length); // 1..rest.length
  const next = rest.slice();
  next.splice(at, 0, item);
  return next;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ deck, backHref, lessonTitle, lessonPinyin, lessonTitleTranslation, lessonTitleTranslation_ru }) => {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const trial = useTrial();
  const [language] = useLanguage();

  // Strict-ladder session. Each due/new card must climb all STAGE_COUNT review
  // types (in order) before it graduates. The queue holds {word, stage}; a card
  // re-queues to the back on every answer (interleaved), advancing a stage on a
  // correct one and graduating (leaving + scheduling) after the last stage.
  const [phase, setPhase] = useState<'loading' | 'review' | 'empty'>('loading');
  const [queue, setQueue] = useState<{ word: FlashcardWord; stage: number }[]>([]);
  const [steps, setSteps] = useState(0);       // correct answers (progress)
  const [graduated, setGraduated] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [attempt, setAttempt] = useState(0);   // bumps every answer → fresh exercise mount
  const [isPinyinVisible, setIsPinyinVisible] = useState(true);
  const [muted, setMutedState] = useState(() => isMuted());
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

  // Last-resort fallback: browser speech. Works inside a tap gesture without an
  // awaited URL, so a tap always makes sound even if the network/audio fails.
  const speak = useCallback((text: string) => {
    try {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      if (!synth) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.9;
      synth.speak(u);
    } catch { /* ignore */ }
  }, []);

  // Try to play a URL. Resolves true once it actually plays, false on error /
  // autoplay-block / timeout (and pauses the element so it can't sneak in after
  // a fallback). Callers await this to drive the loading spinner.
  const playUrl = useCallback((url: string) => new Promise<boolean>((resolve) => {
    if (audioRef.current) audioRef.current.pause();
    const el = new Audio(protectAudioUrlSync(url));
    audioRef.current = el;
    let done = false;
    const finish = (ok: boolean) => { if (done) return; done = true; if (!ok) el.pause(); resolve(ok); };
    el.onplaying = () => finish(true);
    el.onerror = () => finish(false);
    el.play().catch(() => finish(false));
    setTimeout(() => finish(false), 6000);
  }), []);

  // Fail-proof card audio: recorded audio / prefetched TTS → on any failure,
  // browser speech. Keeps play() in the tap gesture so mobile can't block it.
  const playCardAudio = useCallback(async (w: FlashcardWord) => {
    const ready = w.audio_url ?? ttsUrlsRef.current[w.id];
    if (ready) {
      if (await playUrl(ready)) return;
      speak(w.text_original);
      return;
    }
    // No ready URL yet: speak now (in the gesture), resolve MiMo TTS in the
    // background so the next play uses the better audio.
    if (audioRef.current) audioRef.current.pause();
    speak(w.text_original);
    void resolveTtsUrl(w.text_original).then((url) => { if (url) ttsUrlsRef.current[w.id] = url; });
  }, [playUrl, speak]);
  useEffect(() => () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }, []);

  // Unlock Web Audio for the sound effects on the first user gesture (iOS).
  useEffect(() => {
    const unlock = () => { unlockSfx(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

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
      setCardCount(stack.length);
      setQueue(stack.map((w) => ({ word: w, stage: 1 })));
      setPhase(stack.length === 0 ? 'empty' : 'review');
    })();
    return () => { cancelled = true; };
  }, [authLoading, deck.id, deck.words, getAccessToken, cardId]);

  const current = queue[0];
  const t = (uz: string, ru: string, en: string) => ({ uz, ru, en } as Record<string, string>)[language];

  // Outcome: correct → advance a stage (re-queue to back) or, after the last
  // stage, graduate (leave + schedule). Wrong → mark missed, re-queue at the
  // SAME stage (no progress lost) so it comes back this session.
  const onResult = useCallback((correct: boolean) => {
    const cur = queue[0];
    if (!cur) return;
    const id = cardId(cur.word);
    setAttempt((a) => a + 1); // force the next exercise to mount fresh
    if (!correct) {
      missedRef.current.add(id);
      setQueue((q) => requeue(q, { word: cur.word, stage: cur.stage }));
      return;
    }
    setSteps((n) => n + 1);
    if (cur.stage < STAGE_COUNT) {
      setQueue((q) => requeue(q, { word: cur.word, stage: cur.stage + 1 }));
      return;
    }
    // Graduated: passed every stage → schedule (sooner if it was ever missed).
    setGraduated((n) => n + 1);
    setQueue((q) => q.slice(1));
    if (queue.length === 1) playComplete(); // this was the last card → session done
    if (tokenRef.current) {
      const g: ArabicGrade = missedRef.current.has(id) ? 'dontKnow' : 'know';
      fetch('/api/flashcards/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ card_id: id, grade: g }),
      }).catch(() => {});
    }
  }, [queue, cardId]);

  if (authLoading) return <div className="loading-spinner" />;
  const isFreeContent = deck.id.startsWith('topic-') || deck.words[0]?.lesson === 1;
  const showPaywall = trial?.isTrialExpired && !isFreeContent;
  const stepsTotal = cardCount * STAGE_COUNT;

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

        {phase === 'review' && current && (
          <section className="home__content ar-fc">
            <div className="ar-fc__progress"><div className="ar-fc__progress-bar" style={{ width: stepsTotal ? `${(steps / stepsTotal) * 100}%` : '0%' }} /></div>
            <div className="ar-fc__count">{graduated} / {cardCount}</div>

            <LadderExercise
              key={`${cardId(current.word)}:${current.stage}:${attempt}`}
              stage={current.stage}
              card={current.word}
              deck={deck.words}
              language={language}
              showPinyin={isPinyinVisible}
              onAudio={() => playCardAudio(current.word)}
              onResult={onResult}
            />

            <nav className="story__bottom-bar">
              <div className="story__bottom-bar-inner">
                <button className={`reader__nav-toggle ${isPinyinVisible ? 'reader__nav-toggle--active' : ''}`} onClick={() => setIsPinyinVisible((p) => !p)} type="button">Pinyin</button>
                <button className="reader__nav-toggle" onClick={() => { const m = !muted; setMuted(m); setMutedState(m); }} type="button" aria-label="Sound on/off">{muted ? '🔇' : '🔊'}</button>
              </div>
            </nav>
          </section>
        )}

        {(phase === 'empty' || (phase === 'review' && queue.length === 0)) && (
          <section className="home__content ar-fc__done">
            {graduated > 0 && <Confetti />}
            <div className="ar-fc__done-title">
              {graduated > 0 ? t('Barakalla! 🎉', 'Отлично! 🎉', 'Well done! 🎉') : t('Hozircha takrorlash yoʻq', 'Пока нечего повторять', 'Nothing to repeat right now')}
            </div>
            {graduated > 0 && (
              <div className="ar-fc__done-stats">{graduated} {t('ta soʻz oʻrganildi', 'слов выучено', 'words learned')}</div>
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
