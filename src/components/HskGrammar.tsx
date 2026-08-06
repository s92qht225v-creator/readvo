'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { BannerMenu } from './BannerMenu';
import { PageFooter } from './PageFooter';
import { RubyText } from './RubyText';
import type { HskGrammarPoint, HskLesson } from '@/services/hsk';

/**
 * A lesson's grammar point.
 *
 * Deliberately a flat list of typed blocks rather than free HTML: a grammar
 * explanation is the same five shapes over and over (heading, prose, a pattern
 * formula, an example, a remember-note), and typing them keeps every language
 * rendering identically. Prose is per-language; only examples carry Chinese.
 */
export function HskGrammar({ lesson, point, backHref }: {
  lesson: HskLesson;
  point: HskGrammarPoint;
  backHref: string;
}) {
  const [language] = useLanguage();
  const pick = (b: { uz?: string; ru?: string; en?: string }) =>
    (language === 'ru' ? b.ru : language === 'en' ? b.en : b.uz) || b.en || b.uz || '';

  return (
    <main className="home">
      <header className="home__hero home__hero--lang">
        <div className="home__hero-inner">
          <span className="lp__hero-watermark" aria-hidden="true">语</span>
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo">
              <Image src="/logo.svg" alt="Blim" width={64} height={22} className="home__hero-logo-img" priority />
            </Link>
            <BannerMenu />
          </div>
        </div>
      </header>

      <section className="home__content">
        <Link href={backHref} className="hskg__back">
          ‹ {lesson.title}
        </Link>

        <h1 className="hskg__title" lang="zh-Hans">{point.title}</h1>
        <p className="hskg__py">{point.pinyin}</p>

        <div className="hskg__body">
          {point.blocks.map((b, i) => {
            if (b.type === 'h') return <h2 key={i} className="hskg__h">{pick(b)}</h2>;
            if (b.type === 'p') return <p key={i} className="hskg__p">{pick(b)}</p>;
            if (b.type === 'formula') return <div key={i} className="hskg__formula">{pick(b)}</div>;
            if (b.type === 'note') return (
              // Pre-line: the note is a two-line rule and the break carries meaning.
              <div key={i} className="hskg__note">{pick(b)}</div>
            );
            if (b.type === 'ex') return (
              <div key={i} className="hskg__ex">
                <div className="hskg__ex-zh" lang="zh-Hans">
                  <RubyText text={b.zh ?? ''} pinyin={b.py ?? ''} showPinyin />
                </div>
                <div className="hskg__ex-tr">{pick(b)}</div>
              </div>
            );
            return null;
          })}
        </div>
      </section>
      <PageFooter />
    </main>
  );
}
