'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { LessonInfo } from '../services/content';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { BannerMenu } from './BannerMenu';

interface ProgressEntry {
  lesson_id: string;
  page_num: string;
  completed: boolean;
}

const hskLevels = [
  { id: 'hsk1', level: 1, hasContent: true },
  { id: 'hsk2', level: 2, hasContent: false },
  { id: 'hsk3', level: 3, hasContent: false },
  { id: 'hsk4', level: 4, hasContent: false },
  { id: 'hsk5', level: 5, hasContent: false },
  { id: 'hsk6', level: 6, hasContent: false },
];

interface TabConfig {
  id: string;
  label: string;
  hasContent: boolean;
}

interface BookPageProps {
  lessons: LessonInfo[];
  bookPath: string;
  languagePath?: string;
  tabConfig?: TabConfig[];
  /** URL segment for page links: 'lesson' (default) or 'unit' */
  unitLabel?: string;
}

export function BookPage({ lessons, bookPath, languagePath, tabConfig, unitLabel }: BookPageProps) {
  const { isLoading: authLoading } = useRequireAuth();
  const [language] = useLanguage();
  const activeBook = bookPath.split('/').pop() || 'hsk1';
  const { user, getAccessToken } = useAuth();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const hasContent = lessons.length > 0;

  // Fetch progress when user is logged in
  useEffect(() => {
    if (!user) return;
    getAccessToken().then((token) => {
      if (!token) return;
      fetch('/api/progress', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setProgress(data.progress || []))
        .catch(() => {});
    });
  }, [user, getAccessToken]);

  if (authLoading) return <div className="loading-spinner" />;

  const isPageCompleted = (lessonId: string, pageNum: number) =>
    progress.some((p) => p.lesson_id === lessonId && p.page_num === String(pageNum) && p.completed);

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href={languagePath || '/chinese'} className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{tabConfig ? 'B1' : 'HSK 1'}</div>
            <div className="dr-hero__title">{tabConfig ? 'Kitob' : '课本'}</div>
            <div className="dr-hero__pinyin">{tabConfig ? '' : 'kèběn'}</div>
            <div className="dr-hero__translation">— {language === 'ru' ? 'Учебник' : 'Darslik'} —</div>
          </div>
        </div>
      </header>
      <nav className="lp__tabs">
            {(tabConfig || hskLevels).map((item) => {
              const id = 'level' in item ? item.id : item.id;
              const label = 'level' in item ? `HSK ${item.level}` : item.label;
              const hasContent = item.hasContent;
              const href = tabConfig
                ? `${languagePath || '/english'}/${id}`
                : `/chinese/${id}`;
              return hasContent ? (
                <Link
                  key={id}
                  href={href}
                  className={`lp__tab ${activeBook === id ? 'lp__tab--active' : ''}`}
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={id}
                  className="lp__tab"
                  style={{opacity: 0.4, cursor: 'default'}}
                >
                  {label}
                </span>
              );
            })}
      </nav>

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
                      href={`${bookPath}/${unitLabel ? 'unit' : 'lesson'}/${lesson.lessonId}/page/${pageNum}`}
                      className={`lesson-card__page-link${isPageCompleted(lesson.lessonId, pageNum) ? ' lesson-card__page-link--done' : ''}`}
                    >
                      <span className="lesson-card__page-num">{pageNum}</span>
                      <span className="lesson-card__page-label">
                        {language === 'ru' ? 'стр.' : 'sahifa'}
                      </span>
                      {isPageCompleted(lesson.lessonId, pageNum) && (
                        <span className="lesson-card__check" aria-label="completed">&#10003;</span>
                      )}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

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
            ? 'Blim — Интерактивные учебники языков'
            : 'Blim — Interaktiv til darsliklari'}
        </p>
      </footer>
    </main>
  );
}
