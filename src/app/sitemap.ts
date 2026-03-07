import type { MetadataRoute } from 'next';
import { loadDialoguesForBook } from '@/services/dialogues';

import { loadKaraokeSongs } from '@/services/karaoke';
import { loadFlashcardDeck } from '@/services/flashcards';
import { loadBlogPosts } from '@/services/blog';

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

  // Dialogue pages
  const dialoguePages: MetadataRoute.Sitemap = dialogues.map((d) => ({
    url: `${siteUrl}/chinese/hsk1/dialogues/${d.id}`,
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
    ...grammarPages,
    ...dialoguePages,
    ...karaokePages,
    ...flashcardPages,
    ...blogPages,
  ];
}
