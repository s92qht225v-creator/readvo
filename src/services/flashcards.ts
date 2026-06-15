/**
 * Flashcard Service
 *
 * Loads flashcard deck data from the file system.
 */

import fs from 'fs/promises';
import path from 'path';
import type { FlashcardDeckData } from '@/types';
import { getWritingSet } from '@/services/writing';

const FLASHCARD_DIR = path.join(process.cwd(), 'content', 'flashcards');

const WRITING_AUDIO_BASE =
  'https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201/Writing';

function getWritingAudioUrl(char: string, pinyin: string): string {
  const first = pinyin.split(' / ')[0];
  const stripped = first
    .replace(/[ǖǘǚǜü]/gi, 'v')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s']/g, '')
    .toLowerCase();
  const unicode = Array.from(char)
    .map((c) => c.codePointAt(0))
    .join('');
  return `${WRITING_AUDIO_BASE}/${stripped}_${unicode}.mp3`;
}

function isWritingSetId(id: string): boolean {
  return id.startsWith('hsk') && id.includes('-set');
}

/**
 * Load a flashcard deck by book identifier.
 * Returns null if deck not found.
 */
export async function loadFlashcardDeck(bookId: string): Promise<FlashcardDeckData | null> {
  const filePath = path.join(FLASHCARD_DIR, `${bookId}.json`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as FlashcardDeckData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Build a flashcard deck for the gated content endpoint.
 * Returns the deck plus a flag indicating whether it is free (no entitlement needed).
 * Returns null if the book/deckId combination is not found.
 *
 * Free decks: hsk1 lesson 1 (numeric lessonId === 1).
 * All writing-set decks are paid.
 */
export async function buildFlashcardDeck(
  book: string,
  deckId: string,
): Promise<{ deck: FlashcardDeckData; isFree: boolean } | null> {
  // hsk1 numeric lesson — words have a `lesson` field; lesson 1 is free
  if (book === 'hsk1' && /^\d+$/.test(deckId)) {
    const full = await loadFlashcardDeck('hsk1');
    if (!full) return null;
    const n = Number(deckId);
    const words = full.words
      .filter((w) => w.lesson === n)
      .map((w) => ({
        id: w.id,
        text_original: w.text_original,
        pinyin: w.pinyin,
        text_translation: w.text_translation,
        text_translation_ru: w.text_translation_ru,
        text_translation_en: w.text_translation_en,
        lesson: w.lesson,
        audio_url: w.audio_url,
      }));
    if (!words.length) return null;
    return {
      deck: {
        id: `${full.id}-lesson${n}`,
        title: `${n}-dars`,
        title_ru: `Урок ${n}`,
        words,
      },
      isFree: n === 1,
    };
  }

  // Writing-set decks (hsk1-setN / hsk2-setN / hsk3-setN / etc.) — all paid
  if (isWritingSetId(deckId)) {
    const set = getWritingSet(deckId);
    if (!set) return null;
    const setNum = deckId.split('-set')[1];
    const words = set.words.map((w, i) => ({
      id: `${deckId}-${i}`,
      text_original: w.char,
      pinyin: w.pinyin,
      text_translation: w.uz,
      text_translation_ru: w.ru,
      text_translation_en: w.en,
      audio_url: getWritingAudioUrl(w.char, w.pinyin),
    }));
    return {
      deck: {
        id: deckId,
        title: `${setNum}-to'plam`,
        title_ru: `Набор ${setNum}`,
        words,
      },
      isFree: false,
    };
  }

  return null;
}
