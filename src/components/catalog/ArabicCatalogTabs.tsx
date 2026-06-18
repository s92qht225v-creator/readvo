'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';

const TABS = [
  { id: 'dialogues', href: '/arabic/dialogues', uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  { id: 'flashcards', href: '/arabic/flashcards', uz: 'Fleshkarta', ru: 'Флешкарты', en: 'Flashcards' },
] as const;

export function ArabicCatalogTabs({ current }: { current: 'dialogues' | 'flashcards' }) {
  const [language] = useLanguage();
  return (
    <nav className="lp__tabs">
      <div className="lp__tabs-inner">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`lp__tab ${current === t.id ? 'lp__tab--active' : ''}`}
            prefetch={false}
          >
            {(t as Record<string, string>)[language] ?? t.uz}
          </Link>
        ))}
      </div>
    </nav>
  );
}
