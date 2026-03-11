'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useLanguage } from '../hooks/useLanguage';
import type { BlogPost } from '../services/blog';

interface Props {
  posts: BlogPost[];
}

export function BlogList({ posts }: Props) {
  const [language, toggleLanguage] = useLanguage();
  const isRu = language === 'ru';
  const dateLocale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';

  return (
    <main className="blog">
      <div className="blog__header">
        <div className="blog__header-top">
          <Link href="/" className="blog__logo-link">
            <Image src="/logo-red.svg" alt="Blim" width={64} height={28} className="blog__logo-img" />
          </Link>
          <button className="page__lang-btn" onClick={toggleLanguage} type="button">
            {language.toUpperCase()}
          </button>
        </div>
        <h1 className="blog__subtitle">
          {({ uz: 'Xitoy tili o\'rganish bo\'yicha maqolalar', ru: 'Статьи по изучению китайского языка', en: 'Articles on Learning Chinese' } as Record<string, string>)[language]}
        </h1>
        <p className="blog__intro-text">
          {({ uz: 'HSK tayyorgarlik, so\'z yodlash usullari, grammatika va boshqa foydali maqolalar. Xitoy tilini o\'rganishni boshlamoqchi bo\'lganlar uchun qo\'llanmalar.', ru: 'Подготовка к HSK, методы запоминания слов, грамматика и другие полезные статьи. Руководства для тех, кто начинает изучать китайский язык.', en: 'HSK preparation, vocabulary memorization techniques, grammar and other useful articles. Guides for those starting to learn Chinese.' } as Record<string, string>)[language]}
        </p>
      </div>
      <div className="blog__list">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog__card">
            <h2 className="blog__card-title">
              {language === 'ru' ? post.title_ru : language === 'en' ? (post.title_en || post.title) : post.title}
            </h2>
            <p className="blog__card-desc">
              {language === 'ru' ? post.description_ru : language === 'en' ? (post.description_en || post.description) : post.description}
            </p>
            <span className="blog__card-date" suppressHydrationWarning>
              {new Date(post.date).toLocaleDateString(dateLocale, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
