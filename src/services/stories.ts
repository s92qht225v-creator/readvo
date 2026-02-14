import fs from 'fs/promises';
import path from 'path';

const STORIES_DIR = path.join(process.cwd(), 'content', 'stories');

export interface StoryInfo {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  level: number;
}

export interface StoryPage {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  level: number;
  audio_url?: string;
  sections: {
    id: string;
    type: string;
    heading: string;
    subheading: string;
    sentences: {
      id: string;
      text_original: string;
      pinyin: string;
      text_translation: string;
      text_translation_ru: string;
      start?: number;
      end?: number;
      words?: { i: [number, number]; p: string; t: string; tr: string; h?: number; l?: number }[];
    }[];
  }[];
}

export async function loadStoriesForBook(bookId: string): Promise<StoryInfo[]> {
  const bookDir = path.join(STORIES_DIR, bookId);
  const stories: StoryInfo[] = [];

  try {
    const files = await fs.readdir(bookDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const content = await fs.readFile(path.join(bookDir, file), 'utf-8');
      const data = JSON.parse(content) as StoryPage;

      stories.push({
        id: data.id,
        title: data.title,
        pinyin: data.pinyin,
        titleTranslation: data.titleTranslation,
        titleTranslation_ru: data.titleTranslation_ru,
        level: data.level,
      });
    }

    stories.sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, ''));
      const numB = parseInt(b.id.replace(/\D/g, ''));
      return numA - numB;
    });

    return stories;
  } catch {
    return [];
  }
}

export async function loadStory(bookId: string, storyId: string): Promise<StoryPage | null> {
  const bookDir = path.join(STORIES_DIR, bookId);

  try {
    const files = await fs.readdir(bookDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const content = await fs.readFile(path.join(bookDir, file), 'utf-8');
      const data = JSON.parse(content) as StoryPage;

      if (data.id === storyId) {
        return data;
      }
    }

    return null;
  } catch {
    return null;
  }
}
