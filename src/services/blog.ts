import fs from 'fs';
import path from 'path';

export interface BlogSection {
  heading: string;
  heading_ru: string;
  body: string;
  body_ru: string;
  image?: string;
  imageAlt?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  title_ru: string;
  description: string;
  description_ru: string;
  date: string;
  heroImage?: string;
  intro?: string;
  intro_ru?: string;
  published?: boolean;
  sections: BlogSection[];
}

const blogDir = path.join(process.cwd(), 'content', 'blog');

export async function loadBlogPosts(): Promise<BlogPost[]> {
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.json'));
  const posts: BlogPost[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const post = JSON.parse(raw);
    if (post.published !== false) {
      posts.push(post);
    }
  }

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export async function loadBlogPost(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(blogDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const post = JSON.parse(raw);
  if (post.published === false) return null;
  return post;
}
