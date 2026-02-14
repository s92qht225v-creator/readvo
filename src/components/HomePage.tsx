'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { TelegramLoginButton } from './TelegramLoginButton';

interface LanguageInfo {
  id: string;
  name: string;
  name_ru: string;
  nameOriginal: string;
  flag: string;
}

const languages: LanguageInfo[] = [
  {
    id: 'chinese',
    name: 'Xitoy tili',
    name_ru: 'Китайский язык',
    nameOriginal: '中文',
    flag: '🇨🇳',
  },
  {
    id: 'english',
    name: 'Ingliz tili',
    name_ru: 'Английский язык',
    nameOriginal: 'English',
    flag: '🇬🇧',
  },
];

export function HomePage() {
  const [language, toggleLanguage] = useLanguage();
  const { user, isLoading, logout } = useAuth();

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '';

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <div className="home__hero-top">
          {/* User info or login */}
          {!isLoading && user ? (
            <button className="home__user-btn" onClick={logout} type="button">
              {user.photo_url && (
                <img src={user.photo_url} alt="" className="home__user-avatar" />
              )}
              <span className="home__user-name">{user.first_name}</span>
            </button>
          ) : (
            <span />
          )}
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
        {/* Telegram login button */}
        {!isLoading && !user && botName && (
          <div className="home__login">
            <TelegramLoginButton botName={botName} size="large" radius={12} />
          </div>
        )}
      </header>

      {/* Language Categories */}
      <section className="home__content">
        <h2 className="home__section-title">
          {language === 'ru' ? 'Выберите язык' : 'Tillarni tanlang'}
        </h2>
        <div className="home__languages">
          {languages.map((lang) => (
            <Link key={lang.id} href={`/${lang.id}`} className="language-group language-group--link">
              <div className="language-group__header">
                <span className="language-group__flag">{lang.flag}</span>
                <div className="language-group__title">
                  <h3 className="language-group__name">
                    {language === 'ru' ? lang.name_ru : lang.name}
                  </h3>
                  <span className="language-group__original">{lang.nameOriginal}</span>
                </div>
              </div>
              <span className="language-group__arrow">→</span>
            </Link>
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
