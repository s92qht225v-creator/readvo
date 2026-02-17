'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';

type Tab = 'hsk' | 'stories' | 'flashcards' | 'tests';

interface TabInfo {
  id: Tab;
  label: string;
  label_ru: string;
  icon: string;
}

interface HSKBook {
  id: string;
  level: number;
  subtitle: string;
  subtitle_ru: string;
  hasContent: boolean;
}

interface FlashcardDeckInfo {
  id: string;
  level: number;
  title: string;
  title_ru: string;
  hasContent: boolean;
}

const tabs: TabInfo[] = [
  { id: 'hsk', label: 'HSK', label_ru: 'HSK', icon: '📚' },
  { id: 'stories', label: 'Hikoyalar', label_ru: 'Рассказы', icon: '📖' },
  { id: 'flashcards', label: 'Fleshkartalar', label_ru: 'Флэшкарты', icon: '📇' },
  { id: 'tests', label: 'Testlar', label_ru: 'Тесты', icon: '📝' },
];

const hskBooks: HSKBook[] = [
  { id: 'hsk1', level: 1, subtitle: "Boshlang'ich daraja", subtitle_ru: 'Начальный уровень', hasContent: true },
  { id: 'hsk2', level: 2, subtitle: "Boshlang'ich daraja", subtitle_ru: 'Начальный уровень', hasContent: false },
  { id: 'hsk3', level: 3, subtitle: "O'rta daraja", subtitle_ru: 'Средний уровень', hasContent: false },
  { id: 'hsk4', level: 4, subtitle: "O'rta daraja", subtitle_ru: 'Средний уровень', hasContent: false },
  { id: 'hsk5', level: 5, subtitle: "Yuqori daraja", subtitle_ru: 'Продвинутый уровень', hasContent: false },
  { id: 'hsk6', level: 6, subtitle: "Yuqori daraja", subtitle_ru: 'Продвинутый уровень', hasContent: false },
];

interface StoryBook {
  id: string;
  level: number;
  title: string;
  title_ru: string;
  hasContent: boolean;
}

const storyBooks: StoryBook[] = [
  { id: 'hsk1', level: 1, title: "HSK 1", title_ru: 'HSK 1', hasContent: true },
  { id: 'hsk2', level: 2, title: "HSK 2", title_ru: 'HSK 2', hasContent: false },
  { id: 'hsk3', level: 3, title: "HSK 3", title_ru: 'HSK 3', hasContent: false },
  { id: 'hsk4', level: 4, title: "HSK 4", title_ru: 'HSK 4', hasContent: false },
  { id: 'hsk5', level: 5, title: "HSK 5", title_ru: 'HSK 5', hasContent: false },
  { id: 'hsk6', level: 6, title: "HSK 6", title_ru: 'HSK 6', hasContent: false },
];

const flashcardDecks: FlashcardDeckInfo[] = [
  { id: 'hsk1', level: 1, title: "HSK 1", title_ru: 'HSK 1', hasContent: true },
  { id: 'hsk2', level: 2, title: "HSK 2", title_ru: 'HSK 2', hasContent: false },
  { id: 'hsk3', level: 3, title: "HSK 3", title_ru: 'HSK 3', hasContent: false },
  { id: 'hsk4', level: 4, title: "HSK 4", title_ru: 'HSK 4', hasContent: false },
  { id: 'hsk5', level: 5, title: "HSK 5", title_ru: 'HSK 5', hasContent: false },
  { id: 'hsk6', level: 6, title: "HSK 6", title_ru: 'HSK 6', hasContent: false },
];

