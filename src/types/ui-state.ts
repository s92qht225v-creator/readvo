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

// =============================================================================
// AUDIO PLAYBACK STATE
// =============================================================================

export interface AudioState {
  /** Currently playing sentence ID (null if nothing playing) */
  readonly playingSentenceId: string | null;

  /** Whether audio is currently loading */
  readonly isLoading: boolean;
}

export const INITIAL_AUDIO_STATE: AudioState = {
  playingSentenceId: null,
  isLoading: false,
};

// =============================================================================
// COMBINED PAGE UI STATE
// =============================================================================

export interface PageUIState {
  readonly wordPopup: WordPopupState;
  readonly translationVisibility: TranslationVisibility;
  readonly audio: AudioState;
}

export const INITIAL_PAGE_UI_STATE: PageUIState = {
  wordPopup: INITIAL_WORD_POPUP_STATE,
  translationVisibility: INITIAL_TRANSLATION_VISIBILITY,
  audio: INITIAL_AUDIO_STATE,
};
