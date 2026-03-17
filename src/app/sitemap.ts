import type { MetadataRoute } from 'next';
import { loadDialoguesForBook } from '@/services/dialogues';
import { loadKaraokeSongs } from '@/services/karaoke';
import { loadFlashcardDeck } from '@/services/flashcards';
import { loadBlogPosts } from '@/services/blog';
import { WRITING_SETS, WRITING_SETS_HSK2, WRITING_SETS_HSK2_L2, WRITING_SETS_HSK3, WRITING_SETS_HSK4, WRITING_SETS_HSK5, WRITING_SETS_HSK6 } from '@/services/writing';
import { routing } from '@/i18n/routing';
import fs from 'fs';
import path from 'path';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';
const locales = routing.locales;

/** Build alternates.languages object for a given path */
function langAlternates(urlPath: string): Record<string, string> {
  const alts: Record<string, string> = {};
  for (const l of locales) alts[l] = `${siteUrl}/${l}${urlPath}`;
  alts['x-default'] = `${siteUrl}/uz${urlPath}`;
  return alts;
}

/** Create a sitemap entry for each locale with hreflang alternates */
function localeEntries(urlPath: string, opts: { changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }): MetadataRoute.Sitemap {
  const alternates = { languages: langAlternates(urlPath) };
  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}${urlPath}`,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [dialogues, songs, flashcardDeck, blogPosts] = await Promise.all([
    loadDialoguesForBook('hsk1'),
    loadKaraokeSongs(),
    loadFlashcardDeck('hsk1'),
    loadBlogPosts(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(...localeEntries('', { changeFrequency: 'monthly', priority: 1 }));
  entries.push(...localeEntries('/chinese', { changeFrequency: 'weekly', priority: 0.9 }));
  // Tab variants (skip dialogues=default, flashcards/tests=auth-gated)
  for (const tab of ['grammar', 'writing', 'karaoke']) {
    entries.push(...localeEntries(`/chinese?tab=${tab}`, { changeFrequency: 'monthly', priority: 0.7 }));
  }

  // Grammar pages
  for (const slug of ['shenme', 'shi', 'ma', 'shei', 'na', 'you', 'zai', 'de', 'bu', 'ne', 'le', 'ye', 'dou', 'hen', 'xiang', 'hui', 'neng', 'mei', 'ji', 'liangci']) {
    entries.push(...localeEntries(`/chinese/hsk1/grammar/${slug}`, { changeFrequency: 'monthly', priority: 0.7 }));
  }

  // Dialogue pages
  for (const d of dialogues) {
    entries.push(...localeEntries(`/chinese/hsk1/dialogues/${d.slug}`, { changeFrequency: 'monthly', priority: 0.6 }));
  }

  // Karaoke pages
  for (const s of songs) {
    entries.push(...localeEntries(`/chinese/hsk1/karaoke/${s.id}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  // Flashcard lesson pages
  const flashcardLessons = new Set(flashcardDeck?.words.map((w) => w.lesson).filter(Boolean) || []);
  for (const lesson of flashcardLessons) {
    entries.push(...localeEntries(`/chinese/hsk1/flashcards/${lesson}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  // HSK 1 flashcard set pages
  for (const set of WRITING_SETS) {
    entries.push(...localeEntries(`/chinese/hsk1/flashcards/${set.id}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  // HSK 2 flashcard set pages
  for (const set of WRITING_SETS_HSK2_L2) {
    entries.push(...localeEntries(`/chinese/hsk2/flashcards/${set.id}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  // HSK 3 flashcard set pages
  for (const set of WRITING_SETS_HSK3) {
    entries.push(...localeEntries(`/chinese/hsk3/flashcards/${set.id}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  // Topic flashcard pages
  const topicsDir = path.join(process.cwd(), 'content', 'flashcards', 'topics');
  try {
    const topicFiles = fs.readdirSync(topicsDir).filter((f) => f.endsWith('.json'));
    for (const f of topicFiles) {
      entries.push(...localeEntries(`/chinese/hsk1/flashcards/topic/${f.replace('.json', '')}`, { changeFrequency: 'monthly', priority: 0.5 }));
    }
  } catch { /* topics dir may not exist */ }

  // Writing practice pages
  for (const set of [...WRITING_SETS, ...WRITING_SETS_HSK2, ...WRITING_SETS_HSK2_L2, ...WRITING_SETS_HSK3, ...WRITING_SETS_HSK4, ...WRITING_SETS_HSK5, ...WRITING_SETS_HSK6]) {
    entries.push(...localeEntries(`/chinese/hsk1/writing/${set.id}`, { changeFrequency: 'monthly', priority: 0.5 }));
  }

  // Blog pages
  entries.push(...localeEntries('/blog', { changeFrequency: 'weekly', priority: 0.7 }));
  for (const p of blogPosts) {
    entries.push(...localeEntries(`/blog/${p.slug}`, { changeFrequency: 'monthly', priority: 0.6 }));
  }

  return entries;
}
