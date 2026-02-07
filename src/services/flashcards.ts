/**
 * Flashcard Service
 *
 * Loads flashcard deck data from the file system.
 */

import fs from 'fs/promises';
import path from 'path';
import type { FlashcardDeckData } from '@/types';

const FLASHCARD_DIR = path.join(process.cwd(), 'content', 'flashcards');

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
