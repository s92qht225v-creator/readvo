/**
 * UI State Types
 *
 * Minimal state for interaction handling.
 * The UI state is ephemeral and never persisted.
 */

import type { DictionaryEntry } from './schema';

// =============================================================================
// LANGUAGE SELECTION
// =============================================================================

/** Supported translation languages */
export type Language = 'uz' | 'ru';

export const LANGUAGES: readonly { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'uz', label: 'Uzbek', nativeLabel: "O'zbek" },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
];

export const DEFAULT_LANGUAGE: Language = 'uz';

// =============================================================================
// WORD POPUP STATE
// =============================================================================

export interface WordPopupState {
  /** Whether the popup is visible */
  readonly isVisible: boolean;

  /** The sentence ID containing the clicked word */
  readonly sentenceId: string | null;

  /** The word ID that was clicked */
  readonly wordId: string | null;

  /** Position for rendering the popup */
  readonly position: {
    readonly x: number;
    readonly y: number;
  };

  /** Dictionary data to display (null while loading) */
  readonly entry: DictionaryEntry | null;
}

export const INITIAL_WORD_POPUP_STATE: WordPopupState = {
  isVisible: false,
  sentenceId: null,
  wordId: null,
  position: { x: 0, y: 0 },
  entry: null,
};

// =============================================================================
// SENTENCE TRANSLATION STATE
// =============================================================================

/**
 * Tracks which sentences have their translations visible.
 * Uses a Set of sentence IDs for O(1) lookup.
 */
export type TranslationVisibility = ReadonlySet<string>;

export const INITIAL_TRANSLATION_VISIBILITY: TranslationVisibility = new Set();
