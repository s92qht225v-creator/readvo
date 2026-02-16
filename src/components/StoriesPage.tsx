'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';

interface StoryItem {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
}

interface StoriesPageProps {
  stories: StoryItem[];
  bookPath: string;
  languagePath: string;
}

export function StoriesPage({ stories, bookPath, languagePath }: StoriesPageProps) {
  const [language, toggleLanguage] = useLanguage();

  return (
    <main className="home">
      <header className="home__hero">
        <div className="home__hero-top">
          <Link href={languagePath} className="home__back-link">
            ← {language === 'ru' ? 'Китайский' : 'Xitoy tili'}
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
          <span className="home__logo-icon">📖</span>
          {language === 'ru' ? 'HSK 1 Рассказы' : 'HSK 1 Hikoyalar'}
        </h1>
        <p className="home__tagline">
          {language === 'ru' ? 'Короткие рассказы для чтения' : "O'qish uchun qisqa hikoyalar"}
        </p>
      </header>

      <section className="home__content">
        <h2 className="home__section-title">
          {language === 'ru' ? 'Рассказы' : 'Hikoyalar'}
        </h2>
        <div className="home__lessons">
          {stories.map((story, index) => (
            <article key={story.id} className="lesson-card">
              <div className="lesson-card__header">
                <div className="lesson-card__number">{index + 1}</div>
                <div className="lesson-card__title-group">
                  <h3 className="lesson-card__title">{story.title}</h3>
                  <p className="lesson-card__pinyin">{story.pinyin}</p>
                  <p className="lesson-card__translation">
                    {language === 'ru' ? story.titleTranslation_ru : story.titleTranslation}
                  </p>
                </div>
              </div>
              <div className="lesson-card__pages">
                <Link
                  href={`${bookPath}/stories/${story.id}`}
                  className="lesson-card__page-link"
                >
                  <span className="lesson-card__page-num">
                    {language === 'ru' ? 'Читать' : "O'qish"}
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="home__footer">
        <p>
          {language === 'ru'
            ? 'ReadLink — Интерактивные учебники языков'
            : 'ReadLink — Interaktiv til darsliklari'}
        </p>
      </footer>
    </main>
  );
}
