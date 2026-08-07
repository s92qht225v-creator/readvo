'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import type { HskLesson } from '@/services/hsk';

/**
 * A book's lesson list for one HSK level — the table of contents.
 *
 * Collapsible rather than tabbed: a lesson has several parts (课文一, 课文二,
 * grammar) and each is its own page, so the reader needs no extra tabs and each
 * part stays independently linkable. One lesson open at a time — fifteen
 * expanded at once is a wall of links.
 */
export function HskLessonList({ lessons, book, level }: { lessons: HskLesson[]; book: string; level: string }) {
  const [language] = useLanguage();
  const [open, setOpen] = useState<string | null>(lessons[0]?.slug ?? null);

  const t = (uz: string, ru: string, en: string) =>
    language === 'ru' ? ru : language === 'en' ? en : uz;

  const trOf = (l: HskLesson) =>
    language === 'ru' ? l.titleTranslation_ru
      : language === 'en' ? (l.titleTranslation_en || l.titleTranslation)
      : l.titleTranslation;

  // 上 / 下 are the book's own two volumes; group by them so someone holding one
  // physical book sees their half together.
  const volumes = [...new Set(lessons.map((l) => l.volume || ''))];

  return (
    <main className="home">
      {/* Same banner as the catalog pages — logo home, hamburger menu. Without
          it this page had no way back and no menu. */}
      <header className="home__hero home__hero--lang">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true">课</span>
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            {/* No mobile title here: the H1 directly below already reads
                "HSK {level}", and the catalog's decorative label would just
                repeat it two lines apart. */}
            <BannerMenu />
          </div>
        </div>
      </header>

      <section className="home__content">
        <h1 className="hsk__title">HSK {level}</h1>
        <p className="hsk__intro">
          {lessons[0]?.bookTitle}
          {' · '}
          {t('Darslar', 'Уроки', 'Lessons')} {lessons.length}
        </p>

        {volumes.map((vol) => (
          <div key={vol || 'single'}>
            {vol && <h2 className="hsk__vol">{vol}册</h2>}
            <ul className="hsk__list">
              {lessons.filter((l) => (l.volume || '') === vol).map((lesson) => {
                const isOpen = open === lesson.slug;
                return (
                  <li key={lesson.slug} className={`hsk__item${isOpen ? ' hsk__item--open' : ''}`}>
                    <button
                      type="button"
                      className="hsk__head"
                      onClick={() => setOpen(isOpen ? null : lesson.slug)}
                      aria-expanded={isOpen}
                    >
                      <span className="hsk__num">{lesson.unit}</span>
                      <span className="hsk__text">
                        <span className="hsk__zh" lang="zh-Hans">{lesson.title}</span>
                        <span className="hsk__py">{lesson.pinyin}</span>
                        <span className="hsk__tr">{trOf(lesson)}</span>
                      </span>
                      <span className="hsk__chev" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
                    </button>

                    {/* Always mounted so the open/close can animate — a
                        conditional render has nothing to transition from.
                        `inert` keeps the links out of tab order while closed. */}
                    <div className="hsk__parts-wrap" inert={!isOpen}>
                      <div className="hsk__parts">
                        {lesson.texts.map((text) => (
                          <Link
                            key={text.slug}
                            href={`/hsk/${book}/${level}/${lesson.slug}/${text.slug}`}
                            className="hsk__part"
                          >
                            <span className="hsk__part-zh" lang="zh-Hans">{text.label}</span>
                            <span className="hsk__part-tr">
                              {language === 'ru' ? (text.labelTranslation_ru || text.labelTranslation)
                                : language === 'en' ? (text.labelTranslation_en || text.labelTranslation)
                                : text.labelTranslation}
                            </span>
                            <span className="hsk__part-arrow" aria-hidden="true">›</span>
                          </Link>
                        ))}
                        {(lesson.grammar ?? []).map((g) => (
                          <Link
                            key={g.slug}
                            href={`/hsk/${book}/${level}/${lesson.slug}/grammar/${g.slug}`}
                            className="hsk__part"
                          >
                            <span className="hsk__part-zh" lang="zh-Hans">{g.label}</span>
                            <span className="hsk__part-tr">
                              {language === 'ru' ? (g.labelTranslation_ru || g.labelTranslation)
                                : language === 'en' ? (g.labelTranslation_en || g.labelTranslation)
                                : g.labelTranslation}
                              {' · '}{g.title}
                            </span>
                            <span className="hsk__part-arrow" aria-hidden="true">›</span>
                          </Link>
                        ))}
                        {lesson.properNouns && lesson.properNouns.length > 0 && (
                          <div className="hsk__nouns">
                            <span className="hsk__nouns-label">{t('Atoqli otlar', 'Имена собственные', 'Proper nouns')}</span>
                            {lesson.properNouns.map((n) => (
                              <span key={n.zh} className="hsk__noun">
                                <b lang="zh-Hans">{n.zh}</b> {n.py}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
      <PageFooter />
    </main>
  );
}
