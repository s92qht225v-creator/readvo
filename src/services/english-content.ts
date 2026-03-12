/**
 * English Content Service
 *
 * Loads and validates page content for English books (e.g., Destination B1).
 * Parallel to content.ts (Chinese) — separate service, zero coupling.
 */

import fs from 'fs/promises';
import path from 'path';
import type { Page } from '@/types';
import { validatePage } from '@/validation';
import type { LessonInfo } from './content';

interface ContentEntry {
  lessonId: string;
  pageNum: number;
  pageId: string;
  filePath: string;
}

// Content directory for English books
const ENGLISH_CONTENT_DIR = path.join(process.cwd(), 'content', 'english');

/**
 * Book-order sort key for Destination B1.
 * Units, reviews, and progress tests interleave in the textbook.
 * Key format: units = number, reviews = "r{N}", progress tests = "pt{N}"
 */
const BOOK_ORDER: string[] = [
  '1','2','3','r1',
  '4','5','6','r2',
  '7','8','9','r3',
  '10','11','12','r4',
  '13','14','15','r5',
  '16','17','18','r6',
  '19','20','21','r7','pt1',
  '22','23','24','r8',
  '25','26','27','r9',
  '28','29','30','r10',
  '31','32','33','r11',
  '34','35','36','r12',
  '37','38','39','r13',
  '40','41','42','r14','pt2',
];

function getSortKey(lessonId: string): number {
  const idx = BOOK_ORDER.indexOf(lessonId);
  return idx >= 0 ? idx : 999;
}

/**
 * Parse a content filename into lessonId and pageNum.
 * Supports: unit{N}-page{M}.json, review{N}-page{M}.json, progress-test{N}-page{M}.json
 */
function parseContentFilename(file: string): { lessonId: string; pageNum: number } | null {
  const unitMatch = file.match(/^unit(\d+)-page(\d+)\.json$/);
  if (unitMatch) return { lessonId: unitMatch[1], pageNum: parseInt(unitMatch[2], 10) };

  const reviewMatch = file.match(/^review(\d+)-page(\d+)\.json$/);
  if (reviewMatch) return { lessonId: `r${reviewMatch[1]}`, pageNum: parseInt(reviewMatch[2], 10) };

  const ptMatch = file.match(/^progress-test(\d+)-page(\d+)\.json$/);
  if (ptMatch) return { lessonId: `pt${ptMatch[1]}`, pageNum: parseInt(ptMatch[2], 10) };

  return null;
}

/**
 * Construct filename from lessonId and pageNum.
 */
function buildContentFilename(lessonId: string, pageNum: number): string {
  if (lessonId.startsWith('r')) return `review${lessonId.slice(1)}-page${pageNum}.json`;
  if (lessonId.startsWith('pt')) return `progress-test${lessonId.slice(2)}-page${pageNum}.json`;
  return `unit${lessonId}-page${pageNum}.json`;
}

/**
 * Get list of all available content files for an English book.
 * Filename patterns: unit{N}-page{M}.json, review{N}-page{M}.json, progress-test{N}-page{M}.json
 */
export async function getEnglishContentManifest(bookId: string): Promise<ContentEntry[]> {
  const entries: ContentEntry[] = [];
  const bookDir = path.join(ENGLISH_CONTENT_DIR, bookId);

  try {
    const files = await fs.readdir(bookDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const parsed = parseContentFilename(file);
      if (!parsed) {
        console.warn(`Skipping malformed English content filename: ${file}`);
        continue;
      }

      entries.push({
        lessonId: parsed.lessonId,
        pageNum: parsed.pageNum,
        pageId: file.replace('.json', ''),
        filePath: path.join(bookDir, file),
      });
    }

    entries.sort((a, b) => {
      const orderDiff = getSortKey(a.lessonId) - getSortKey(b.lessonId);
      if (orderDiff !== 0) return orderDiff;
      return a.pageNum - b.pageNum;
    });

    return entries;
  } catch (error) {
    console.error(`Failed to read English content directory for ${bookId}:`, error);
    return [];
  }
}

/**
 * Load and validate a single English page.
 */
export async function loadEnglishPage(bookId: string, unitId: string, pageNum: number): Promise<Page> {
  const filename = buildContentFilename(unitId, pageNum);
  const filePath = path.join(ENGLISH_CONTENT_DIR, bookId, filename);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as Page;

    validatePage(data, { allowEmptyTranslations: false });

    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`English page not found: ${bookId}, unit ${unitId}, page ${pageNum}`);
    }
    throw error;
  }
}

/**
 * Get navigation info for an English page (prev/next).
 */
export async function getEnglishPageNavigation(
  bookId: string,
  unitId: string,
  pageNum: number
): Promise<{
  prev: { lessonId: string; pageNum: number } | null;
  next: { lessonId: string; pageNum: number } | null;
}> {
  const manifest = await getEnglishContentManifest(bookId);
  const currentIndex = manifest.findIndex(
    (e) => e.lessonId === unitId && e.pageNum === pageNum
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
 * Get unit info with titles for book page.
 */
export async function getEnglishLessonsWithInfo(bookId: string): Promise<LessonInfo[]> {
  const manifest = await getEnglishContentManifest(bookId);

  // Group pages by unit
  const unitPages = manifest.reduce(
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

  for (const [unitId, pages] of Object.entries(unitPages)) {
    try {
      const firstPage = await loadEnglishPage(bookId, unitId, pages[0]);
      const header = firstPage.lessonHeader;

      lessons.push({
        lessonId: unitId,
        lessonNumber: header?.lessonNumber ?? parseInt(unitId),
        title: header?.title ?? `Unit ${unitId}`,
        pinyin: header?.pinyin ?? '',
        titleTranslation: header?.titleTranslation ?? `${unitId}-mavzu`,
        titleTranslation_ru: header?.titleTranslation_ru ?? `Раздел ${unitId}`,
        pages: pages.sort((a, b) => a - b),
      });
    } catch {
      lessons.push({
        lessonId: unitId,
        lessonNumber: parseInt(unitId),
        title: `Unit ${unitId}`,
        pinyin: '',
        titleTranslation: `${unitId}-mavzu`,
        titleTranslation_ru: `Раздел ${unitId}`,
        pages: pages.sort((a, b) => a - b),
      });
    }
  }

  lessons.sort((a, b) => getSortKey(a.lessonId) - getSortKey(b.lessonId));

  return lessons;
}
