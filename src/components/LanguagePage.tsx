'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { BannerMenu } from './BannerMenu';

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
  { id: 'flashcards', label: 'Flesh', label_ru: 'Флеш' },
  { id: 'karaoke', label: 'KTV', label_ru: 'KTV' },
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
  const [language] = useLanguage();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab && validTabs.includes(initialTab) ? initialTab : 'hsk'
  );

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <img src="/logo.svg" alt="Blim" className="home__hero-logo-img" />
            </Link>
            <BannerMenu />
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
          <div className="home__lessons">
            <Link
              href="/chinese/hsk1/karaoke/yueliang"
              className="dialogue-card"
            >
              <div className="dialogue-card__content">
                <div className="dialogue-card__text">
                  <h3 className="dialogue-card__title">月亮代表我的心</h3>
                  <p className="dialogue-card__pinyin">Yuèliàng dàibiǎo wǒ de xīn</p>
                  <p className="dialogue-card__translation">
                    {language === 'ru' ? 'Луна представляет моё сердце' : 'Oy yuragimni ifodalaydi'}
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/chinese/hsk1/karaoke/pengyou"
              className="dialogue-card"
            >
              <div className="dialogue-card__content">
                <div className="dialogue-card__text">
                  <h3 className="dialogue-card__title">朋友</h3>
                  <p className="dialogue-card__pinyin">Péngyou</p>
                  <p className="dialogue-card__translation">
                    {language === 'ru' ? 'Друг' : 'Do\'st'}
                  </p>
                </div>
              </div>
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
