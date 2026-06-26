'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { PageFooter } from '@/components/PageFooter';
import { ArabicCatalogHeader } from './ArabicCatalogHeader';

export function ArabicFlashcardsCatalog({ decks }: { decks: { level: string; count: number }[] }) {
  const [language] = useLanguage();
  const { getAccessToken } = useAuth();
  const wordsLabel = ({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language];

  // Levels that have at least one card due for repeat now → show a green dot.
  const [dueLevels, setDueLevels] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;
      try {
        const res = await fetch('/api/flashcards/reviews?prefix=ar:', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok || cancelled) return;
        const now = Date.now();
        const due = new Set<string>();
        for (const r of ((await res.json()).reviews ?? []) as { card_id: string; due_at: string }[]) {
          if (new Date(r.due_at).getTime() <= now) {
            const lvl = r.card_id.split(':')[1]; // card_id = ar:{level}:{cardId}
            if (lvl) due.add(lvl);
          }
        }
        if (!cancelled) setDueLevels(due);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  return (
    <main className="home theme-ar">
      <ArabicCatalogHeader currentTab="flashcards" />

      <section className="home__content">
        <div className="home__lessons">
          {decks.map((d) => (
            <Link
              key={d.level}
              href={`/arabic/flashcards/${d.level}`}
              prefetch={false}
              className="dialogue-card ar-fc-card"
            >
              {dueLevels.has(d.level) && (
                <span className="ar-fc__due-dot" aria-label={({ uz: 'Takrorlash vaqti', ru: 'Пора повторить', en: 'Due for review' } as Record<string, string>)[language]} />
              )}
              <div className="dialogue-card__content">
                <div className="dialogue-card__text">
                  <h3 className="dialogue-card__title">{d.level.toUpperCase()}</h3>
                  <p className="dialogue-card__translation">
                    {d.count} {wordsLabel}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {decks.length === 0 && (
            <p className="dialogues__empty">
              {({ uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' } as Record<string, string>)[language]}
            </p>
          )}
        </div>
      </section>

      <PageFooter />
    </main>
  );
}
