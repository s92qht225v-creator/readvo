'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useSavedVocab, type SavedWord } from '../hooks/useSavedVocab';
import { shuffleArray } from '@/utils/shuffle';
import { PageFooter } from './PageFooter';

const meaningOf = (w: SavedWord, l: string) => (l === 'ru' ? w.ru : l === 'en' ? (w.en || w.uz) : w.uz);

/**
 * "My Vocabulary" review deck — a simple swipeable stack of the words the user
 * saved from dialogue Words tabs. Tap a card to flip (汉字 ⇄ meaning), swipe or
 * use ‹ › to move, and Remove to drop a word from the deck. Account-synced via
 * useSavedVocab → /api/vocab. No SRS — pure review.
 */
export function VocabularyReview() {
  const [language] = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const { words, loading, remove } = useSavedVocab();

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  // Shuffle the saved words once per visit (seed the random order into a ref the
  // first time they load), so the deck isn't the same fixed newest-first list
  // every time. `deck` reconciles that frozen order against the live `words`:
  // removing a card drops it and KEEPS the rest in place (no reshuffle), and any
  // word not in the seed is appended. Fresh order on the next visit (remount).
  const orderRef = useRef<string[] | null>(null);
  const key = (w: SavedWord) => `${w.zh}|${w.py}`;
  if (orderRef.current === null && !loading && words.length > 0) {
    orderRef.current = shuffleArray(words).map(key);
  }
  const deck = useMemo(() => {
    if (!orderRef.current) return words;
    const byKey = new Map(words.map((w) => [key(w), w]));
    const out = orderRef.current.map((k) => byKey.get(k)).filter(Boolean) as SavedWord[];
    const seeded = new Set(orderRef.current);
    for (const w of words) if (!seeded.has(key(w))) out.push(w);
    return out;
  }, [words]);

  // Keep idx in range as the deck shrinks (removal) or on first load.
  useEffect(() => {
    if (idx > deck.length - 1) setIdx(Math.max(0, deck.length - 1));
  }, [deck.length, idx]);

  const t = (uz: string, ru: string, en: string) => ({ uz, ru, en } as Record<string, string>)[language];

  const go = (delta: number) => {
    setFlipped(false);
    setIdx((i) => Math.min(deck.length - 1, Math.max(0, i + delta)));
  };

  const onPointerDown = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; moved.current = false; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { moved.current = true; go(dx < 0 ? 1 : -1); }
  };
  const onCardClick = () => { if (!moved.current) setFlipped((f) => !f); };

  const removeCurrent = async () => {
    const w = deck[idx];
    if (!w) return;
    setFlipped(false);
    await remove(w.zh, w.py);
  };

  const header = (
    <div className="vr-header">
      <Link href="/chinese/vocabulary" className="vr-back" aria-label={t('Orqaga', 'Назад', 'Back')} onClick={(e) => { e.preventDefault(); router.push('/chinese/dialogues'); }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </Link>
      <h1 className="vr-title">{t("Mening lug'atim", 'Мой словарь', 'My Vocabulary')}</h1>
      <span className="vr-back" aria-hidden="true" />
    </div>
  );

  let body: React.ReactNode;
  if (!user) {
    body = (
      <div className="vr-empty">
        <p>{t("Lug'atingizni saqlash uchun tizimga kiring.", 'Войдите, чтобы сохранять слова.', 'Log in to save your vocabulary.')}</p>
        <Link href="/login" className="vr-cta">{t('Kirish', 'Войти', 'Log in')}</Link>
      </div>
    );
  } else if (loading) {
    body = <div className="vr-empty"><span className="vr-spinner" aria-hidden="true" /></div>;
  } else if (words.length === 0) {
    body = (
      <div className="vr-empty">
        <p>{t("Hali so'z yo'q. Dialog o'qiyotganda “+” tugmasi bilan so'z qo'shing.", 'Пока нет слов. Добавляйте их кнопкой «+» в диалогах.', 'No words yet. Add them with the “+” button while reading dialogues.')}</p>
        <Link href="/chinese/dialogues" className="vr-cta">{t('Dialoglarga', 'К диалогам', 'Browse dialogues')}</Link>
      </div>
    );
  } else {
    const w = deck[Math.min(idx, deck.length - 1)];
    body = (
      <div className="vr-deck">
        <div className="vr-counter">{idx + 1} / {deck.length}</div>
        <div
          className={`vr-card ${flipped ? 'vr-card--flipped' : ''}`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onClick={onCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); } }}
        >
          <div className="vr-card__inner">
            <div className="vr-card__face vr-card__front">
              <span className="vr-card__py">{w.py}</span>
              <span className="vr-card__zh" lang="zh-Hans">{w.zh}</span>
              <span className="vr-card__hint">{t('bosing', 'нажмите', 'tap')}</span>
            </div>
            <div className="vr-card__face vr-card__back">
              <span className="vr-card__meaning">{meaningOf(w, language)}</span>
            </div>
          </div>
        </div>
        <div className="vr-controls">
          <button type="button" className="vr-nav" onClick={() => go(-1)} disabled={idx === 0} aria-label={t('Oldingi', 'Предыдущее', 'Previous')}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button type="button" className="vr-remove" onClick={removeCurrent}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
            {t("O'chirish", 'Убрать', 'Remove')}
          </button>
          <button type="button" className="vr-nav" onClick={() => go(1)} disabled={idx >= deck.length - 1} aria-label={t('Keyingi', 'Следующее', 'Next')}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="vocab-review">
      {header}
      {body}
      <PageFooter />
    </main>
  );
}
