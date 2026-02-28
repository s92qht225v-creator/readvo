'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../hooks/useLanguage';

type Tab = 'hsk' | 'stories' | 'flashcards' | 'karaoke' | 'tests';

interface TabInfo {
  id: Tab;
  label: string;
  label_ru: string;
}

interface HSKBook {
  id: string;
  level: number;
  subtitle: string;
  subtitle_ru: string;
  hasContent: boolean;
}

const tabs: TabInfo[] = [
  { id: 'hsk', label: 'Kitob', label_ru: 'Книги' },
  { id: 'stories', label: 'Matn', label_ru: 'Текст' },
  { id: 'flashcards', label: 'Fleshkarta', label_ru: 'Флешки' },
  { id: 'karaoke', label: 'Karaoke', label_ru: 'Караоке' },
  { id: 'tests', label: 'Test', label_ru: 'Тесты' },
];

const hskBooks: HSKBook[] = [
  { id: 'hsk1', level: 1, subtitle: "Boshlang'ich daraja", subtitle_ru: 'Начальный уровень', hasContent: true },
  { id: 'hsk2', level: 2, subtitle: "Boshlang'ich daraja", subtitle_ru: 'Начальный уровень', hasContent: false },
  { id: 'hsk3', level: 3, subtitle: "O'rta daraja", subtitle_ru: 'Средний уровень', hasContent: false },
  { id: 'hsk4', level: 4, subtitle: "O'rta daraja", subtitle_ru: 'Средний уровень', hasContent: false },
  { id: 'hsk5', level: 5, subtitle: "Yuqori daraja", subtitle_ru: 'Продвинутый уровень', hasContent: false },
  { id: 'hsk6', level: 6, subtitle: "Yuqori daraja", subtitle_ru: 'Продвинутый уровень', hasContent: false },
];



const validTabs: Tab[] = ['hsk', 'stories', 'flashcards', 'karaoke', 'tests'];

export function LanguagePage() {
  const [language, , setLanguage] = useLanguage();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab && validTabs.includes(initialTab) ? initialTab : 'hsk'
  );
  const [knowOpen, setKnowOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const selectorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!knowOpen && !learnOpen) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (selectorsRef.current && !selectorsRef.current.contains(e.target as Node)) {
        setKnowOpen(false);
        setLearnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [knowOpen, learnOpen]);

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <img src="/logo.svg" alt="Blim" className="home__hero-logo-img" />
            </Link>
            <div className="home__lang-selectors" ref={selectorsRef}>
              <div className="home__lang-selector">
                <span className="home__lang-selector-label">
                  {language === 'ru' ? 'Я знаю' : 'Men bilaman'}
                </span>
                <button
                  className="home__lang-select-btn"
                  onClick={() => { setKnowOpen(!knowOpen); setLearnOpen(false); }}
                  type="button"
                >
                  {language === 'ru' ? 'Русский' : "O'zbekcha"} ▾
                </button>
                {knowOpen && (
                  <div className="home__lang-dropdown">
                    <button
                      className={`home__lang-dropdown-item ${language === 'uz' ? 'home__lang-dropdown-item--active' : ''}`}
                      onClick={() => { setLanguage('uz'); setKnowOpen(false); }}
                      type="button"
                    >
                      O&apos;zbekcha
                    </button>
                    <button
                      className={`home__lang-dropdown-item ${language === 'ru' ? 'home__lang-dropdown-item--active' : ''}`}
                      onClick={() => { setLanguage('ru'); setKnowOpen(false); }}
                      type="button"
                    >
                      Русский
                    </button>
                  </div>
                )}
              </div>
              <div className="home__lang-selector">
                <span className="home__lang-selector-label">
                  {language === 'ru' ? 'Я изучаю' : "Men o'rganaman"}
                </span>
                <button
                  className="home__lang-select-btn"
                  onClick={() => { setLearnOpen(!learnOpen); setKnowOpen(false); }}
                  type="button"
                >
                  {language === 'ru' ? 'Китайский' : 'Xitoycha'} ▾
                </button>
                {learnOpen && (
                  <div className="home__lang-dropdown">
                    <button
                      className="home__lang-dropdown-item home__lang-dropdown-item--active"
                      onClick={() => setLearnOpen(false)}
                      type="button"
                    >
                      {language === 'ru' ? 'Китайский' : 'Xitoycha'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              className="home__avatar-btn"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>
          </div>
          <div className="lang-page__tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`lang-page__tab ${activeTab === tab.id ? 'lang-page__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                style={activeTab === tab.id ? { background: '#f5f5f5', color: '#dc2626' } : undefined}
              >
                {language === 'ru' ? tab.label_ru : tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <section className="home__content">
        {activeTab === 'hsk' && (
          <div className="lang-page__books">
            {hskBooks.filter((book) => book.hasContent).map((book) => (
              <Link
                key={book.id}
                href={`/chinese/${book.id}`}
                className="lang-page__book-card"
              >
                <span className="lang-page__book-level">HSK</span>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="lang-page__books">
            <Link
              href="/chinese/hsk1/flashcards"
              className="lang-page__book-card"
            >
              <span className="lang-page__book-level">HSK</span>
            </Link>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="lang-page__books">
            <Link
              href="/chinese/hsk2/stories"
              className="lang-page__book-card"
            >
              <span className="lang-page__book-level">
                {language === 'ru' ? 'Истории' : 'Hikoyalar'}
              </span>
            </Link>
            <Link
              href="/chinese/hsk1/dialogues"
              className="lang-page__book-card"
            >
              <span className="lang-page__book-level">
                {language === 'ru' ? 'Диалоги' : 'Dialoglar'}
              </span>
            </Link>
          </div>
        )}

        {activeTab === 'karaoke' && (
          <div className="lang-page__books">
            <Link
              href="/chinese/hsk1/karaoke/yueliang"
              className="lang-page__book-card"
            >
              <span className="lang-page__book-level">月亮代表我的心</span>
              <span className="lang-page__book-pinyin">Yuèliàng dàibiǎo wǒ de xīn</span>
              <span className="lang-page__book-subtitle">
                {language === 'ru' ? 'Луна представляет моё сердце' : 'Oy yuragimni ifodalaydi'}
              </span>
            </Link>
            <Link
              href="/chinese/hsk1/karaoke/pengyou"
              className="lang-page__book-card"
            >
              <span className="lang-page__book-level">朋友</span>
              <span className="lang-page__book-pinyin">Péngyou</span>
              <span className="lang-page__book-subtitle">
                {language === 'ru' ? 'Друг' : 'Do\'st'}
              </span>
            </Link>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="lang-page__placeholder">
            <p className="lang-page__placeholder-text">
              {language === 'ru' ? 'Скоро...' : 'Tez kunda...'}
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
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
