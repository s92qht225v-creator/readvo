import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadBlogPost, loadBlogPosts } from '@/services/blog';
import { BlogPostView } from '@/components/BlogPostView';

interface PageParams {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, slug } = await params;
  const post = await loadBlogPost(slug);

  const rawTitle = post
    ? locale === 'ru' ? post.title_ru
    : locale === 'en' ? (post.title_en || post.title)
    : post.title
    : 'Blog';
  // Trim title to ~50 chars for SEO (template adds " | Blim")
  const metaTitle = rawTitle.length > 50 && rawTitle.includes(' — ')
    ? rawTitle.split(' — ')[0]
    : rawTitle;

  const description = post
    ? locale === 'ru' ? post.description_ru
    : locale === 'en' ? (post.description_en || post.description)
    : post.description
    : ({ uz: 'Xitoy tili o\'rganish bo\'yicha maqolalar.', ru: 'Статьи по изучению китайского языка.', en: 'Articles on learning Chinese.' } as Record<string, string>)[locale] || 'Xitoy tili o\'rganish bo\'yicha maqolalar.';

  return {
    title: metaTitle,
    description,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: { uz: `/uz/blog/${slug}`, ru: `/ru/blog/${slug}`, en: `/en/blog/${slug}`, 'x-default': `/uz/blog/${slug}` },
    },
  };
}

export async function generateStaticParams() {
  const posts = await loadBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: PageParams) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await loadBlogPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostView post={post} />;
}
