import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { loadBlogPosts } from '@/services/blog';
import { BlogList } from '@/components/BlogList';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600; // re-render at most once per hour

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy tili blog — maqolalar va qo\'llanmalar', description: 'Xitoy tili o\'rganish bo\'yicha maqolalar: HSK tayyorgarlik, so\'z yodlash usullari, grammatika va boshqalar.' },
  ru: { title: 'Блог китайского языка — статьи и руководства', description: 'Статьи по изучению китайского: подготовка к HSK, методы запоминания слов, грамматика.' },
  en: { title: 'Chinese Language Blog — Articles & Guides', description: 'Articles on learning Chinese: HSK preparation, vocabulary tips, grammar and more.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/blog`,
      languages: { uz: '/uz/chinese/blog', ru: '/ru/chinese/blog', en: '/en/chinese/blog', 'x-default': '/uz/chinese/blog' },
    },
  };
}

export default async function ChineseBlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await loadBlogPosts('chinese');

  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese/dialogues` },
      { name: 'Blog', path: `/${locale}/chinese/blog` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <BlogList posts={posts} />
    </>
  );
}
