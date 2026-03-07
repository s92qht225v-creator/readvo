import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { loadBlogPost, loadBlogPosts } from '@/services/blog';

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { slug } = await params;
  const post = await loadBlogPost(slug);

  return {
    title: post
      ? `${post.title}`
      : 'Blog',
    description: post
      ? `${post.description} | ${post.description_ru}`
      : 'Xitoy tili o\'rganish bo\'yicha maqolalar.',
  };
}

export async function generateStaticParams() {
  const posts = await loadBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

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

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = await loadBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="blog">
      <div className="blog__header">
        <Link href="/blog" className="blog__logo-link">
          <Image src="/logo-red.svg" alt="Blim" width={64} height={28} className="blog__logo-img" />
        </Link>
        <h1 className="blog__post-title">{post.title}</h1>
        <p className="blog__post-date">{new Date(post.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      {post.heroImage && (
        <div className="blog__hero-image">
          <Image
            src={post.heroImage}
            alt={post.title}
            width={800}
            height={450}
            style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            priority
          />
        </div>
      )}
      <article className="blog__content">
        {post.intro && (
          <div className="blog__intro">
            {renderBody(post.intro)}
          </div>
        )}
        {post.sections.map((section, i) => (
          <section key={i} className="blog__section">
            <h2 className="blog__section-heading">{section.heading}</h2>
            {renderBody(section.body)}
            {section.image && (
              <div className="blog__section-image">
                <Image
                  src={section.image}
                  alt={section.imageAlt || section.heading}
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
        <p className="blog__cta-text">Xitoy tilini Blim ilovasi bilan o&apos;rganing — 7 kun bepul!</p>
        <Link href="/" className="blog__cta-btn">Bepul boshlang</Link>
      </div>
    </main>
  );
}
