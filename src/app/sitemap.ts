import type { MetadataRoute } from 'next';
import { loadDialoguesForBook } from '@/services/dialogues';

import { loadKaraokeSongs } from '@/services/karaoke';
import { loadFlashcardDeck } from '@/services/flashcards';
import { loadBlogPosts } from '@/services/blog';
import { WRITING_SETS } from '@/services/writing';
import fs from 'fs';
import path from 'path';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [dialogues, songs, flashcardDeck, blogPosts] = await Promise.all([
    loadDialoguesForBook('hsk1'),
    loadKaraokeSongs(),
    loadFlashcardDeck('hsk1'),
    loadBlogPosts(),
  ]);

  // Grammar pages
  const grammarPages: MetadataRoute.Sitemap = ['shi', 'you', 'zai', 'de', 'bu', 'ma', 'ne', 'le', 'ye', 'dou', 'hen', 'xiang', 'hui', 'neng', 'mei', 'ji', 'liangci'].map((slug) => ({
    url: `${siteUrl}/chinese/hsk1/grammar/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/chinese`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/chinese/hsk1/flashcards`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Lesson pages (15 lessons × 3 pages)
  const lessonPages: MetadataRoute.Sitemap = [];
  for (let lesson = 1; lesson <= 15; lesson++) {
    for (let page = 1; page <= 3; page++) {
      lessonPages.push({
        url: `${siteUrl}/chinese/hsk1/lesson/${lesson}/page/${page}`,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  // Dialogue pages
  const dialoguePages: MetadataRoute.Sitemap = dialogues.map((d) => ({
    url: `${siteUrl}/chinese/hsk1/dialogues/${d.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Karaoke pages
  const karaokePages: MetadataRoute.Sitemap = songs.map((s) => ({
    url: `${siteUrl}/chinese/hsk1/karaoke/${s.id}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // Flashcard lesson pages
  const flashcardLessons = new Set(flashcardDeck?.words.map((w) => w.lesson).filter(Boolean) || []);
  const flashcardPages: MetadataRoute.Sitemap = Array.from(flashcardLessons).map((lesson) => ({
    url: `${siteUrl}/chinese/hsk1/flashcards/${lesson}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // Topic flashcard pages
  const topicsDir = path.join(process.cwd(), 'content', 'flashcards', 'topics');
  let topicPages: MetadataRoute.Sitemap = [];
  try {
    const topicFiles = fs.readdirSync(topicsDir).filter((f) => f.endsWith('.json'));
    topicPages = topicFiles.map((f) => ({
      url: `${siteUrl}/chinese/hsk1/flashcards/topic/${f.replace('.json', '')}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch { /* topics dir may not exist */ }

  // Writing practice pages
  const writingPages: MetadataRoute.Sitemap = WRITING_SETS.map((set) => ({
    url: `${siteUrl}/chinese/hsk1/writing/${set.id}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    ...blogPosts.map((p) => ({
      url: `${siteUrl}/blog/${p.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return [
    ...staticPages,
    ...lessonPages,
    ...grammarPages,
    ...dialoguePages,
    ...karaokePages,
    ...flashcardPages,
    ...topicPages,
    ...writingPages,
    ...blogPages,
  ];
}