export function LanguagePage() {
  const [language, toggleLanguage] = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('hsk');

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <div className="home__hero-top">
          <Link href="/" className="home__back-link">
            ← {language === 'ru' ? 'Главная' : 'Bosh sahifa'}
          </Link>
          <button
            className="home__lang-btn"
            onClick={toggleLanguage}
            type="button"
          >
            {language === 'uz' ? 'RU' : 'UZ'}
          </button>
        </div>
        <h1 className="home__logo">
          <span className="home__logo-icon">🇨🇳</span>
          {language === 'ru' ? 'Китайский язык' : 'Xitoy tili'}
        </h1>
        <p className="home__tagline">中文</p>
      </header>

      {/* Tabs */}
      <section className="home__content">
        <div className="lang-page__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`lang-page__tab ${activeTab === tab.id ? 'lang-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span className="lang-page__tab-icon">{tab.icon}</span>
              {language === 'ru' ? tab.label_ru : tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'hsk' && (
          <div className="lang-page__books">
            {hskBooks.map((book) =>
              book.hasContent ? (
                <Link
                  key={book.id}
                  href={`/chinese/${book.id}`}
                  className="lang-page__book-card"
                >
                  <span className="lang-page__book-level">{book.level}</span>
                  <span className="lang-page__book-title">HSK {book.level}</span>
                  <span className="lang-page__book-subtitle">
                    {language === 'ru' ? book.subtitle_ru : book.subtitle}
                  </span>
                </Link>
              ) : (
                <div
                  key={book.id}
                  className="lang-page__book-card lang-page__book-card--disabled"
                >
                  <span className="lang-page__coming-soon">
                    {language === 'ru' ? 'Скоро' : 'Tez kunda'}
                  </span>
                  <span className="lang-page__book-level">{book.level}</span>
                  <span className="lang-page__book-title">HSK {book.level}</span>
                  <span className="lang-page__book-subtitle">
                    {language === 'ru' ? book.subtitle_ru : book.subtitle}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="lang-page__books">
            {flashcardDecks.map((deck) =>
              deck.hasContent ? (
                <Link
                  key={deck.id}
                  href={`/chinese/${deck.id}/flashcards`}
                  className="lang-page__book-card"
                >
                  <span className="lang-page__book-level">📇</span>
                  <span className="lang-page__book-title">
                    {language === 'ru' ? deck.title_ru : deck.title}
                  </span>
                  <span className="lang-page__book-subtitle">
                    {language === 'ru'
                      ? `${deck.level} даражадаги сўзлар`
                      : `${deck.level}-daraja so'zlari`}
                  </span>
                </Link>
              ) : (
                <div
                  key={deck.id}
                  className="lang-page__book-card lang-page__book-card--disabled"
                >
                  <span className="lang-page__coming-soon">
                    {language === 'ru' ? 'Скоро' : 'Tez kunda'}
                  </span>
                  <span className="lang-page__book-level">📇</span>
                  <span className="lang-page__book-title">
                    {language === 'ru' ? deck.title_ru : deck.title}
                  </span>
                  <span className="lang-page__book-subtitle">
                    {language === 'ru'
                      ? `${deck.level} даражадаги сўзлар`
                      : `${deck.level}-daraja so'zlari`}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="lang-page__books">
            {storyBooks.map((book) =>
              book.hasContent ? (
                <Link
                  key={book.id}
                  href={`/chinese/${book.id}/stories`}
                  className="lang-page__book-card"
                >
                  <span className="lang-page__book-level">📖</span>
                  <span className="lang-page__book-title">
                    {language === 'ru' ? book.title_ru : book.title}
                  </span>
                  <span className="lang-page__book-subtitle">
                    {language === 'ru'
                      ? `${book.level}-daraja hikoyalari`
                      : `${book.level}-daraja hikoyalari`}
                  </span>
                </Link>
              ) : (
                <div
                  key={book.id}
                  className="lang-page__book-card lang-page__book-card--disabled"
                >
                  <span className="lang-page__coming-soon">
                    {language === 'ru' ? 'Скоро' : 'Tez kunda'}
                  </span>
                  <span className="lang-page__book-level">📖</span>
                  <span className="lang-page__book-title">
                    {language === 'ru' ? book.title_ru : book.title}
                  </span>
                  <span className="lang-page__book-subtitle">
                    {language === 'ru'
                      ? `${book.level}-daraja hikoyalari`
                      : `${book.level}-daraja hikoyalari`}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="lang-page__placeholder">
            <div className="lang-page__placeholder-icon">
              {tabs.find((t) => t.id === activeTab)?.icon}
            </div>
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
