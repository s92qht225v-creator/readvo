/**
 * Blim Reading System - Core Data Types
 *
 * Hierarchy: Page → Section → Sentence → Word
 *
 * INVARIANTS:
 * - Sentence is the atomic unit of meaning
 * - Words exist only as children of sentences
 * - All IDs are stable and never change after creation
 * - No runtime inference of boundaries or meaning
 */

// =============================================================================
// WORD TOKEN
// =============================================================================

/**
 * A word token within a sentence.
 * Words are for click interaction only (dictionary lookup).
 * Words have NO audio and NO sentence-level meaning.
 */
export interface WordToken {
  /** Stable identifier within the sentence (e.g., "w0", "w1") */
  readonly id: string;

  /** The word as displayed (including any punctuation attached) */
  readonly surface: string;

  /** The dictionary form / lemma for lookup */
  readonly lemma: string;

  /** Part of speech tag (noun, verb, particle, etc.) */
  readonly pos?: string;

  /** Whether this token is punctuation-only (not clickable) */
  readonly isPunctuation?: boolean;
}

// =============================================================================
// SENTENCE
// =============================================================================

/**
 * Section types - exhaustive list of content categories.
 * Each section type may have different rendering styles.
 */
export type SectionType =
  | 'objectives'      // Learning objectives (目标)
  | 'text'            // Main text/dialogue with context (课文)
  | 'dialogue'        // Conversational exchanges
  | 'vocabulary'      // Word lists with definitions (生词)
  | 'grammar'         // Grammar explanations
  | 'tip'             // Tips/notes (小语助力)
  | 'exercise'        // Practice exercises
  | 'instruction'     // Exercise instructions, meta-text
  | 'activity'        // Classroom activities (课堂活动)
  | 'tonguetwister'   // Tongue twisters (跟读绕口令)
  | 'matching'        // Image-word matching exercises (热身)
  | 'fillblank'       // Fill-in-the-blank exercises (选词填空)
  | 'multiplechoice'  // Multiple choice exercises (选择正确答案)
  | 'imagedescribe'   // Image description exercises (看图填空)
  | 'bonus';          // Bonus content with video (小语的彩蛋)

/**
 * A sentence - the atomic unit of the reading system.
 *
 * Every piece of readable content is a sentence.
 * Sentences own their words, translation, and audio.
 */
export interface Sentence {
  /** Stable unique identifier (e.g., "page1-s0", "p1-dialogue-s3") */
  readonly id: string;

  /** Which section type this sentence belongs to */
  readonly section: SectionType;

  /** Original text in target language */
  readonly text_original: string;

  /** Translation in Uzbek */
  readonly text_translation: string;

  /** Translation in Russian (optional) */
  readonly text_translation_ru?: string;

  /** Pre-tokenized words for click interaction (optional, for future features) */
  readonly words?: readonly WordToken[];

  /** Optional audio URL for this sentence only */
  readonly audio_url?: string;

  /** Optional speaker label for dialogue (e.g., "A:", "田中:") */
  readonly speaker?: string;

  /** Optional speaker name (full name, e.g., "王一飞") */
  readonly speakerName?: string;

  /** Optional pinyin above the text */
  readonly pinyin?: string;

  /** Optional: marks this as a checkbox item (for objectives) */
  readonly isCheckbox?: boolean;

  /** Optional: marks this sentence as indented (for dialogue responses) */
  readonly isIndented?: boolean;

  /** Optional: dialogue number prefix like （1）, （2） - displayed in separate column */
  readonly dialogueNumber?: string;

  /** Optional: grammar point number (e.g., "1", "2") - displayed in red badge before text */
  readonly grammarNumber?: string;

  /** Optional: inline image URL (e.g., textbook table scan within a grammar section) */
  readonly image_url?: string;

  /** Optional: table data for inline tables (e.g., grammar reference tables) */
  readonly tableData?: {
    readonly headers: readonly string[];
    readonly rows: readonly (readonly string[])[];
  };

