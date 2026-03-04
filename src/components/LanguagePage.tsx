'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';
import type { DialogueInfo } from '../services/dialogues';
import type { StoryInfo } from '../services/stories';

const TAGS: Record<string, string> = {
  tanishuv: 'Tanishuv',
  kundalik: 'Kundalik',
  xaridlar: 'Xaridlar',
  ovqat: 'Ovqat',
  salomatlik: 'Salomatlik',
  transport: 'Transport',
  telefon: 'Telefon',
  ish: 'Ish/O\'qish',
  reja: 'Reja',
  muloqot: 'Muloqot',
};

const BOOKMARK_KEY = 'blim-dialogue-bookmarks';

type Tab = 'dialogues' | 'stories' | 'flashcards' | 'karaoke' | 'grammar' | 'tests';

const tabs: { id: Tab; label: string }[] = [
  { id: 'dialogues', label: 'Dialog' },
  { id: 'stories', label: 'Hikoya' },
  { id: 'flashcards', label: 'Flesh' },
  { id: 'karaoke', label: 'KTV' },
  { id: 'grammar', label: 'Tika' },
  { id: 'tests', label: 'Test' },
];

const validTabs: Tab[] = ['dialogues', 'stories', 'flashcards', 'karaoke', 'grammar', 'tests'];

const grammarItems = [
  { char: '是', pinyin: 'shì', href: '/chinese/hsk1/grammar/shi', translation: 'bo\'lmoq', color: '#dc2626', active: true },
  { char: '有', pinyin: 'yǒu', href: '/chinese/hsk1/grammar/you', translation: 'ega bo\'lmoq', color: '#7c3aed', active: true },
  { char: '在', pinyin: 'zài', href: '/chinese/hsk1/grammar/zai', translation: 'joylashmoq', color: '#0891b2', active: true },
  { char: '的', pinyin: 'de', href: '/chinese/hsk1/grammar/de', translation: 'egalik / sifat bog\'lovchi', color: '#d97706', active: true },
  { char: '不', pinyin: 'bù', href: '/chinese/hsk1/grammar/bu', translation: 'inkor', color: '#059669', active: true },
  { char: '吗', pinyin: 'ma', href: '/chinese/hsk1/grammar/ma', translation: 'savol yuklamasi', color: '#0891b2', active: true },
  { char: '呢', pinyin: 'ne', href: '/chinese/hsk1/grammar/ne', translation: 'davom yuklamasi', color: '#7c3aed', active: true },
  { char: '了', pinyin: 'le', href: '/chinese/hsk1/grammar/le', translation: 'tugallash / o\'zgarish', color: '#7c3aed', active: true },
  { char: '也', pinyin: 'yě', href: '/chinese/hsk1/grammar/ye', translation: 'ham', color: '#059669', active: true },
  { char: '都', pinyin: 'dōu', href: '/chinese/hsk1/grammar/dou', translation: 'hammasi / barchasi', color: '#2563eb', active: true },
  { char: '很', pinyin: 'hěn', href: '/chinese/hsk1/grammar/hen', translation: 'juda / bog\'lovchi', color: '#7c3aed', active: true },
  { char: '想', pinyin: 'xiǎng', href: '/chinese/hsk1/grammar/xiang', translation: 'xohlamoq / sog\'inmoq', color: '#e11d48', active: true },
  { char: '会', pinyin: 'huì', href: '/chinese/hsk1/grammar/hui', translation: '...a olmoq (mahorat)', color: '#dc2626', active: true },
  { char: '能', pinyin: 'néng', href: '/chinese/hsk1/grammar/neng', translation: '...a olmoq (imkoniyat)', color: '#dc2626', active: true },
  { char: '没', pinyin: 'méi', href: '/chinese/hsk1/grammar/mei', translation: '...madim / yo\'q', color: '#dc2626', active: true },
  { char: '几', pinyin: 'jǐ', href: '/chinese/hsk1/grammar/ji', translation: 'necha? / qancha?', color: '#dc2626', active: true },
  { char: '量词', pinyin: 'liàngcí', href: '/chinese/hsk1/grammar/liangci', translation: 'sanash so\'zlari', color: '#dc2626', active: true },
];

const karaokeItems = [
  { title: '月亮代表我的心', pinyin: 'Yuèliàng dàibiǎo wǒ de xīn', translation: 'Oy yuragimni ifodalaydi', href: '/chinese/hsk1/karaoke/yueliang' },
  { title: '朋友', pinyin: 'Péngyou', translation: 'Do\'st', href: '/chinese/hsk1/karaoke/pengyou' },
];

interface Props {
  dialogues: DialogueInfo[];
  stories: StoryInfo[];
}

