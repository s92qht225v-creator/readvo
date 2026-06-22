import type { MetadataRoute } from 'next';
import { loadBlogPosts } from '@/services/blog';
import { routing } from '@/i18n/routing';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';
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
  // Only publicly crawlable pages belong in the sitemap. All `/chinese/hsk*`
  // content (dialogues, grammar, flashcards, karaoke, writing) sits behind the
  // login wall — `src/proxy.ts` 307-redirects Googlebot to /login — so listing
  // those URLs only advertises pages crawlers can never read. The crawlable
  // surface is the marketing/landing pages: home, the `/chinese` catalog
  // (public; the middleware only gates `/chinese/hsk*`), and the blog.
  const blogPosts = await loadBlogPosts();

  const entries: MetadataRoute.Sitemap = [];

  entries.push(...localeEntries('', { changeFrequency: 'monthly', priority: 1 }));
  entries.push(...localeEntries('/chinese/dialogues', { changeFrequency: 'weekly', priority: 0.9 }));
  entries.push(...localeEntries('/chinese/writing', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/chinese/flashcards', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/chinese/karaoke', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/chinese/grammar', { changeFrequency: 'weekly', priority: 0.8 }));
  entries.push(...localeEntries('/arabic/dialogues', { changeFrequency: 'weekly', priority: 0.9 }));
  entries.push(...localeEntries('/arabic/flashcards', { changeFrequency: 'weekly', priority: 0.8 }));

  entries.push(...localeEntries('/blog', { changeFrequency: 'weekly', priority: 0.7 }));
  for (const p of blogPosts) {
    entries.push(...localeEntries(`/blog/${p.slug}`, { changeFrequency: 'monthly', priority: 0.6 }));
  }

  return entries;
}
