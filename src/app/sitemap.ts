import type { MetadataRoute } from 'next';
import { getContentManifest } from '@/services/content';
import { getEnglishContentManifest } from '@/services/english-content';
import { loadDialoguesForBook } from '@/services/dialogues';
import { loadStoriesForBook } from '@/services/stories';
import { loadKaraokeSongs } from '@/services/karaoke';
import { loadFlashcardDeck } from '@/services/flashcards';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [manifest, englishManifest, dialogues, stories, songs, flashcardDeck] = await Promise.all([
    getContentManifest(),
    getEnglishContentManifest('destination-b1'),
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

  // Static pages (/chinese/hsk1/dialogues removed — now redirects to /chinese?tab=dialogues)
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/chinese`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/chinese/hsk1`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/chinese/hsk1/flashcards`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/chinese/hsk2/stories`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/english`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/english/destination-b1`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Lesson pages
  const lessonPages: MetadataRoute.Sitemap = manifest.map((entry) => ({
    url: `${siteUrl}/chinese/hsk1/lesson/${entry.lessonId}/page/${entry.pageNum}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // English unit pages
  const englishPages: MetadataRoute.Sitemap = englishManifest.map((entry) => ({
    url: `${siteUrl}/english/destination-b1/unit/${entry.lessonId}/page/${entry.pageNum}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

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
    ...lessonPages,
    ...englishPages,
    ...dialoguePages,
    ...storyPages,
    ...karaokePages,
    ...flashcardPages,
  ];
}
