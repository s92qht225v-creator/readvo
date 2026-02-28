'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { BannerMenu } from './BannerMenu';

const TAGS: Record<string, { uz: string; ru: string }> = {
  tanishuv: { uz: 'Tanishuv', ru: 'Знакомство' },
  kundalik: { uz: 'Kundalik', ru: 'Повседневное' },
  xaridlar: { uz: 'Xaridlar', ru: 'Покупки' },
  ovqat: { uz: 'Ovqat', ru: 'Еда' },
  salomatlik: { uz: 'Salomatlik', ru: 'Здоровье' },
  transport: { uz: 'Transport', ru: 'Транспорт' },
  telefon: { uz: 'Telefon', ru: 'Телефон' },
  ish: { uz: 'Ish/O\'qish', ru: 'Работа/Учёба' },
  reja: { uz: 'Reja', ru: 'Планы' },
  muloqot: { uz: 'Muloqot', ru: 'Общение' },
};

const BOOKMARK_KEY = 'blim-dialogue-bookmarks';
const SEEN_KEY = 'blim-dialogue-seen';
const LAST_VISITED_KEY = 'blim-dialogue-last-visited';
const NEW_DAYS = 3;

function isNew(dateAdded?: string, seen?: Set<string>, id?: string): boolean {
  if (!dateAdded) return false;
  if (seen && id && seen.has(id)) return false;
  const added = new Date(dateAdded).getTime();
  const now = Date.now();
  return (now - added) < NEW_DAYS * 24 * 60 * 60 * 1000;
}

interface DialogueItem {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  tag?: string;
  dateAdded?: string;
}

interface DialoguesPageProps {
  dialogues: DialogueItem[];
  bookPath: string;
  languagePath: string;
}

export function DialoguesPage({ dialogues, bookPath, languagePath }: DialoguesPageProps) {
  const [language] = useLanguage();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY);
      if (saved) setBookmarks(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
    try {
      const savedSeen = localStorage.getItem(SEEN_KEY);
      if (savedSeen) setSeen(new Set(JSON.parse(savedSeen)));
    } catch { /* ignore */ }

    // Scroll to last visited dialogue
    const lastVisited = sessionStorage.getItem(LAST_VISITED_KEY);
    if (lastVisited) {
      sessionStorage.removeItem(LAST_VISITED_KEY);
      requestAnimationFrame(() => {
        const el = document.getElementById(lastVisited);
        if (el) el.scrollIntoView({ block: 'center' });
      });
    }
  }, []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    dialogues.forEach((d) => { if (d.tag) tagSet.add(d.tag); });
    return Object.keys(TAGS).filter((t) => tagSet.has(t));
  }, [dialogues]);

  const filtered = useMemo(() => {
    let result = dialogues;

    if (showBookmarked) {
      result = result.filter((d) => bookmarks.has(d.id));
    }

    if (activeTag) {
      result = result.filter((d) => d.tag === activeTag);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        d.pinyin.toLowerCase().includes(q) ||
        d.titleTranslation.toLowerCase().includes(q) ||
        d.titleTranslation_ru.toLowerCase().includes(q)
      );
    }

    return result;
  }, [search, dialogues, activeTag, showBookmarked, bookmarks]);

  return (
    <main className="home">
      <header className="home__hero">
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href={languagePath} className="home__hero-logo">
              <img src="/logo.svg" alt="Blim" className="home__hero-logo-img" />
            </Link>
            <BannerMenu />
          </div>
          <div className="lang-page__tabs">
            {[1, 2, 3, 4, 5, 6].map((level) => {
              const id = `hsk${level}`;
              const hasContent = level === 1;
              const isActive = bookPath.includes(id);
              if (hasContent) {
                return (
                  <Link
                    key={id}
                    href={`/chinese/${id}/dialogues`}
                    className={`lang-page__tab ${isActive ? 'lang-page__tab--active' : ''}`}
                  >
                    HSK {level}
                  </Link>
                );
              }
              return (
                <span key={id} className="lang-page__tab lang-page__tab--disabled">
                  HSK {level}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      <section className="home__content">
        <div className="dialogues__search">
          <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="dialogues__search-input"
            placeholder={language === 'ru' ? 'Поиск диалогов...' : 'Dialoglarni qidirish...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="dialogues__search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="dialogues__tags">
          <button
            className={`dialogues__tag ${!activeTag && !showBookmarked ? 'dialogues__tag--active' : ''}`}
            onClick={() => { setActiveTag(null); setShowBookmarked(false); }}
          >
            {language === 'ru' ? 'Все' : 'Hammasi'}
          </button>
          <button
            className={`dialogues__tag dialogues__tag--bookmark ${showBookmarked ? 'dialogues__tag--active' : ''}`}
            onClick={() => { setShowBookmarked(!showBookmarked); setActiveTag(null); }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill={showBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {language === 'ru' ? 'Сохранённые' : 'Saqlangan'}
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              className={`dialogues__tag ${activeTag === tag ? 'dialogues__tag--active' : ''}`}
              onClick={() => { setActiveTag(activeTag === tag ? null : tag); setShowBookmarked(false); }}
            >
              {language === 'ru' ? TAGS[tag].ru : TAGS[tag].uz}
            </button>
          ))}
        </div>

        <div className="home__lessons">
          {filtered.map((dialogue) => (
            <Link key={dialogue.id} id={dialogue.id} href={`${bookPath}/dialogues/${dialogue.id}`} className="dialogue-card" onClick={() => { markSeen(dialogue.id); sessionStorage.setItem(LAST_VISITED_KEY, dialogue.id); }}>
              <div className="dialogue-card__content">
                <div className="dialogue-card__text">
                  <h3 className="dialogue-card__title">
                    {dialogue.title}
                    {isNew(dialogue.dateAdded, seen, dialogue.id) && (
                      <span className="dialogue-card__new">{language === 'ru' ? 'Новое' : 'Yangi'}</span>
                    )}
                  </h3>
                  <p className="dialogue-card__pinyin">{dialogue.pinyin}</p>
                  <p className="dialogue-card__translation">
                    {language === 'ru' ? dialogue.titleTranslation_ru : dialogue.titleTranslation}
                  </p>
                </div>
                <button
                  className={`dialogue-card__bookmark ${bookmarks.has(dialogue.id) ? 'dialogue-card__bookmark--active' : ''}`}
                  onClick={(e) => toggleBookmark(e, dialogue.id)}
                  aria-label="Bookmark"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill={bookmarks.has(dialogue.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
              {dialogue.tag && (
                <span className="dialogue-card__tag">
                  {language === 'ru' ? TAGS[dialogue.tag]?.ru : TAGS[dialogue.tag]?.uz}
                </span>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="dialogues__empty">
              {language === 'ru' ? 'Ничего не найдено' : 'Hech narsa topilmadi'}
            </p>
          )}
        </div>
      </section>

      <footer className="home__footer">
        <p>
          {language === 'ru'
            ? 'Blim — Интерактивные учебники языков'
            : 'Blim — Interaktiv til darsliklari'}
        </p>
      </footer>
    </main>
  );
}
