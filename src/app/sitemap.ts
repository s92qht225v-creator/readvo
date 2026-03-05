import type { MetadataRoute } from 'next';
import { loadDialoguesForBook } from '@/services/dialogues';
import { loadStoriesForBook } from '@/services/stories';
import { loadKaraokeSongs } from '@/services/karaoke';
import { loadFlashcardDeck } from '@/services/flashcards';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [dialogues, stories, songs, flashcardDeck] = await Promise.all([
    loadDialoguesForBook('hsk1'),
    loadStoriesForBook('hsk2'),
    loadKaraokeSongs(),
    loadFlashcardDeck('hsk1'),
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
    { url: `${siteUrl}/chinese/hsk2/stories`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Dialogue pages
  const dialoguePages: MetadataRoute.Sitemap = dialogues.map((d) => ({
    url: `${siteUrl}/chinese/hsk1/dialogues/${d.id}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Story pages
  const storyPages: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${siteUrl}/chinese/hsk2/stories/${s.id}`,
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

  return [
    ...staticPages,
    ...grammarPages,
    ...dialoguePages,
    ...storyPages,
    ...karaokePages,
    ...flashcardPages,
  ];
}
