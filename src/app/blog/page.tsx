import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { loadBlogPosts } from '@/services/blog';

export const metadata: Metadata = {
  title: 'Xitoy tili blog — maqolalar va qo\'llanmalar',
  description: 'Xitoy tili o\'rganish bo\'yicha maqolalar: HSK tayyorgarlik, so\'z yodlash usullari, grammatika va boshqalar. | Статьи по изучению китайского: подготовка к HSK, методы запоминания слов, грамматика.',
};

export default async function BlogPage() {
  const posts = await loadBlogPosts();

  return (
    <main className="blog">
      <div className="blog__header">
        <Link href="/" className="blog__logo-link">
          <Image src="/logo-red.svg" alt="Blim" width={64} height={28} className="blog__logo-img" />
        </Link>
        <p className="blog__subtitle">Xitoy tili o&apos;rganish bo&apos;yicha maqolalar</p>
      </div>
      <div className="blog__list">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog__card">
            <h2 className="blog__card-title">{post.title}</h2>
            <p className="blog__card-desc">{post.description}</p>
            <span className="blog__card-date">{new Date(post.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
