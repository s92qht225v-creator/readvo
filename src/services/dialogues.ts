import { cache } from 'react';
import fs from 'fs/promises';
import path from 'path';
import { resolveVocab, type VocabRef, type VocabItem } from './glossary';

const DIALOGUES_DIR = path.join(process.cwd(), 'content', 'dialogues');

export interface DialogueInfo {
  id: string;
  slug: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  level: number;
  tag?: string;
  dateAdded?: string;
  /** Card thumbnail / hero image URL (Supabase). Absent → branded watermark. */
  image?: string;
}

export interface DialoguePage {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
  level: number;
  tag?: string;
  dateAdded?: string;
  audio_url?: string;
  /** Opt-in: dictation uses pinyin-syllable tiles instead of Han characters
   *  (HSK 1 prototype). */
  dictationPinyin?: boolean;
  /** Per-dialogue speaker→MiMo-voice override (e.g. swap A/B genders for one
   *  dialogue). Merged over the global DIALOGUE_VOICE map. */
  voices?: Record<string, string>;
  /** Hero image URL (Supabase). Absent → branded placeholder is used. */
  image?: string;
  /** Public SEO description, per locale. Absent → falls back to title translation. */
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  /** Short topical category shown above the description (per locale). */
  category_uz?: string;
  category_ru?: string;
  category_en?: string;
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
      start?: number;
      end?: number;
      words?: { i: [number, number]; p: string; t: string; tr: string; h?: number; l?: number }[];
    }[];
  }[];
  vocab?: VocabRef[];
  phrases?: {
    zh: string;
    py: string;
    uz: string;
    ru: string;
    en?: string;
  }[];
  timeOfDay?: {
    zh: string;
    py: string;
    uz: string;
    ru: string;
    en?: string;
    icon: string;
  }[];
  extraVocab?: {
    zh: string;
    py: string;
    uz: string;
    ru: string;
    en?: string;
    icon?: string;
  }[];
  extraVocabSubtitle_uz?: string;
  extraVocabSubtitle_ru?: string;
  extraVocabSubtitle_en?: string;
  quiz?: {
    q_uz: string;
    q_ru: string;
    options_uz: string[];
    options_ru: string[];
    correct: number;
  }[];
}

export async function loadDialoguesForBook(bookId: string): Promise<DialogueInfo[]> {
  const bookDir = path.join(DIALOGUES_DIR, bookId);

  try {
    const files = await fs.readdir(bookDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const dialogues = await Promise.all(
      jsonFiles.map(async (file): Promise<DialogueInfo> => {
        const content = await fs.readFile(path.join(bookDir, file), 'utf-8');
        const data = JSON.parse(content) as DialoguePage;
        return {
          id: data.id,
          slug: (data as DialoguePage & { slug?: string }).slug || data.id,
          title: data.title,
          pinyin: data.pinyin,
          titleTranslation: data.titleTranslation,
          titleTranslation_ru: data.titleTranslation_ru,
          titleTranslation_en: data.titleTranslation_en,
          level: data.level,
          tag: data.tag,
          dateAdded: data.dateAdded,
          image: (data as DialoguePage & { image?: string }).image,
        };
      })
    );

    dialogues.sort((a, b) => {
      const dateA = a.dateAdded || '';
      const dateB = b.dateAdded || '';
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      const numA = parseInt(a.id.replace(/\D/g, ''));
      const numB = parseInt(b.id.replace(/\D/g, ''));
      return numB - numA;
    });

    return dialogues;
  } catch {
    return [];
  }
}

export async function loadDialogue(bookId: string, dialogueId: string): Promise<DialoguePage | null> {
  const bookDir = path.join(DIALOGUES_DIR, bookId);

  // Try direct file lookup first (most dialogues use their slug as filename)
  for (const filename of [`${dialogueId}.json`]) {
    try {
      const content = await fs.readFile(path.join(bookDir, filename), 'utf-8');
      return JSON.parse(content) as DialoguePage;
    } catch { /* file doesn't exist, fall through */ }
  }

  // Fallback: scan directory for matching id or slug. Read/parse each file in
  // its own try/catch so one malformed JSON file doesn't abort the whole scan
  // (which would 404 every other dialogue whose slug ≠ filename).
  let files: string[];
  try {
    files = await fs.readdir(bookDir);
  } catch {
    return null;
  }
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const content = await fs.readFile(path.join(bookDir, file), 'utf-8');
      const data = JSON.parse(content) as DialoguePage;
      const slug = (data as DialoguePage & { slug?: string }).slug;
      if (slug === dialogueId || data.id === dialogueId) {
        return data;
      }
    } catch (e) {
      console.error(`[dialogues] failed to read/parse ${bookId}/${file}:`, e);
    }
  }
  return null;
}

/**
 * Request-scoped memoized loadDialogue. generateMetadata and the page body both
 * need the same dialogue; React's cache() dedupes them to a single read per
 * render (and avoids running the O(N) slug→file fallback scan twice).
 */
export const getDialogue = cache(loadDialogue);

export type DialoguePageResolved = Omit<DialoguePage, 'vocab'> & { vocab?: VocabItem[] };

/** Resolve a dialogue's vocab references against the glossary (server-side). */
export async function resolveDialogueVocab(d: DialoguePage): Promise<DialoguePageResolved> {
  if (!d.vocab) return { ...d, vocab: undefined };
  try {
    return { ...d, vocab: await resolveVocab(d.vocab) };
  } catch (e) {
    // getGlossary throws on a Supabase error (so the failure isn't cached);
    // fall back to undefined → DialogueReader's auto-extract path.
    console.error('[glossary] resolve failed, falling back to auto-extract:', e);
    return { ...d, vocab: undefined };
  }
}
