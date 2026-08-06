import fs from 'fs';
import path from 'path';

/**
 * HSK textbook lessons — a course, not a catalog.
 *
 * Unlike `content/dialogues` (browse by topic, any order), this is lesson-by-
 * lesson material that follows a published course's structure so a learner
 * holding the book can find "unit 3" and get unit 3. The book is identified by
 * a `book` slug because more than one HSK series is in use, and they divide the
 * same official vocabulary into different lessons.
 *
 * Each lesson holds one or more TEXTS. A text is stored in exactly the dialogue
 * shape, so `DialogueReader` renders it with no changes — audio, progressive
 * pinyin, vocab cards, dictation and role-play all come for free.
 */

export interface HskText {
  id: string;
  slug: string;                 // 'text-1'
  label: string;                // 课文一
  labelTranslation: string;
  labelTranslation_ru?: string;
  labelTranslation_en?: string;
  level: number;
  dictationKeyboard?: boolean;
  dictationPinyin?: boolean;
  /** Per-speaker TTS voice override for this text — a lesson's speakers differ
   *  from text to text, and a character should keep one voice across both. */
  voices?: Record<string, string>;
  vocab?: unknown[];
  /** Same section shape as a dialogue — that's what lets the reader take it as-is. */
  sections: {
    id: string;
    type: string;
    heading: string;
    subheading: string;
    audio_url?: string;
    sentences: {
      id: string;
      text_original: string;
      pinyin: string;
      text_translation: string;
      text_translation_ru: string;
      text_translation_en?: string;
      speaker?: string;
      audio_url?: string;
    }[];
  }[];
}

export interface HskProperNoun {
  zh: string; py: string; uz: string; ru: string; en: string;
}

export interface HskLesson {
  book: string;
  bookTitle: string;
  level: number;
  volume?: string;              // 上 / 下 — the physical book split, not a syllabus level
  unit: number;
  slug: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  properNouns?: HskProperNoun[];
  texts: HskText[];
}

const ROOT = path.join(process.cwd(), 'content', 'hsk');
const SAFE = /^[a-z0-9-]+$/;

/** All lessons of one book+level, ordered by unit. */
export function loadHskLessons(book: string, level: string): HskLesson[] {
  if (!SAFE.test(book) || !/^[1-6]$/.test(level)) return [];
  const dir = path.join(ROOT, book, level);
  let files: string[];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return [];               // book/level not authored yet — an empty list, not an error
  }
  const out: HskLesson[] = [];
  for (const f of files) {
    try {
      out.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as HskLesson);
    } catch {
      // a malformed lesson shouldn't take down the whole level listing
    }
  }
  return out.sort((a, b) => a.unit - b.unit);
}

export function getHskLesson(book: string, level: string, slug: string): HskLesson | null {
  return loadHskLessons(book, level).find((l) => l.slug === slug) ?? null;
}

export function getHskText(book: string, level: string, slug: string, textSlug: string) {
  const lesson = getHskLesson(book, level, slug);
  if (!lesson) return null;
  const text = lesson.texts.find((t) => t.slug === textSlug);
  return text ? { lesson, text } : null;
}

/** Books that actually have content, for routing and the picker. */
export function listHskBooks(): string[] {
  try {
    return fs.readdirSync(ROOT).filter((d) => SAFE.test(d) && fs.statSync(path.join(ROOT, d)).isDirectory());
  } catch {
    return [];
  }
}

/** Levels of a book that have at least one lesson. */
export function listHskLevels(book: string): string[] {
  if (!SAFE.test(book)) return [];
  try {
    return fs.readdirSync(path.join(ROOT, book))
      .filter((d) => /^[1-6]$/.test(d))
      .sort();
  } catch {
    return [];
  }
}
