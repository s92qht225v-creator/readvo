import fs from 'fs/promises';
import path from 'path';

const DIALOGUES_DIR = path.join(process.cwd(), 'content', 'dialogues');

export interface DialogueInfo {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
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
      speaker?: string;
      audio_url?: string;
      start?: number;
      end?: number;
      words?: { i: [number, number]; p: string; t: string; tr: string; h?: number; l?: number }[];
    }[];
  }[];
}

export async function loadDialoguesForBook(bookId: string): Promise<DialogueInfo[]> {
  const bookDir = path.join(DIALOGUES_DIR, bookId);
  const dialogues: DialogueInfo[] = [];

  try {
    const files = await fs.readdir(bookDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const content = await fs.readFile(path.join(bookDir, file), 'utf-8');
      const data = JSON.parse(content) as DialoguePage;

      dialogues.push({
        id: data.id,
        title: data.title,
        pinyin: data.pinyin,
        titleTranslation: data.titleTranslation,
        titleTranslation_ru: data.titleTranslation_ru,
        level: data.level,
        tag: data.tag,
        dateAdded: data.dateAdded,
      });
    }

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

  try {
    const files = await fs.readdir(bookDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const content = await fs.readFile(path.join(bookDir, file), 'utf-8');
      const data = JSON.parse(content) as DialoguePage;

      if (data.id === dialogueId) {
        return data;
      }
    }

    return null;
  } catch {
    return null;
  }
}
