'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { PageFooter } from '@/components/PageFooter';
import { ArabicCatalogHeader } from './ArabicCatalogHeader';

export function ArabicFlashcardsCatalog({ decks }: { decks: { level: string; count: number }[] }) {
  const [language] = useLanguage();
  const wordsLabel = ({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language];
  return (
    <main className="home">
      <ArabicCatalogHeader currentTab="flashcards" />

      <section className="home__content">
        <div className="home__lessons">
          {decks.map((d) => (
            <Link
              key={d.level}
              href={`/arabic/flashcards/${d.level}`}
              prefetch={false}
              className="dialogue-card"
            >
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
