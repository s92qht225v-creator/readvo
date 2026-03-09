import { notFound } from 'next/navigation';
import { loadBlogPost, loadBlogPosts } from '@/services/blog';
import { BlogPostView } from '@/components/BlogPostView';

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { slug } = await params;
  const post = await loadBlogPost(slug);

  // Trim title to ~50 chars for SEO (template adds " | Blim")
  const metaTitle = post
    ? (post.title.length > 50 && post.title.includes(' — ')
        ? post.title.split(' — ')[0]
        : post.title)
    : 'Blog';

  return {
    title: metaTitle,
    description: post
      ? `${post.description} | ${post.description_ru}`
      : 'Xitoy tili o\'rganish bo\'yicha maqolalar.',
    alternates: {
      canonical: `/blog/${slug}`,
      languages: { 'uz': `/blog/${slug}`, 'ru': `/blog/${slug}`, 'x-default': `/blog/${slug}` },
    },
  };
}

export async function generateStaticParams() {
  const posts = await loadBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = await loadBlogPost(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostView post={post} />;
}
