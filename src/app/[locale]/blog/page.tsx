import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { loadBlogPosts } from '@/services/blog';
import { BlogList } from '@/components/BlogList';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600; // re-render at most once per hour

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy tili blog — maqolalar va qo\'llanmalar', description: 'Xitoy tili o\'rganish bo\'yicha maqolalar: HSK tayyorgarlik, so\'z yodlash usullari, grammatika va boshqalar.' },
  ru: { title: 'Блог китайского языка — статьи и руководства', description: 'Статьи по изучению китайского: подготовка к HSK, методы запоминания слов, грамматика.' },
  en: { title: 'Chinese Language Blog — Articles & Guides', description: 'Articles on learning Chinese: HSK preparation, vocabulary tips, grammar and more.' },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { uz: '/uz/blog', ru: '/ru/blog', en: '/en/blog', 'x-default': '/uz/blog' },
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = await loadBlogPosts();

  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Blog', path: `/${locale}/blog` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <BlogList posts={posts} />
    </>
  );
}
