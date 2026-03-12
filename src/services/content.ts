/**
 * Content Service
 *
 * Provides lesson metadata from static JSON.
 * Lesson page reader was removed — only header data is needed
 * for flashcard list pages and language page catalog.
 */

import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Lesson info for flashcard and catalog pages
 */
export interface LessonInfo {
  lessonId: string;
  lessonNumber: number;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  pages: number[];
}

interface LessonEntry {
  lessonNumber: number;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  pages: number;
}

/**
 * Get lesson info from static hsk1-lessons.json.
 */
export async function getLessonsWithInfo(): Promise<LessonInfo[]> {
  const filePath = path.join(CONTENT_DIR, 'hsk1-lessons.json');
  const content = await fs.readFile(filePath, 'utf-8');
  const entries = JSON.parse(content) as LessonEntry[];

  return entries.map((e) => ({
    lessonId: String(e.lessonNumber),
    lessonNumber: e.lessonNumber,
    title: e.title,
    pinyin: e.pinyin,
    titleTranslation: e.titleTranslation,
    titleTranslation_ru: e.titleTranslation_ru,
    titleTranslation_en: e.titleTranslation_en,
    pages: Array.from({ length: e.pages }, (_, i) => i + 1),
  }));
}
