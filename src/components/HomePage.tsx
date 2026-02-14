'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';

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
  const { user, isLoading, loginWithGoogle, logout } = useAuth();

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <div className="home__hero-top">
          {/* User info or login */}
          {!isLoading && user ? (
            <button className="home__user-btn" onClick={logout} type="button">
              {user.avatar_url && (
                <img src={user.avatar_url} alt="" className="home__user-avatar" />
              )}
              <span className="home__user-name">{user.name}</span>
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
        {/* Google login button */}
        {!isLoading && !user && (
          <div className="home__login">
            <button className="home__google-btn" onClick={loginWithGoogle} type="button">
              <svg className="home__google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {language === 'ru' ? 'Войти через Google' : 'Google orqali kirish'}
            </button>
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
