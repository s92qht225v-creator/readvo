/**
 * Content type definitions.
 *
 * The lesson-reader / exercise types that used to live here (Page, Section,
 * Sentence, SectionType, Matching/FillBlank/MultipleChoice/… cards, etc.) were
 * removed along with the lesson reader (~2026-03) — nothing consumed them. Only
 * the flashcard types remain, still used by the flashcard deck + services.
 * (Re-exported through `src/types/index.ts`.)
 */

/**
 * A single flashcard word.
 */
export interface FlashcardWord {
  /** Stable unique identifier (e.g., "fc-hsk1-001") */
  readonly id: string;

  /** Chinese character(s) */
  readonly text_original: string;

  /** Pinyin romanization with tone marks */
  readonly pinyin: string;

  /** Translation in Uzbek */
  readonly text_translation: string;

  /** Translation in Russian */
  readonly text_translation_ru?: string;

  /** Translation in English */
  readonly text_translation_en?: string;

  /** Which lesson this word comes from */
  readonly lesson?: number;

  /** Optional audio URL for pronunciation */
  readonly audio_url?: string;
}

/**
 * A flashcard deck for an HSK level.
 */
export interface FlashcardDeckData {
  /** Deck identifier */
  readonly id: string;

  /** Deck title (Uzbek) */
  readonly title: string;

  /** Deck title (Russian) */
  readonly title_ru?: string;

  /** Deck title (English) */
  readonly title_en?: string;

  /** Deck title (Chinese characters) */
  readonly title_zh?: string;

  /** Deck title pinyin */
  readonly title_pinyin?: string;

  /** All words in the deck */
  readonly words: readonly FlashcardWord[];
}
