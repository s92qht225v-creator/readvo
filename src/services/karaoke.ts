import fs from 'fs/promises';
import path from 'path';

const KARAOKE_DIR = path.join(process.cwd(), 'content', 'karaoke');

export interface KaraokeChar {
  id: number;
  text: string;
  timestamp: number;
  duration: number;
}

export interface KaraokeLine {
  id: number;
  words: KaraokeChar[];
}

export interface KaraokeSong {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  artist: string;
  artist_ru: string;
  audio_url: string;
  lines: KaraokeLine[];
}

export async function loadKaraokeSong(songId: string): Promise<KaraokeSong | null> {
  try {
    const filePath = path.join(KARAOKE_DIR, `${songId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content) as KaraokeSong;
    return data;
  } catch {
    return null;
  }
}

export async function loadKaraokeSongs(): Promise<{ id: string; title: string; pinyin: string; titleTranslation: string; titleTranslation_ru: string; artist: string; artist_ru: string }[]> {
  try {
    const files = await fs.readdir(KARAOKE_DIR);
    const songs = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const content = await fs.readFile(path.join(KARAOKE_DIR, file), 'utf-8');
      const data = JSON.parse(content) as KaraokeSong;
      songs.push({
        id: data.id,
        title: data.title,
        pinyin: data.pinyin,
        titleTranslation: data.titleTranslation,
        titleTranslation_ru: data.titleTranslation_ru,
        artist: data.artist,
        artist_ru: data.artist_ru,
      });
    }

    return songs;
  } catch {
    return [];
  }
}
