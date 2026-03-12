import fs from 'fs/promises';
import path from 'path';

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
  vocab?: {
    zh: string;
    py: string;
    uz: string;
    ru: string;
    en?: string;
    ex: string;
    expy: string;
    ex_uz: string;
    ex_ru: string;
    ex_en?: string;
  }[];
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
  grammarNotes?: {
    pattern: string;
    title_uz: string;
    title_ru: string;
    title_en?: string;
    desc_uz: string;
    desc_ru: string;
    desc_en?: string;
    formula?: string;
    formula_ru?: string;
    formula_en?: string;
    ex?: string;
    expy?: string;
    ex_uz?: string;
    ex_ru?: string;
    ex_en?: string;
    tip_uz?: string;
    tip_ru?: string;
    tip_en?: string;
    examples?: { zh: string; py: string; uz: string; ru: string; en?: string }[];
  }[];
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

  // Fallback: scan directory for matching id or slug
  try {
    const files = await fs.readdir(bookDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const content = await fs.readFile(path.join(bookDir, file), 'utf-8');
      const data = JSON.parse(content) as DialoguePage;
      const slug = (data as DialoguePage & { slug?: string }).slug;
      if (slug === dialogueId || data.id === dialogueId) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
  }
}