export function LanguagePage({ dialogues, stories }: Props) {
  const { isLoading } = useRequireAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab && validTabs.includes(initialTab) ? initialTab : 'dialogues'
  );

  // Dialogue filters
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARK_KEY);
      if (saved) setBookmarks(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

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

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    dialogues.forEach((d) => { if (d.tag) tagSet.add(d.tag); });
    return Object.keys(TAGS).filter((t) => tagSet.has(t));
  }, [dialogues]);

  const filteredDialogues = useMemo(() => {
    let result = dialogues;
    if (showBookmarked) result = result.filter((d) => bookmarks.has(d.id));
    if (activeTag) result = result.filter((d) => d.tag === activeTag);
    const q = search.trim().toLowerCase();
    if (q) result = result.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.pinyin.toLowerCase().includes(q) ||
      d.titleTranslation.toLowerCase().includes(q)
    );
    return result;
  }, [search, dialogues, activeTag, showBookmarked, bookmarks]);

  if (isLoading) return <div className="loading-spinner" />;

  return (
    <main className="home">
      {/* Banner */}
      <header className="home__hero">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true">中</span>
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <BannerMenu />
          </div>
          <nav className="lp__tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`lp__tab ${activeTab === tab.id ? 'lp__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Segmented HSK level control */}
      {activeTab === 'dialogues' && (
        <div className="lp__seg-bar">
          <div className="lp__seg-track">
            {(['HSK 1', 'HSK 2', 'HSK 3'] as const).map((lv) => {
              const hasContent = lv === 'HSK 1';
              return (
                <button
                  key={lv}
                  className={`lp__seg-btn ${hasContent ? 'lp__seg-btn--active' : 'lp__seg-btn--disabled'}`}
                  disabled={!hasContent}
                  type="button"
                >
                  {lv}
                  {!hasContent && <span className="lp__seg-soon">tez kunda</span>}
                </button>
              );
            })}
          </div>
          <div className="lp__seg-count">{filteredDialogues.length}/{dialogues.length}</div>
        </div>
      )}

      {/* Content */}
      <section className="home__content">

        {activeTab === 'dialogues' && (
          <>
            {/* Search */}
            <div className="dialogues__search">
              <svg className="dialogues__search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="dialogues__search-input"
                placeholder="Dialoglarni qidirish..."
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
                Hammasi
              </button>
              <button
                className={`dialogues__tag dialogues__tag--bookmark ${showBookmarked ? 'dialogues__tag--active' : ''}`}
                onClick={() => { setShowBookmarked(!showBookmarked); setActiveTag(null); }}
                type="button"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill={showBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Saqlangan
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  className={`dialogues__tag ${activeTag === tag ? 'dialogues__tag--active' : ''}`}
                  onClick={() => { setActiveTag(activeTag === tag ? null : tag); setShowBookmarked(false); }}
                  type="button"
                >
                  {TAGS[tag]}
                </button>
              ))}
            </div>

            {/* Dialogue cards */}
            <div className="home__lessons">
              {filteredDialogues.map((d) => (
                <Link key={d.id} href={`/chinese/hsk1/dialogues/${d.id}`} className="dialogue-card">
                  <span className="dialogue-card__deco" aria-hidden="true">{d.title}</span>
                  <div className="dialogue-card__content">
                    <div className="dialogue-card__text">
                      <h3 className="dialogue-card__title">{d.title}</h3>
                      <p className="dialogue-card__pinyin">{d.pinyin}</p>
                      <p className="dialogue-card__translation">{d.titleTranslation}</p>
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
                  {d.tag && (
                    <span className="dialogue-card__tag">{TAGS[d.tag]}</span>
                  )}
                </Link>
              ))}
              {filteredDialogues.length === 0 && (
                <p className="dialogues__empty">Hech narsa topilmadi</p>
              )}
            </div>
          </>
        )}

        {activeTab === 'stories' && (
          <div className="lp__list">
            {stories.map((s) => (
              <Link key={s.id} href={`/chinese/hsk2/stories/${s.id}`} className="lp__card">
                <div className="lp__card-main">
                  <div className="lp__card-title">{s.title}</div>
                  <div className="lp__card-pinyin">{s.pinyin}</div>
                  <div className="lp__card-sub">{s.titleTranslation}</div>
                </div>
                <div className="lp__card-arrow">›</div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="lp__list">
            <Link href="/chinese/hsk1/flashcards" className="lp__card">
              <div className="lp__card-main">
                <div className="lp__card-title">HSK 1 — Flesh kartalar</div>
                <div className="lp__card-sub">Barcha darslar bo&apos;yicha so&apos;zlar</div>
              </div>
              <div className="lp__card-arrow">›</div>
            </Link>
          </div>
        )}

        {activeTab === 'karaoke' && (
          <div className="lp__list">
            {karaokeItems.map((k) => (
              <Link key={k.href} href={k.href} className="lp__card">
                <div className="lp__card-main">
                  <div className="lp__card-title">{k.title}</div>
                  <div className="lp__card-pinyin">{k.pinyin}</div>
                  <div className="lp__card-sub">{k.translation}</div>
                </div>
                <div className="lp__card-arrow">›</div>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'grammar' && (
          <div className="home__lessons">
            {grammarItems.map((item) => (
              <Link key={item.char} href={item.active ? item.href : '#'} className="grammar-card">
                <span className="grammar-card__bg">{item.char}</span>
                <div className="grammar-card__top">
                  <div className="grammar-card__icon" style={{ background: item.color }}>{item.char}</div>
                  <p className="grammar-card__title">{item.char} {item.pinyin}</p>
                  {!item.active && <span className="grammar-card__badge">Tez kunda</span>}
                </div>
                <p className="grammar-card__translation">{item.translation}</p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="lang-page__placeholder">
            <p className="lang-page__placeholder-text">Tez kunda...</p>
          </div>
        )}

      </section>

      <footer className="home__footer">
        <p>Blim — Interaktiv til darsliklari</p>
      </footer>
    </main>
  );
}
