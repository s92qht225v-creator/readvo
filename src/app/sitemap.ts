import fs from 'fs';
import path from 'path';
import type { MetadataRoute } from 'next';
import { loadBlogPosts } from '@/services/blog';
import { loadDialoguesForBook } from '@/services';
import { routing } from '@/i18n/routing';

const HSK_BOOKS = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';
const locales = routing.locales;

/** Last-modified time of a dialogue's source JSON (real freshness signal for
 *  crawlers). `id` is `{book}-dialogueN`; the file is `dialogueN.json`. */
function dialogueMtime(book: string, id: string): Date | undefined {
  const file = path.join(process.cwd(), 'content', 'dialogues', book, `${id.replace(`${book}-`, '')}.json`);
  try {
    return fs.statSync(file).mtime;
  } catch {
    return undefined;
  }
}

/** Build alternates.languages object for a given path */
function langAlternates(urlPath: string): Record<string, string> {
  const alts: Record<string, string> = {};
  for (const l of locales) alts[l] = `${siteUrl}/${l}${urlPath}`;
  alts['x-default'] = `${siteUrl}/uz${urlPath}`;
  return alts;
}

/** Create a sitemap entry for each locale with hreflang alternates */
function localeEntries(urlPath: string, opts: { changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number; lastModified?: Date }): MetadataRoute.Sitemap {
  const alternates = { languages: langAlternates(urlPath) };
  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}${urlPath}`,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
    alternates,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only publicly crawlable pages belong in the sitemap. The catalog/landing
  // pages are public, as are the individual Chinese dialogue reader pages —
  // each renders a public preview (hero + description + teaser + vocab) and
  // gates only the full dialogue. Other `/chinese/*` reader content (flashcards,
  // karaoke, writing) stays behind the login wall, so only its catalog is listed.
  const blogPosts = await loadBlogPosts();

  const entries: MetadataRoute.Sitemap = [];

  entries.push(...localeEntries('', { changeFrequency: 'monthly', priority: 1 }));

  // Individual Chinese dialogue reader pages (public preview — crawlable).
  // Track the newest dialogue change so the catalog carries a real lastModified.
  let newestDialogue: Date | undefined;
  const dialogueEntries: MetadataRoute.Sitemap = [];
  for (const book of HSK_BOOKS) {
    const dialogues = await loadDialoguesForBook(book);
    for (const d of dialogues) {
      const lastModified = dialogueMtime(book, d.id);
      if (lastModified && (!newestDialogue || lastModified > newestDialogue)) newestDialogue = lastModified;
      dialogueEntries.push(...localeEntries(`/chinese/dialogues/${book}/${d.slug}`, { changeFrequency: 'monthly', priority: 0.7, lastModified }));
    }
  }
  entries.push(...localeEntries('/chinese/dialogues', { changeFrequency: 'weekly', priority: 0.9, lastModified: newestDialogue }));
  entries.push(...dialogueEntries);
  entries.push(...localeEntries('/chinese/writing', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/chinese/flashcards', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/chinese/karaoke', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/chinese/grammar', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/arabic/dialogues', { changeFrequency: 'weekly', priority: 0.9 }));
  entries.push(...localeEntries('/arabic/story', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/arabic/flashcards', { changeFrequency: 'weekly', priority: 0.8 }));

  entries.push(...localeEntries('/blog', { changeFrequency: 'weekly', priority: 0.7 }));
  for (const p of blogPosts) {
    entries.push(...localeEntries(`/blog/${p.slug}`, { changeFrequency: 'monthly', priority: 0.6 }));
  }

  return entries;
}
