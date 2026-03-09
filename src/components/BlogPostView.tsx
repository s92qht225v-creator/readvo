'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import type { BlogPost } from '../services/blog';

function renderBody(text: string) {
  const paragraphs = text.split('\n\n');
  return paragraphs.map((para, i) => {
    const lines = para.split('\n');
    const isList = lines.every((l) => l.startsWith('* '));
    if (isList) {
      return (
        <ul key={i} className="blog__list-ul">
          {lines.map((l, j) => (
            <li key={j}>{l.slice(2)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={i} className="blog__section-body">
        {lines.map((line, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {line}
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

  const title = isRu ? post.title_ru : post.title;
  const intro = isRu ? post.intro_ru : post.intro;

  return (
    <main className="blog">
      <div className="blog__header">
        <div className="blog__header-top">
          <Link href="/blog" className="blog__logo-link">
            <Image src="/logo-red.svg" alt="Blim" width={64} height={28} className="blog__logo-img" />
          </Link>
          <button className="page__lang-btn" onClick={toggleLanguage} type="button">
            {isRu ? 'UZ' : 'RU'}
          </button>
        </div>
        <h1 className="blog__post-title">{title}</h1>
        <p className="blog__post-date">
          {new Date(post.date).toLocaleDateString(isRu ? 'ru-RU' : 'uz-UZ', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>
      {post.heroImage && (
        <div className="blog__hero-image">
          <Image
            src={post.heroImage}
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
              {isRu ? section.heading_ru : section.heading}
            </h2>
            {renderBody(isRu ? section.body_ru : section.body)}
            {section.image && (
              <div className="blog__section-image">
                <Image
                  src={section.image}
                  alt={section.imageAlt || (isRu ? section.heading_ru : section.heading)}
                  width={800}
                  height={450}
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
              </div>
            )}
          </section>
        ))}
      </article>
      <div className="blog__cta">
        <p className="blog__cta-text">
          {isRu
            ? 'Учите китайский с Blim — 7 дней бесплатно!'
            : 'Xitoy tilini Blim ilovasi bilan o\'rganing — 7 kun bepul!'}
        </p>
        <Link href="/" className="blog__cta-btn">
          {isRu ? 'Начать бесплатно' : 'Bepul boshlang'}
        </Link>
      </div>
    </main>
  );
}
