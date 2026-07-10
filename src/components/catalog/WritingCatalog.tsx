'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useClientSearchParam } from '../../hooks/useClientSearchParam';
import { useLanguage } from '../../hooks/useLanguage';
import { useStars } from '../../hooks/useStars';
import { useScrollRestore } from '../../hooks/useScrollRestore';
import { CatalogHeader } from './CatalogHeader';
import { PageFooter } from '../PageFooter';
import { parseHskLevel, type HskLevel, type WritingSetMeta } from './types';
import { prefetchHanzi } from '@/utils/hanziStrokes';
import { trackAll } from '@/utils/analytics';

interface Props {
  writingSets: WritingSetMeta[];
  writingSetsHsk2: WritingSetMeta[];
  writingSetsHsk2L2: WritingSetMeta[];
  writingSetsHsk3: WritingSetMeta[];
  writingSetsHsk4: WritingSetMeta[];
  writingSetsHsk5: WritingSetMeta[];
  writingSetsHsk6: WritingSetMeta[];
}

export function WritingCatalog({ writingSets, writingSetsHsk2, writingSetsHsk2L2, writingSetsHsk3, writingSetsHsk4, writingSetsHsk5, writingSetsHsk6 }: Props) {
  // Public catalog — practice pages behind it are gated server-side by
  // src/proxy.ts. Client auth gating blanked the SSG HTML for crawlers.
  const [language] = useLanguage();
  const { getStars: getWritingStars } = useStars('writing');

  // Writing tab state. HSK 3.0 is hidden — writing shows HSK 2.0 levels 1-6
  // only, so the version is pinned to '2.0' (no version toggle).
  const [hskVersion] = useState<'3.0' | '2.0'>('2.0');
  // ?hsk=N deep-link read client-side only (useSearchParams would opt the
  // static page out of prerendering). SSG HTML shows HSK 1.
  const [writingHskLevel, setWritingHskLevel] = useState<HskLevel>('1');
  const hskParam = useClientSearchParam('hsk');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after mount
    if (hskParam) setWritingHskLevel(parseHskLevel(hskParam));
  }, [hskParam]);
  const [writingSearch, setWritingSearch] = useState('');

  // On the Writing tab, warm the stroke data for the first character of each
  // listed set. By the time the user taps a set card the glyph is cached, so
  // the practice canvas renders it immediately instead of showing the "..."
  // loader while it fetches from the CDN.
  useEffect(() => {
    const sets = hskVersion === '3.0' ? writingSets
      : writingHskLevel === '6' ? writingSetsHsk6
      : writingHskLevel === '5' ? writingSetsHsk5
      : writingHskLevel === '4' ? writingSetsHsk4
      : writingHskLevel === '3' ? writingSetsHsk3
      : writingHskLevel === '2' ? writingSetsHsk2L2
      : writingSetsHsk2;
    prefetchHanzi(sets.map(s => [...s.chars][0]).filter(Boolean) as string[]);
  }, [hskVersion, writingHskLevel, writingSets, writingSetsHsk2, writingSetsHsk2L2, writingSetsHsk3, writingSetsHsk4, writingSetsHsk5, writingSetsHsk6]);

  // Meta Pixel / Yandex / GA4: debounced writing-search tracking (parity with LanguagePage).
  useEffect(() => {
    const q = writingSearch.trim();
    if (!q) return;
    const t = setTimeout(() => trackAll('Search', 'search', 'search', { search_string: q }), 800);
    return () => clearTimeout(t);
  }, [writingSearch]);

  const activeSets = hskVersion === '3.0' ? writingSets
    : writingHskLevel === '6' ? writingSetsHsk6
    : writingHskLevel === '5' ? writingSetsHsk5
    : writingHskLevel === '4' ? writingSetsHsk4
    : writingHskLevel === '3' ? writingSetsHsk3
    : writingHskLevel === '2' ? writingSetsHsk2L2
    : writingSetsHsk2;

  const wq = writingSearch.trim().toLowerCase();
  // Toneless form so typing pinyin without tone marks still matches
  // (NFD decomposes the tone diacritic AND ü's diaeresis into
  // combining marks, which we strip — wǒ→wo, nǚ→nu).
  const wqToneless = wq.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredSets = wq
    ? activeSets.filter((s) =>
        s.title.toLowerCase().includes(wq) ||
        s.title_ru.toLowerCase().includes(wq) ||
        s.chars.includes(wq) ||
        s.subtitle.toLowerCase().includes(wq) ||
        (!!s.pinyin && s.pinyin.includes(wqToneless))
      )
    : activeSets;

  const saveScroll = useScrollRestore('writing-scroll', writingHskLevel, filteredSets.length > 0);

  return (
    <main className="home">
      <CatalogHeader currentTab="writing" hskLevel={hskVersion === '2.0' ? writingHskLevel : '1'} />

      {/* HSK level pills — writing portion (verbatim from LanguagePage, writing-only logic) */}
      <div className="lp__seg-bar">
        <div className="lp__hsk-pills lp__hsk-pills--grid">
          {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'] as const).map((lv) => {
            const hasContent = lv === 'HSK 1' || (hskVersion === '2.0' && (lv === 'HSK 2' || lv === 'HSK 3' || lv === 'HSK 4' || lv === 'HSK 5' || lv === 'HSK 6'));
            const isActive = hskVersion === '2.0'
              ? (lv === 'HSK 1' && writingHskLevel === '1') || (lv === 'HSK 2' && writingHskLevel === '2') || (lv === 'HSK 3' && writingHskLevel === '3') || (lv === 'HSK 4' && writingHskLevel === '4') || (lv === 'HSK 5' && writingHskLevel === '5') || (lv === 'HSK 6' && writingHskLevel === '6')
              : hasContent;
            return (
              <button
                key={lv}
                type="button"
                disabled={!hasContent}
                onClick={() => {
                  if (hasContent && hskVersion === '2.0') {
                    const level: HskLevel = lv === 'HSK 2' ? '2' : lv === 'HSK 3' ? '3' : lv === 'HSK 4' ? '4' : lv === 'HSK 5' ? '5' : lv === 'HSK 6' ? '6' : '1';
                    setWritingHskLevel(level);
                    // Persist the active tab so browser Back reopens the same level.
                    const url = new URL(window.location.href);
                    if (level === '1') url.searchParams.delete('hsk');
                    else url.searchParams.set('hsk', level);
                    window.history.replaceState(null, '', url.toString());
                  }
                }}
                className={`lp__hsk-pill ${isActive ? 'lp__hsk-pill--active' : ''} ${!hasContent ? 'lp__hsk-pill--disabled' : ''}`}
              >
                {lv}
              </button>
            );
          })}
        </div>
      </div>

      {/* Writing content */}
      <section className="home__content">
        <div className="dialogues__search">
          <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="dialogues__search-input"
            aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
            placeholder={({ uz: 'Belgilarni qidirish...', ru: 'Поиск иероглифов...', en: 'Search characters...' } as Record<string, string>)[language]}
            value={writingSearch}
            onChange={(e) => setWritingSearch(e.target.value)}
          />
        </div>
        <div className="lp__writing-sets">
          {filteredSets.map((set) => {
            const isEmpty = set.chars.length === 0;
            // Title/subtitle are derived generically (same pattern as the
            // flashcard cards below) rather than string-replacing the
            // Russian fields — that hack left Russian text on every set
            // whose title_ru wasn't literally "Набор N" (e.g. HSK 3-6
            // sets where title_ru holds the char list).
            const num = activeSets.indexOf(set) + 1;
            const title = ({ uz: `${num}-to'plam`, ru: `Набор ${num}`, en: `Set ${num}` } as Record<string, string>)[language];
            const sub = `${set.wordCount || 10} ${({ uz: "ta so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language]}`;
            const inner = (
              <>
                <div className="lp__writing-card-deco" aria-hidden="true">{isEmpty ? '🔒' : set.chars.slice(0, 2)}</div>
                <div className="lp__writing-card__title">{title}</div>
                <div className="lp__writing-card__sub">{isEmpty ? ({ uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' } as Record<string, string>)[language] : sub}</div>
                {!isEmpty && (() => {
                  // No star row until attempted; gold for earned count.
                  const wStars = getWritingStars(set.id);
                  if (wStars == null) return null;
                  return (
                    <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                      {[1, 2, 3].map(n => (
                        <span key={n} style={{ fontSize: 28, color: n <= wStars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>★</span>
                      ))}
                    </div>
                  );
                })()}
              </>
            );
            return isEmpty ? (
              <div key={set.id} className="lp__writing-card lp__writing-card--soon">
                {inner}
              </div>
            ) : (
              <Link key={set.id} className="lp__writing-card" href={`/chinese/writing/hsk${writingHskLevel}/set${set.id.split('-set').pop()}`} prefetch={false} onClick={saveScroll}>
                {inner}
              </Link>
            );
          })}
          {filteredSets.length === 0 && (
            <p className="dialogues__empty">{({ uz: 'Hech narsa topilmadi', ru: 'Ничего не найдено', en: 'Nothing found' } as Record<string, string>)[language]}</p>
          )}
        </div>
      </section>

      {/* Logo moves to the footer on mobile (the hero is hidden there). */}
      <Link href="/" className="lp__footer-logo" aria-label="Blim">
        <Image src="/logo-red.svg" alt="Blim" width={72} height={25} />
      </Link>
      <PageFooter />
    </main>
  );
}
