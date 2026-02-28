'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { BannerMenu } from './BannerMenu';

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
  const [language] = useLanguage();

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
              const hasContent = level === 2;
              const isActive = bookPath.includes(id);
              if (hasContent) {
                return (
                  <Link
                    key={id}
                    href={`/chinese/${id}/stories`}
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
            ? 'Blim — Интерактивные учебники языков'
            : 'Blim — Interaktiv til darsliklari'}
        </p>
      </footer>
    </main>
  );
}
