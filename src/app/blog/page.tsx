import type { Metadata } from 'next';
import { loadBlogPosts } from '@/services/blog';
import { BlogList } from '@/components/BlogList';

export const metadata: Metadata = {
  title: 'Xitoy tili blog — maqolalar va qo\'llanmalar',
  description: 'Xitoy tili o\'rganish bo\'yicha maqolalar: HSK tayyorgarlik, so\'z yodlash usullari, grammatika va boshqalar. | Статьи по изучению китайского: подготовка к HSK, методы запоминания слов, грамматика.',
  alternates: {
    canonical: '/blog',
    languages: { 'uz': '/blog', 'ru': '/blog', 'x-default': '/blog' },
  },
};

export default async function BlogPage() {
  const posts = await loadBlogPosts();

  return <BlogList posts={posts} />;
}
