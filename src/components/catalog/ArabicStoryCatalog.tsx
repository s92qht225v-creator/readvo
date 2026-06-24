'use client';

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { PageFooter } from '@/components/PageFooter';
import { ArabicCatalogHeader } from './ArabicCatalogHeader';

/**
 * Arabic Stories catalog. No story content exists yet, so this renders the
 * shared Arabic catalog chrome (slim hero + icon tab bar) with a "coming soon"
 * placeholder. Wire real content in when the Arabic stories ship.
 */
export function ArabicStoryCatalog() {
  const [language] = useLanguage();
  const msg = ({ uz: 'Hikoyalar tez kunda', ru: 'Истории скоро', en: 'Stories coming soon' } as Record<string, string>)[language];
  return (
    <main className="home theme-ar">
      <ArabicCatalogHeader currentTab="story" />
      <section className="home__content">
        <p className="lang-page__placeholder">{msg}</p>
      </section>
      <PageFooter />
    </main>
  );
}
