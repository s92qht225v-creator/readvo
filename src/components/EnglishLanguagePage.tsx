'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

const books = [
  { id: 'destination-b1', label: 'Destination B1', hasContent: true },
  { id: 'destination-b2', label: 'Destination B2', hasContent: false },
];

export function EnglishLanguagePage() {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  if (isLoading) return null;

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
            <button
              className="lang-page__tab lang-page__tab--active"
              type="button"
              style={{ background: '#f5f5f5', color: '#dc2626' }}
            >
              {language === 'ru' ? 'Книги' : 'Kitob'}
            </button>
            <span className="lang-page__tab lang-page__tab--disabled">
              Test
            </span>
          </div>
        </div>
      </header>

      {/* Book Cards */}
      <section className="home__content">
        <div className="lang-page__books">
          {books.map((book) =>
            book.hasContent ? (
              <Link
                key={book.id}
                href={`/english/${book.id}`}
                className="lang-page__book-card"
              >
                <span className="lang-page__book-level">{book.label}</span>
              </Link>
            ) : (
              <div
                key={book.id}
                className="lang-page__book-card lang-page__book-card--disabled"
              >
                <span className="lang-page__book-level">{book.label}</span>
                <span className="lang-page__book-subtitle">
                  {language === 'ru' ? 'Скоро...' : 'Tez kunda...'}
                </span>
              </div>
            )
          )}
        </div>
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