  /** Optional: word class abbreviation for vocabulary (e.g., "n.", "v.", "adj.") */
  readonly wordClass?: string;

  /** Optional: vocabulary item number within the lesson */
  readonly vocabNumber?: number;
}

// =============================================================================
// SECTION
// =============================================================================

/**
 * A logical section within a page.
 * Sections group sentences by type and provide optional headings.
 */
export interface Section {
  /** Stable unique identifier (e.g., "page1-sec-dialogue") */
  readonly id: string;

  /** The type of content in this section */
  readonly type: SectionType;

  /** Optional section heading (e.g., "Dialogue", "New Words") */
  readonly heading?: string;

  /** Optional section heading (Russian) */
  readonly heading_ru?: string;

  /** Optional section subheading (e.g., "Text 1") */
  readonly subheading?: string;

  /** Optional section subheading (Russian) */
  readonly subheading_ru?: string;

  /** Optional context/narration before the sentences (e.g., scene description) */
  readonly context?: string;

  /** Optional context pinyin */
  readonly contextPinyin?: string;

  /** Optional context translation (Uzbek) */
  readonly contextTranslation?: string;

  /** Optional context translation (Russian) */
  readonly contextTranslation_ru?: string;

  /** Optional instruction line (e.g., "朗读对话。Read the dialogue aloud.") */
  readonly instruction?: string;

  /** Optional instruction line (Russian) */
  readonly instruction_ru?: string;

  /** Optional tip/note box within the section */
  readonly tip?: {
    readonly label?: string;           // e.g., "小语助力", "Xiaoyu's Tip"
    readonly text: string;             // Chinese text
    readonly pinyin?: string;          // Pinyin
    readonly translation?: string;     // Translation (Uzbek)
    readonly translation_ru?: string;  // Translation (Russian)
  };

  /** Optional audio URL for the entire section */
  readonly audio_url?: string;

  /** Optional video URL for bonus content sections */
  readonly video_url?: string;

  /** Optional image URL for the section (original textbook scan, appears above sentences) */
  readonly image_url?: string;

  /** Optional image URL that appears after the sentences */
  readonly image_url_bottom?: string;

  /** Optional array of image URLs that appear after the sentences (for multiple images) */
  readonly images_bottom?: readonly string[];

  /** Ordered list of sentences in this section */
  readonly sentences: readonly Sentence[];

  /** Matching exercise items (only for type: 'matching') */
  readonly matchingItems?: readonly MatchingItem[];

  /** Fill-in-blank exercise data (only for type: 'fillblank') */
  readonly fillBlankData?: FillBlankData;

  /** Multiple choice exercise data (only for type: 'multiplechoice') */
  readonly multipleChoiceData?: MultipleChoiceData;

  /** Image description exercise data (only for type: 'imagedescribe') */
  readonly imageDescribeData?: ImageDescribeData;

  /** Table fill exercise data (only for type: 'activity') */
  readonly tableFillData?: TableFillData;

  /** Grammar table data (only for type: 'grammar') */
  readonly grammarTableData?: GrammarTableData;
}

// =============================================================================
// MATCHING EXERCISE
// =============================================================================

/**
 * An item in a matching exercise.
 * Each item pairs an image with a word/phrase.
 */
export interface MatchingItem {
  /** Unique identifier for this item */
  readonly id: string;

  /** Image URL */
  readonly image_url: string;

  /** Word or phrase in target language */
  readonly word: string;

  /** Pinyin romanization */
  readonly pinyin: string;

  /** Translation (Uzbek) */
  readonly translation?: string;

  /** Translation (Russian) */
  readonly translation_ru?: string;
}

// =============================================================================
// FILL-IN-THE-BLANK EXERCISE
// =============================================================================

/**
 * A word option for fill-in-the-blank exercises.
 */
export interface FillBlankOption {
  /** Unique identifier (e.g., "A", "B", "C") */
  readonly id: string;

