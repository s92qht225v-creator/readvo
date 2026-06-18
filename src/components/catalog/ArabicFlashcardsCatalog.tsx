'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { ArabicCatalogTabs } from './ArabicCatalogTabs';

export function ArabicFlashcardsCatalog({ decks }: { decks: { level: string; count: number }[] }) {
  const [language] = useLanguage();
  const wordsLabel = ({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language];
  return (
    <main className="home">
      <header className="home__hero" dir="ltr">
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo" aria-label="Blim">
              <Image src="/logo.svg" alt="Blim" width={64} height={28} className="home__hero-logo-img" />
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">
              {({ uz: 'Arab tili', ru: 'Арабский', en: 'Arabic' } as Record<string, string>)[language]}
            </div>
            {/* vowelized بِطَاقَات with harakat as numeric character entities */}
            <h1 className="dr-hero__title" dir="rtl">
              &#x0628;&#x0650;&#x0637;&#x064E;&#x0627;&#x0642;&#x064E;&#x0627;&#x062A;
            </h1>
            <div className="dr-hero__pinyin" dir="ltr">bita&#772;qa&#772;t</div>
          </div>
        </div>
      </header>

      <ArabicCatalogTabs current="flashcards" />

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
