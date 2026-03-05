'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../hooks/useLanguage';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

interface FlashcardLessonItem {
  lessonId: string;
  lessonNumber: number;
  titleTranslation: string;
  titleTranslation_ru: string;
  wordCount: number;
}

interface FlashcardListPageProps {
  lessons: FlashcardLessonItem[];
  bookPath: string;
}

export function FlashcardListPage({ lessons, bookPath }: FlashcardListPageProps) {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  if (isLoading) return <div className="loading-spinner" />;

  return (
    <main className="home">
      <header className="home__hero">
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/chinese?tab=flashcards" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">HSK 1</div>
            <div className="dr-hero__title">词卡</div>
            <div className="dr-hero__pinyin">cíkǎ</div>
            <div className="dr-hero__translation">— {language === 'ru' ? 'Флешкарты' : 'Fleshkartalar'} —</div>
          </div>
        </div>
      </header>
      <nav className="lp__tabs">
        <Link href={`${bookPath}/flashcards`} className="lp__tab lp__tab--active">
          HSK 1
        </Link>
        {[2, 3, 4, 5, 6].map((level) => (
          <span key={level} className="lp__tab" style={{opacity: 0.4, cursor: 'default'}}>
            HSK {level}
          </span>
        ))}
      </nav>

      <section className="home__content">
        <div className="home__lessons">
          {lessons.map((lesson) => (
            <article key={lesson.lessonId} className="lesson-card">
              <div className="lesson-card__header">
                <div className="lesson-card__number">{lesson.lessonNumber}</div>
                <div className="lesson-card__title-group">
                  <p className="lesson-card__translation">
                    {language === 'ru' && lesson.titleTranslation_ru
                      ? lesson.titleTranslation_ru
                      : lesson.titleTranslation}
                  </p>
                </div>
              </div>
              <div className="lesson-card__pages">
                <Link
                  href={`${bookPath}/flashcards/${lesson.lessonId}`}
                  className="lesson-card__page-link"
                >
                  <span className="lesson-card__page-num">
                    {lesson.wordCount} {language === 'ru' ? 'слов' : "so'z"}
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