  /** Display label (e.g., "A", "B", "C") */
  readonly label: string;

  /** The word/phrase */
  readonly word: string;

  /** Pinyin romanization */
  readonly pinyin: string;
}

/**
 * A part of a fill-blank sentence (either text or blank).
 */
export interface FillBlankSentencePart {
  /** Type of part */
  readonly type: 'text' | 'blank';

  /** Content (for text parts) */
  readonly content?: string;
}

/**
 * A sentence in a fill-in-the-blank exercise.
 */
export interface FillBlankSentence {
  /** Unique identifier */
  readonly id: string;

  /** Sentence number for display (1, 2, 3...) - optional for dialogue continuations */
  readonly number?: number;

  /** Parts of the sentence (text and blanks) */
  readonly parts: readonly FillBlankSentencePart[];

  /** ID of the correct option */
  readonly correctOptionId: string;

  /** Ordered correct option IDs for multi-blank sentences */
  readonly correctOptionIds?: readonly string[];

  /** Optional speaker name for dialogues */
  readonly speaker?: string;
}

/**
 * Complete data for a fill-in-the-blank exercise.
 */
export interface FillBlankData {
  /** Word options to choose from */
  readonly options: readonly FillBlankOption[];

  /** Sentences with blanks */
  readonly sentences: readonly FillBlankSentence[];
}

// =============================================================================
// MULTIPLE CHOICE EXERCISE
// =============================================================================

/**
 * An option in a multiple choice question.
 */
export interface MultipleChoiceOption {
  /** Option label (e.g., "A", "B", "C") */
  readonly label: string;

  /** The word/phrase */
  readonly word: string;

  /** Pinyin romanization */
  readonly pinyin: string;
}

/**
 * A question in a multiple choice exercise.
 */
export interface MultipleChoiceQuestion {
  /** Unique identifier */
  readonly id: string;

  /** Question number (1, 2, 3...) */
  readonly number: number;

  /** Sentence parts (text and blank) */
  readonly parts: readonly FillBlankSentencePart[];

  /** Options for this question */
  readonly options: readonly MultipleChoiceOption[];

  /** Label of the correct option (e.g., "C") */
  readonly correctOptionLabel: string;
}

/**
 * Complete data for a multiple choice exercise.
 */
export interface MultipleChoiceData {
  /** Questions */
  readonly questions: readonly MultipleChoiceQuestion[];
}

// =============================================================================
// IMAGE DESCRIBE EXERCISE
// =============================================================================

/**
 * A card in an image description exercise.
 * Each card has an optional image and a sentence with blanks to fill by typing.
 * Can also be used for text-only fill-in-the-blank exercises without images.
 */
export interface ImageDescribeCard {
  /** Unique identifier */
  readonly id: string;

  /** Image URL (optional - for text-only exercises) */
  readonly image_url?: string;

  /** Sentence parts (text and blanks) */
  readonly parts: readonly FillBlankSentencePart[];

  /** Correct answers for each blank, in order */
  readonly answers: readonly string[];

  /** Speaker name (optional - for dialogue exercises) */
  readonly speaker?: string;

  /** Dialogue number (optional - for numbered dialogues) */
  readonly dialogueNumber?: string;

  /** Pinyin for the sentence (optional) */
  readonly pinyin?: string;

  /** Translation in Uzbek (optional) */
  readonly translation?: string;

  /** Translation in Russian (optional) */
  readonly translation_ru?: string;
}

/**
 * Complete data for an image description exercise.
 */
export interface ImageDescribeData {
  /** Cards with images and sentences */
  readonly cards: readonly ImageDescribeCard[];
}

// =============================================================================
// TABLE FILL EXERCISE
// =============================================================================

/**
 * An option in a table fill exercise (e.g., A 包子, B 面条儿).
 */
export interface TableFillOption {
  /** Unique identifier (e.g., "A", "B") */
  readonly id: string;

  /** Display label (e.g., "A", "B") */
  readonly label: string;

