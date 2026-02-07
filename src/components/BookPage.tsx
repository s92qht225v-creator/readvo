'use client';

import React from 'react';
import Link from 'next/link';
import type { LessonInfo } from '../services/content';
import { useLanguage } from '../hooks/useLanguage';

interface BookPageProps {
  lessons: LessonInfo[];
}

export function BookPage({ lessons }: BookPageProps) {
  const [language, toggleLanguage] = useLanguage();
  const hasContent = lessons.length > 0;

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
            {language === 'uz' ? 'UZ' : 'RU'}
          </button>
        </div>
        <h1 className="home__logo">
          <span className="home__logo-icon">🇨🇳</span>
          HSK 1
        </h1>
        <p className="home__tagline">
          {language === 'ru'
            ? 'Китайский язык — Начальный уровень'
            : "Xitoy tili — Boshlang'ich daraja"}
        </p>
      </header>

      {!hasContent ? (
        <div className="home__empty">
          <div className="home__empty-icon">📚</div>
          <p>{language === 'ru' ? 'Контент не найден.' : 'Kontent topilmadi.'}</p>
          <p>
            <code>content/</code>{' '}
            {language === 'ru'
              ? 'Добавьте JSON файлы в папку.'
              : "papkasiga JSON fayllarini qo'shing."}
          </p>
        </div>
      ) : (
        <section className="home__content">
          <h2 className="home__section-title">
            {language === 'ru' ? 'Уроки' : 'Darslar'}
          </h2>
          <div className="home__lessons">
            {lessons.map((lesson) => (
              <article key={lesson.lessonId} className="lesson-card">
                <div className="lesson-card__header">
                  <div className="lesson-card__number">{lesson.lessonNumber}</div>
                  <div className="lesson-card__title-group">
                    <h3 className="lesson-card__title">{lesson.title}</h3>
                    <p className="lesson-card__pinyin">{lesson.pinyin}</p>
                    <p className="lesson-card__translation">
                      {language === 'ru' && lesson.titleTranslation_ru
                        ? lesson.titleTranslation_ru
                        : lesson.titleTranslation}
                    </p>
                  </div>
                </div>
                <div className="lesson-card__pages">
                  {lesson.pages.map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/chinese/hsk1/lesson/${lesson.lessonId}/page/${pageNum}`}
                      className="lesson-card__page-link"
                    >
                      <span className="lesson-card__page-num">{pageNum}</span>
                      <span className="lesson-card__page-label">
                        {language === 'ru' ? 'стр.' : 'sahifa'}
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Flashcards */}
          <Link href="/chinese/hsk1/flashcards" className="home__flashcards-link">
            <span className="home__flashcards-icon">📇</span>
            <div className="home__flashcards-text">
              <span className="home__flashcards-title">
                {language === 'ru' ? 'Флэшкарты' : 'Fleshkartalar'}
              </span>
              <span className="home__flashcards-desc">
                {language === 'ru' ? 'Практикуйте слова' : "So'zlarni mashq qiling"}
              </span>
            </div>
            <span className="home__flashcards-arrow">&rarr;</span>
          </Link>

          {/* Stats */}
          <div className="home__stats">
            <div className="home__stat">
              <span className="home__stat-value">{lessons.length}</span>
              <span className="home__stat-label">
                {language === 'ru' ? 'уроков' : 'darslar'}
              </span>
            </div>
            <div className="home__stat">
              <span className="home__stat-value">
                {lessons.reduce((sum, l) => sum + l.pages.length, 0)}
              </span>
              <span className="home__stat-label">
                {language === 'ru' ? 'страниц' : 'sahifalar'}
              </span>
            </div>
          </div>
        </section>
      )}

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
