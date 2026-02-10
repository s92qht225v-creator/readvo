'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';

interface BookInfo {
  id: string;
  title: string;
  subtitle: string;
  subtitle_ru: string;
  description: string;
  description_ru: string;
}

interface LanguageGroup {
  id: string;
  name: string;
  name_ru: string;
  nameOriginal: string;
  flag: string;
  books: BookInfo[];
}

const languages: LanguageGroup[] = [
  {
    id: 'chinese',
    name: 'Xitoy tili',
    name_ru: 'Китайский язык',
    nameOriginal: '中文',
    flag: '🇨🇳',
    books: [
      {
        id: 'hsk1',
        title: 'HSK 1',
        subtitle: "Boshlang'ich daraja",
        subtitle_ru: 'Начальный уровень',
        description: "Xitoy tilini o'rganishni boshlang",
        description_ru: 'Начните изучать китайский язык',
      },
    ],
  },
];

export function HomePage() {
  const [language, toggleLanguage] = useLanguage();

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <div className="home__hero-top">
          <span />
          <button
            className="home__lang-btn"
            onClick={toggleLanguage}
            type="button"
          >
            {language === 'uz' ? 'RU' : 'UZ'}
          </button>
        </div>
        <h1 className="home__logo">
          <span className="home__logo-icon">📖</span>
          ReadVo
        </h1>
        <p className="home__tagline">
          {language === 'ru'
            ? 'Интерактивные учебники языков'
            : 'Interaktiv til darsliklari'}
        </p>
      </header>

      {/* Language Categories */}
      <section className="home__content">
        <h2 className="home__section-title">
          {language === 'ru' ? 'Выберите язык' : 'Tillarni tanlang'}
        </h2>
        <div className="home__languages">
          {languages.map((lang) => (
            <div key={lang.id} className="language-group">
              <div className="language-group__header">
                <span className="language-group__flag">{lang.flag}</span>
                <div className="language-group__title">
                  <h3 className="language-group__name">
                    {language === 'ru' ? lang.name_ru : lang.name}
                  </h3>
                  <span className="language-group__original">{lang.nameOriginal}</span>
                </div>
              </div>
              <div className="language-group__books">
                {lang.books.map((book) => (
                  <Link
                    key={book.id}
                    href={`/${lang.id}/${book.id}`}
                    className="book-card"
                  >
                    <div className="book-card__content">
                      <h4 className="book-card__title">{book.title}</h4>
                      <p className="book-card__subtitle">
                        {language === 'ru' ? book.subtitle_ru : book.subtitle}
                      </p>
                      <p className="book-card__description">
                        {language === 'ru' ? book.description_ru : book.description}
                      </p>
                    </div>
                    <span className="book-card__arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home__footer">
        <p>
          {language === 'ru'
            ? 'ReadVo — Интерактивные учебники языков'
            : 'ReadVo — Interaktiv til darsliklari'}
        </p>
      </footer>
    </main>
  );
}