  /** The word/phrase */
  readonly word: string;

  /** Pinyin romanization */
  readonly pinyin: string;
}

/**
 * A column in a table fill exercise (e.g., 星期一).
 */
export interface TableFillColumn {
  /** Unique identifier */
  readonly id: string;

  /** Column header label (Chinese) */
  readonly label: string;

  /** Pinyin romanization */
  readonly pinyin: string;
}

/**
 * Complete data for a table fill exercise.
 */
export interface TableFillData {
  /** Options to choose from */
  readonly options: readonly TableFillOption[];

  /** Column headers */
  readonly columns: readonly TableFillColumn[];
}

// =============================================================================
// GRAMMAR TABLE
// =============================================================================

/**
 * A row in a grammar table (e.g., currency denominations).
 */
export interface GrammarTableRow {
  /** Values for each column, in order */
  readonly cells: readonly string[];
}

/**
 * Complete data for a grammar table (display-only).
 */
export interface GrammarTableData {
  /** Column headers (Chinese) */
  readonly headers: readonly string[];

  /** Column sub-headers (Uzbek translation) */
  readonly subHeaders?: readonly string[];

  /** Column sub-headers (Russian translation) */
  readonly subHeaders_ru?: readonly string[];

  /** Table rows */
  readonly rows: readonly GrammarTableRow[];
}

// =============================================================================
// FLASHCARD
// =============================================================================

/**
 * A single flashcard word entry.
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

  /** All words in the deck */
  readonly words: readonly FlashcardWord[];
}

// =============================================================================
// LESSON HEADER
// =============================================================================

/**
 * Lesson header data for the banner display.
 * Contains the lesson title in multiple forms (pinyin, Chinese, translation).
 */
export interface LessonHeader {
  /** Lesson number (1, 2, 3...) */
  readonly lessonNumber: number;

  /** Pinyin romanization of the title */
  readonly pinyin: string;

  /** Title in target language (Chinese characters) */
  readonly title: string;

  /** Title translation (Uzbek) */
  readonly titleTranslation: string;

  /** Title translation (Russian) */
  readonly titleTranslation_ru?: string;
}

// =============================================================================
// PAGE
// =============================================================================

/**
 * A page in the textbook.
 * Pages are the unit of loading/navigation.
 */
export interface Page {
  /** Stable unique identifier (e.g., "lesson1-page3") */
  readonly id: string;

  /** Page number for display */
  readonly pageNumber: number;

  /** Optional page title (deprecated, use lessonHeader instead) */
  readonly title?: string;

  /** Lesson header for banner display (only on first page of lesson) */
  readonly lessonHeader?: LessonHeader;

  /** Ordered list of sections on this page */
  readonly sections: readonly Section[];
}

// =============================================================================
// BOOK MANIFEST
// =============================================================================

/**
 * Book-level metadata and page index.
 * Used for navigation and loading.
 */
export interface BookManifest {
  /** Unique book identifier */
  readonly id: string;

  /** Book title */
  readonly title: string;

  /** Target language (e.g., "ja", "zh", "ko") */
  readonly targetLanguage: string;

  /** Reader's language (e.g., "en", "ru") */
  readonly readerLanguage: string;

  /** Total number of pages */
  readonly totalPages: number;

  /** Page ID to file path mapping */
  readonly pageIndex: ReadonlyMap<string, string>;
}

// =============================================================================
// DICTIONARY ENTRY (for popup display)
// =============================================================================

/**
 * Dictionary entry shown when a word is clicked.
 * This is display-only data, not part of the sentence structure.
 */
export interface DictionaryEntry {
  /** The word looked up */
  readonly word: string;

  /** Readings/pronunciations */
  readonly readings: readonly string[];

  /** Definitions */
  readonly definitions: readonly string[];

  /** Part of speech */
  readonly pos?: string;

  /** Example sentences (optional) */
  readonly examples?: readonly string[];
}
