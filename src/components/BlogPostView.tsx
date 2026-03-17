'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import type { BlogPost } from '../services/blog';

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function renderBody(text: string) {
  const paragraphs = text.split('\n\n');
  return paragraphs.map((para, i) => {
    const lines = para.split('\n');

    // Table: all lines start with |
    const isTable = lines.length > 1 && lines.every((l) => l.trimStart().startsWith('|'));
    if (isTable) {
      const dataRows = lines.filter((l) => !l.match(/^\s*\|[-\s:|]+\|\s*$/));
      if (dataRows.length === 0) return null;
      const headerCells = dataRows[0].split('|').map((c) => c.trim()).filter(Boolean);
      const bodyRows = dataRows.slice(1);
      return (
        <div key={i} className="blog__table-wrap">
          <table className="blog__table">
            <thead>
              <tr>{headerCells.map((c, j) => <th key={j}>{renderInline(c)}</th>)}</tr>
            </thead>
            <tbody>
              {bodyRows.map((row, j) => {
                const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
                return <tr key={j}>{cells.map((c, k) => <td key={k}>{renderInline(c)}</td>)}</tr>;
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Blockquote: all lines start with >
    const isBlockquote = lines.every((l) => l.startsWith('> '));
    if (isBlockquote) {
      return (
        <blockquote key={i} className="blog__blockquote">
          {lines.map((l, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(l.slice(2))}
            </React.Fragment>
          ))}
        </blockquote>
      );
    }

    // List: all lines start with *
    const isList = lines.every((l) => l.startsWith('* '));
    if (isList) {
      return (
        <ul key={i} className="blog__list-ul">
          {lines.map((l, j) => (
            <li key={j}>{renderInline(l.slice(2))}</li>
          ))}
        </ul>
      );
    }

    return (
      <p key={i} className="blog__section-body">
        {lines.map((line, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

interface Props {
  post: BlogPost;
}

export function BlogPostView({ post }: Props) {
  const [language, toggleLanguage] = useLanguage();
  const isRu = language === 'ru';

  const title = language === 'ru' ? post.title_ru : language === 'en' ? (post.title_en || post.title) : post.title;
  const intro = language === 'ru' ? post.intro_ru : language === 'en' ? (post.intro_en || post.intro) : post.intro;
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (language === 'uz') {
      const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
      return `${d.getUTCDate()}-${months[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
    }
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  };

  return (
    <main className="blog">
      <div className="blog__header">
        <div className="blog__header-top">
          <Link href="/blog" className="blog__logo-link">
            <Image src="/logo-red.svg" alt="Blim" width={64} height={28} className="blog__logo-img" />
          </Link>
          <button className="page__lang-btn" onClick={toggleLanguage} type="button">
            {language.toUpperCase()}
          </button>
        </div>
        <h1 className="blog__post-title">{title}</h1>
        <p className="blog__post-date" suppressHydrationWarning>
          {formatDate(post.date)}
        </p>
      </div>
      {(post.heroImage || post.heroImage_ru || post.heroImage_en) && (
        <div className="blog__hero-image">
          <Image
            src={((language === 'ru' ? (post.heroImage_ru || post.heroImage) : language === 'en' ? (post.heroImage_en || post.heroImage) : post.heroImage) || post.heroImage_ru || post.heroImage_en)!}
            alt={title}
            width={800}
            height={450}
            style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            priority
          />
        </div>
      )}
      <article className="blog__content">
        {intro && (
          <div className="blog__intro">
            {renderBody(intro)}
          </div>
        )}
        {post.sections.map((section, i) => (
          <section key={i} className="blog__section">
            <h2 className="blog__section-heading">
              {language === 'ru' ? section.heading_ru : language === 'en' ? (section.heading_en || section.heading) : section.heading}
            </h2>
            {section.image && (
              <div className="blog__section-image">
                <Image
                  src={section.image}
                  alt={(language === 'ru' ? (section.imageAlt_ru || section.imageAlt) : language === 'en' ? (section.imageAlt_en || section.imageAlt) : section.imageAlt) || section.heading}
                  width={800}
                  height={450}
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
              </div>
            )}
            {renderBody(language === 'ru' ? section.body_ru : language === 'en' ? (section.body_en || section.body) : section.body)}
          </section>
        ))}
      </article>
      <div className="blog__cta">
        <p className="blog__cta-text">
          {({ uz: 'Xitoy tilini Blim ilovasi bilan o\'rganing — 7 kun bepul!', ru: 'Учите китайский с Blim — 7 дней бесплатно!', en: 'Learn Chinese with Blim — 7 days free!' } as Record<string, string>)[language]}
        </p>
        <Link href="/" className="blog__cta-btn">
          {({ uz: 'Bepul boshlang', ru: 'Начать бесплатно', en: 'Start for free' } as Record<string, string>)[language]}
        </Link>
      </div>
    </main>
  );
}
