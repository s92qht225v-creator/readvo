/**
 * Content Service
 *
 * Loads and validates page content from the file system.
 * Used at build time for static generation and at runtime for dev.
 *
 * RESPONSIBILITIES:
 * - Load JSON files from content directory
 * - Validate content before returning
 * - Provide manifest of available content
 *
 * NON-RESPONSIBILITIES:
 * - No caching (Next.js handles this)
 * - No runtime fetching in production (static generation)
 */

import fs from 'fs/promises';
import path from 'path';
import type { Page } from '@/types';
import { validatePage } from '@/validation';

// Content directory path
const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Content manifest entry
 */
export interface ContentEntry {
  lessonId: string;
  pageNum: number;
  pageId: string;
  filePath: string;
}

/**
 * Lesson info for home page display
 */
export interface LessonInfo {
  lessonId: string;
  lessonNumber: number;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  pages: number[];
}

/**
 * Book manifest for navigation
 */
export interface BookManifest {
  lessons: {
    id: string;
    title: string;
    pages: number[];
  }[];
}

/**
 * Get list of all available content files.
 * Used by generateStaticParams.
 */
export async function getContentManifest(): Promise<ContentEntry[]> {
  const entries: ContentEntry[] = [];

  try {
    const files = await fs.readdir(CONTENT_DIR);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      // Parse filename: lesson1-page1.json -> { lessonId: '1', pageNum: 1 }
      const match = file.match(/^lesson(\d+)-page(\d+)\.json$/);
      if (!match) {
        console.warn(`Skipping malformed content filename: ${file}`);
        continue;
      }

      entries.push({
        lessonId: match[1],
        pageNum: parseInt(match[2], 10),
        pageId: file.replace('.json', ''),
        filePath: path.join(CONTENT_DIR, file),
      });
    }

    // Sort by lesson, then page
    entries.sort((a, b) => {
      const lessonDiff = parseInt(a.lessonId) - parseInt(b.lessonId);
      if (lessonDiff !== 0) return lessonDiff;
      return a.pageNum - b.pageNum;
    });

    return entries;
  } catch (error) {
    console.error('Failed to read content directory:', error);
    return [];
  }
}

/**
 * Load and validate a single page.
 * Throws if page doesn't exist or fails validation.
 */
export async function loadPage(lessonId: string, pageNum: number): Promise<Page> {
  const filename = `lesson${lessonId}-page${pageNum}.json`;
  const filePath = path.join(CONTENT_DIR, filename);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as Page;

    // Validate before returning
    validatePage(data, { allowEmptyTranslations: false });

    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Page not found: lesson ${lessonId}, page ${pageNum}`);
    }
    throw error;
  }
}

/**
 * Get navigation info for a page (prev/next).
 */
export async function getPageNavigation(
  lessonId: string,
  pageNum: number
): Promise<{
  prev: { lessonId: string; pageNum: number } | null;
  next: { lessonId: string; pageNum: number } | null;
}> {
  const manifest = await getContentManifest();
  const currentIndex = manifest.findIndex(
    (e) => e.lessonId === lessonId && e.pageNum === pageNum
  );

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const prev = currentIndex > 0 ? manifest[currentIndex - 1] : null;
  const next = currentIndex < manifest.length - 1 ? manifest[currentIndex + 1] : null;

  return {
    prev: prev ? { lessonId: prev.lessonId, pageNum: prev.pageNum } : null,
    next: next ? { lessonId: next.lessonId, pageNum: next.pageNum } : null,
  };
}

/**
 * Check if a page exists.
 */
export async function pageExists(lessonId: string, pageNum: number): Promise<boolean> {
  const filename = `lesson${lessonId}-page${pageNum}.json`;
  const filePath = path.join(CONTENT_DIR, filename);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get lesson info with titles for home page.
 * Reads first page of each lesson to get lesson header.
 */
export async function getLessonsWithInfo(): Promise<LessonInfo[]> {
  const manifest = await getContentManifest();

  // Group pages by lesson
  const lessonPages = manifest.reduce(
    (acc, entry) => {
      if (!acc[entry.lessonId]) {
        acc[entry.lessonId] = [];
      }
      acc[entry.lessonId].push(entry.pageNum);
      return acc;
    },
    {} as Record<string, number[]>
  );

  const lessons: LessonInfo[] = [];

  for (const [lessonId, pages] of Object.entries(lessonPages)) {
    try {
      // Read first page to get lesson header
      const firstPage = await loadPage(lessonId, pages[0]);
      const header = firstPage.lessonHeader;

      lessons.push({
        lessonId,
        lessonNumber: header?.lessonNumber ?? parseInt(lessonId),
        title: header?.title ?? `第${lessonId}课`,
        pinyin: header?.pinyin ?? '',
        titleTranslation: header?.titleTranslation ?? `${lessonId}-dars`,
        titleTranslation_ru: header?.titleTranslation_ru ?? `Урок ${lessonId}`,
        pages: pages.sort((a, b) => a - b),
      });
    } catch (error) {
      // Fallback if page can't be loaded
      lessons.push({
        lessonId,
        lessonNumber: parseInt(lessonId),
        title: `第${lessonId}课`,
        pinyin: '',
        titleTranslation: `${lessonId}-dars`,
        titleTranslation_ru: `Урок ${lessonId}`,
        pages: pages.sort((a, b) => a - b),
      });
    }
  }

  // Sort by lesson number
  lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);

  return lessons;
}
