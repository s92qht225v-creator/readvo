import fs from 'fs/promises';
import path from 'path';

export interface BlogSection {
  heading: string;
  heading_ru: string;
  heading_en?: string;
  body: string;
  body_ru: string;
  body_en?: string;
  image?: string;
  imageAlt?: string;
  imageAlt_ru?: string;
  imageAlt_en?: string;
}

/** One FAQ entry — rendered as a visible Q&A block at the end of the post
 *  AND emitted as FAQPage JSON-LD (Google requires the content to be visible
 *  on the page for the rich result to qualify). */
export interface BlogFaqItem {
  q: string;
  q_ru: string;
  q_en?: string;
  a: string;
  a_ru: string;
  a_en?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  title_ru: string;
  title_en?: string;
  description: string;
  description_ru: string;
  description_en?: string;
  date: string;
  heroImage?: string;
  heroImage_ru?: string;
  heroImage_en?: string;
  intro?: string;
  intro_ru?: string;
  intro_en?: string;
  published?: boolean;
  sections: BlogSection[];
  faq?: BlogFaqItem[];
}

const blogRoot = path.join(process.cwd(), 'content', 'blog');

/** Blog is split by learning subject, mirroring the app's `/chinese` `/arabic`
 *  URL structure: posts live in `content/blog/{subject}/` and are served at
 *  `/{locale}/{subject}/blog/...`. To add articles for a new language, create
 *  `content/blog/{subject}/` + a `/{locale}/{subject}/blog` route. */
export async function loadBlogPosts(subject = 'chinese'): Promise<BlogPost[]> {
  const dir = path.join(blogRoot, subject);
  let files: string[];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const posts: BlogPost[] = [];

  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), 'utf-8');
    const post = JSON.parse(raw);
    if (post.published !== false) {
      posts.push(post);
    }
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadBlogPost(slug: string, subject = 'chinese'): Promise<BlogPost | null> {
  const filePath = path.join(blogRoot, subject, `${slug}.json`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
  const post = JSON.parse(raw);
  if (post.published === false) return null;
  return post;
}
