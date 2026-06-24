'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { PageFooter } from '@/components/PageFooter';
import { CEFR_LEVELS, type CefrLevel } from './types';
import { ArabicCatalogHeader } from './ArabicCatalogHeader';

/**
 * Arabic Stories catalog. No story content exists yet, so this renders the
 * shared Arabic catalog chrome (slim hero + icon tab bar + CEFR level pills)
 * with a "coming soon" placeholder. Wire real content in when stories ship.
 */
export function ArabicStoryCatalog() {
  const [language] = useLanguage();
  const [level, setLevel] = useState<CefrLevel>('a1');
  const msg = ({ uz: 'Hikoyalar tez kunda', ru: 'Истории скоро', en: 'Stories coming soon' } as Record<string, string>)[language];
  return (
    <main className="home theme-ar">
      <ArabicCatalogHeader currentTab="story" />

      <div className="lp__seg-bar">
        <div className="lp__hsk-pills lp__hsk-pills--grid">
          {CEFR_LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={`lp__hsk-pill ${level === lv ? 'lp__hsk-pill--active' : ''}`}
            >
              {lv.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <section className="home__content">
        <p className="lang-page__placeholder">{msg}</p>
      </section>
      <PageFooter />
    </main>
  );
}
