'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../hooks/useLanguage';
import type { BlogPost } from '../services/blog';

interface Props {
  posts: BlogPost[];
}

export function BlogList({ posts }: Props) {
  const [language, toggleLanguage] = useLanguage();
  const isRu = language === 'ru';

  return (
    <main className="blog">
      <div className="blog__header">
        <div className="blog__header-top">
          <Link href="/" className="blog__logo-link">
            <Image src="/logo-red.svg" alt="Blim" width={64} height={28} className="blog__logo-img" />
          </Link>
          <button className="page__lang-btn" onClick={toggleLanguage} type="button">
            {isRu ? 'UZ' : 'RU'}
          </button>
        </div>
        <h1 className="blog__subtitle">
          {isRu
            ? 'Статьи по изучению китайского языка'
            : 'Xitoy tili o\'rganish bo\'yicha maqolalar'}
        </h1>
      </div>
      <div className="blog__list">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog__card">
            <h2 className="blog__card-title">
              {isRu ? post.title_ru : post.title}
            </h2>
            <p className="blog__card-desc">
              {isRu ? post.description_ru : post.description}
            </p>
            <span className="blog__card-date">
              {new Date(post.date).toLocaleDateString(isRu ? 'ru-RU' : 'uz-UZ', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
