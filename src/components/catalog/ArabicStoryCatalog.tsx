'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { PageFooter } from '@/components/PageFooter';
import { CEFR_LEVELS, type CefrLevel } from './types';
import { ArabicCatalogHeader } from './ArabicCatalogHeader';
import type { ArabicDialogueCardMeta } from '@/services/arabicContent';

type Catalog = Record<string, ArabicDialogueCardMeta[]>;

export function ArabicStoryCatalog({ catalog }: { catalog: Catalog }) {
  const [language] = useLanguage();
  const searchParams = useSearchParams();
  const [level, setLevel] = useState<CefrLevel>(() => {
    const p = searchParams.get('storar');
    if (p && CEFR_LEVELS.includes(p as CefrLevel)) return p as CefrLevel;
    // Default to the first level that actually has stories (A2 for now).
    return CEFR_LEVELS.find((lv) => (catalog[lv]?.length ?? 0) > 0) ?? 'a1';
  });

  const active = catalog[level] ?? [];
  const trOf = (d: ArabicDialogueCardMeta) =>
    language === 'ru' ? d.titleTranslation_ru : language === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;

  return (
    <main className="home theme-ar">
      <ArabicCatalogHeader currentTab="story" />

      <div className="lp__seg-bar">
        <div className="lp__hsk-pills lp__hsk-pills--grid">
          {CEFR_LEVELS.map((lv) => {
            const hasContent = (catalog[lv]?.length ?? 0) > 0;
            return (
              <button
                key={lv}
                type="button"
                disabled={!hasContent}
                onClick={() => {
                  if (hasContent) setLevel(lv);
                }}
                className={`lp__hsk-pill ${level === lv ? 'lp__hsk-pill--active' : ''} ${!hasContent ? 'lp__hsk-pill--disabled' : ''}`}
              >
                {lv.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <section className="home__content">
        <div className="home__lessons">
          {active.map((d) => (
            <Link
              key={d.id}
              href={`/arabic/story/${d.level}/${d.slug}`}
              prefetch={false}
              className="dialogue-card"
            >
              <span className="dialogue-card__deco" aria-hidden="true" dir="rtl">
                {d.title.slice(0, 2)}
              </span>
              <div className="dialogue-card__content">
                <div className="dialogue-card__text">
                  <h3 className="dialogue-card__title" dir="rtl">{d.title}</h3>
                  <p className="dialogue-card__pinyin" dir="ltr">{d.translit}</p>
                  <p className="dialogue-card__translation">{trOf(d)}</p>
                </div>
              </div>
            </Link>
          ))}
          {active.length === 0 && (
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
