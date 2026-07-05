'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useClientSearchParam } from '../../hooks/useClientSearchParam';
import { useLanguage } from '../../hooks/useLanguage';
import { useStars } from '../../hooks/useStars';
import { CatalogHeader } from './CatalogHeader';
import { PageFooter } from '../PageFooter';
import { TAGS, BOOKMARK_KEY, parseHskLevel, type HskLevel } from './types';
import type { DialogueInfo } from '../../services/dialogues';
import { trackAll } from '@/utils/analytics';

interface Props {
  dialogues: DialogueInfo[];
  dialoguesHsk2: DialogueInfo[];
  dialoguesHsk3: DialogueInfo[];
  dialoguesHsk4: DialogueInfo[];
  dialoguesHsk5: DialogueInfo[];
  dialoguesHsk6: DialogueInfo[];
}

export function DialoguesCatalog({ dialogues, dialoguesHsk2, dialoguesHsk3, dialoguesHsk4, dialoguesHsk5, dialoguesHsk6 }: Props) {
  // This catalog is public: it lists titles/levels only, and clicking through
  // to a reader hits the server-side auth gate in src/proxy.ts. No client
  // auth gate here — it blanked the page for crawlers (SSG HTML was just a
  // spinner) and bounced anonymous visitors who could have seen the catalog.
  const [language] = useLanguage();
  const { getStars: getDialogueStars } = useStars('dialogue');

  // Dialogue filters
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  // HSK level deep-link (?dialhsk=N, used by reader back-buttons). Read
  // client-side only — useSearchParams would opt the static page out of
  // prerendering. SSG HTML always shows HSK 1.
  const [dialogueHskLevel, setDialogueHskLevel] = useState<HskLevel>('1');
  const dialhskParam = useClientSearchParam('dialhsk');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after mount
    if (dialhskParam) setDialogueHskLevel(parseHskLevel(dialhskParam));
  }, [dialhskParam]);
  // localStorage is client-only; initializing state from it during hydration
  // would mismatch the server HTML. Load after mount instead.
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time bootstrap from localStorage on mount
      if (saved) setBookmarks(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  // Meta Pixel / Yandex / GA4: debounced dialogue-search tracking (parity with LanguagePage).
  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    const t = setTimeout(() => trackAll('Search', 'search', 'search', { search_string: q }), 800);
    return () => clearTimeout(t);
  }, [search]);

  const toggleBookmark = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const activeDialogues = dialogueHskLevel === '6' ? dialoguesHsk6 : dialogueHskLevel === '5' ? dialoguesHsk5 : dialogueHskLevel === '4' ? dialoguesHsk4 : dialogueHskLevel === '3' ? dialoguesHsk3 : dialogueHskLevel === '2' ? dialoguesHsk2 : dialogues;

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    activeDialogues.forEach((d) => { if (d.tag) tagSet.add(d.tag); });
    return Object.keys(TAGS).filter((t) => tagSet.has(t));
  }, [activeDialogues]);

  const filteredDialogues = useMemo(() => {
    let result = activeDialogues;
    if (showBookmarked) result = result.filter((d) => bookmarks.has(d.id));
    if (activeTag) result = result.filter((d) => d.tag === activeTag);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.pinyin.toLowerCase().includes(q) ||
      d.titleTranslation.toLowerCase().includes(q)
    );
    return result;
  }, [search, activeDialogues, activeTag, showBookmarked, bookmarks]);

  return (
    <main className="home">
      <CatalogHeader currentTab="dialogues" hskLevel={dialogueHskLevel} />

      {/* HSK level pills */}
      <div className="lp__seg-bar">
        <div className="lp__hsk-pills lp__hsk-pills--grid">
          {(['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'] as const).map((lv) => {
            const hasContent = lv === 'HSK 1'
              || (lv === 'HSK 2' && dialoguesHsk2.length > 0)
              || (lv === 'HSK 3' && dialoguesHsk3.length > 0)
              || (lv === 'HSK 4' && dialoguesHsk4.length > 0)
              || (lv === 'HSK 5' && dialoguesHsk5.length > 0)
              || (lv === 'HSK 6' && dialoguesHsk6.length > 0);
            const isActive =
              (lv === 'HSK 1' && dialogueHskLevel === '1') ||
              (lv === 'HSK 2' && dialogueHskLevel === '2') ||
              (lv === 'HSK 3' && dialogueHskLevel === '3') ||
              (lv === 'HSK 4' && dialogueHskLevel === '4') ||
              (lv === 'HSK 5' && dialogueHskLevel === '5') ||
              (lv === 'HSK 6' && dialogueHskLevel === '6');
            return (
              <button
                key={lv}
                type="button"
                disabled={!hasContent}
                onClick={() => {
                  if (hasContent) {
                    setDialogueHskLevel(lv === 'HSK 6' ? '6' : lv === 'HSK 5' ? '5' : lv === 'HSK 4' ? '4' : lv === 'HSK 3' ? '3' : lv === 'HSK 2' ? '2' : '1');
                    setActiveTag(null);
                    setShowBookmarked(false);
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

      {/* Content */}
      <section className="home__content">
        {/* Search */}
        <div className="dialogues__search">
          <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="dialogues__search-input"
            aria-label={({ uz: 'Qidirish', ru: 'Поиск', en: 'Search' } as Record<string, string>)[language]}
            placeholder={({ uz: 'Dialoglarni qidirish...', ru: 'Поиск диалогов...', en: 'Search dialogues...' } as Record<string, string>)[language]}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="dialogues__search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Tag chips */}
        <div className="dialogues__tags">
          <button
            className={`dialogues__tag ${!activeTag && !showBookmarked ? 'dialogues__tag--active' : ''}`}
            onClick={() => { setActiveTag(null); setShowBookmarked(false); }}
            type="button"
          >
            {({ uz: 'Hammasi', ru: 'Все', en: 'All' } as Record<string, string>)[language]}
          </button>
          <button
            className={`dialogues__tag dialogues__tag--bookmark ${showBookmarked ? 'dialogues__tag--active' : ''}`}
            onClick={() => { setShowBookmarked(!showBookmarked); setActiveTag(null); }}
            type="button"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill={showBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {({ uz: 'Saqlangan', ru: 'Сохранённые', en: 'Saved' } as Record<string, string>)[language]}
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              className={`dialogues__tag ${activeTag === tag ? 'dialogues__tag--active' : ''}`}
              onClick={() => { setActiveTag(activeTag === tag ? null : tag); setShowBookmarked(false); }}
              type="button"
            >
              {(TAGS[tag] as Record<string, string>)[language] ?? TAGS[tag].uz}
            </button>
          ))}
        </div>

        {/* Dialogue cards */}
        <div className="home__lessons">
          {filteredDialogues.map((d) => (
            <Link key={d.id} href={`/chinese/dialogues/hsk${dialogueHskLevel}/${d.slug}`} prefetch={false} className={`dialogue-card${d.image ? ' dialogue-card--has-image' : ''}`}>
              {d.image ? (
                <span className="dialogue-card__thumb" aria-hidden="true">
                  <Image src={d.image} alt="" fill sizes="120px" style={{ objectFit: 'cover' }} />
                </span>
              ) : (
                <span className="dialogue-card__deco" aria-hidden="true">{d.title.slice(0, 3)}</span>
              )}
              <div className="dialogue-card__content">
                <div className="dialogue-card__text">
                  <h3 className="dialogue-card__title">{d.title}</h3>
                  <p className="dialogue-card__pinyin">{d.pinyin}</p>
                  <p className="dialogue-card__translation">{language === 'ru' ? d.titleTranslation_ru : language === 'en' ? (d.titleTranslation_en || d.titleTranslation) : d.titleTranslation}</p>
                  {(() => {
                    // No star row until the user has actually attempted
                    // this item; gold for the earned count once they have.
                    const stars = getDialogueStars(d.id);
                    if (stars == null) return null;
                    return (
                      <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                        {[1, 2, 3].map(n => (
                          <span key={n} style={{ fontSize: 28, color: n <= stars ? '#f59e0b' : 'rgba(0,0,0,0.05)' }}>★</span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <button
                  className={`dialogue-card__bookmark ${bookmarks.has(d.id) ? 'dialogue-card__bookmark--active' : ''}`}
                  onClick={(e) => toggleBookmark(e, d.id)}
                  aria-label="Bookmark"
                  type="button"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={bookmarks.has(d.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
              {d.tag && TAGS[d.tag] && (
                /* Defensive: only render the tag pill when TAGS knows
                   about it. Without the `TAGS[d.tag] &&` guard, a
                   dialogue with an unrecognised `tag` (e.g. a new
                   category authored in content but not yet added to
                   this dictionary) would throw "Cannot read properties
                   of undefined (reading '<lang>')" on the language
                   page render and break the entire dialogues tab. */
                <span className="dialogue-card__tag">{(TAGS[d.tag] as Record<string, string>)[language] ?? TAGS[d.tag].uz}</span>
              )}
            </Link>
          ))}
          {filteredDialogues.length === 0 && (
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
