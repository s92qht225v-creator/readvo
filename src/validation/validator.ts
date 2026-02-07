/**
 * Content Validation Layer
 *
 * Validates page JSON before it reaches the UI.
 * All validation happens at load time, not render time.
 *
 * DESIGN PRINCIPLES:
 * - Fail fast: bad data never reaches components
 * - Collect all errors: don't stop at first failure
 * - Clear messages: pinpoint exact location of problem
 * - No auto-fix: validation only, no mutation
 */

import type { Page, Section, Sentence, WordToken } from '../types';

// =============================================================================
// ERROR TYPES
// =============================================================================

export type ValidationErrorCode =
  | 'MISSING_PAGE_ID'
  | 'MISSING_SECTION_ID'
  | 'MISSING_SENTENCE_ID'
  | 'MISSING_WORD_ID'
  | 'DUPLICATE_ID'
  | 'EMPTY_SECTIONS'
  | 'EMPTY_SENTENCES'
  | 'EMPTY_WORDS'
  | 'WORD_COVERAGE_MISMATCH'
  | 'EMPTY_ORIGINAL_TEXT'
  | 'EMPTY_TRANSLATION'
  | 'INVALID_SECTION_TYPE'
  | 'INVALID_AUDIO_URL';

export interface ValidationError {
  /** Error code for programmatic handling */
  code: ValidationErrorCode;

  /** Human-readable message */
  message: string;

  /** Path to the problematic element */
  path: string;

  /** The problematic value (if applicable) */
  value?: unknown;

  /** Severity: 'error' blocks rendering, 'warning' allows it */
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  /** Whether validation passed (no errors, warnings OK) */
  valid: boolean;

  /** All validation errors found */
  errors: ValidationError[];

  /** All validation warnings found */
  warnings: ValidationError[];
}

// =============================================================================
// VALIDATION OPTIONS
// =============================================================================

export interface ValidationOptions {
  /** Allow empty translations (for vocabulary items that are self-explanatory) */
  allowEmptyTranslations?: boolean;

  /** Strict word coverage check (surface forms must exactly rebuild original) */
  strictWordCoverage?: boolean;

  /** Check audio URLs are valid format */
  validateAudioUrls?: boolean;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  allowEmptyTranslations: false,
  strictWordCoverage: true,
  validateAudioUrls: true,
};

// =============================================================================
// VALIDATOR CLASS
// =============================================================================

export class PageValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];
  private seenIds: Set<string> = new Set();
  private options: ValidationOptions;

  constructor(options: Partial<ValidationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Validate a page and return the result.
   * Does not throw - caller decides how to handle errors.
   */
  validate(page: Page): ValidationResult {
    // Reset state
    this.errors = [];
    this.warnings = [];
    this.seenIds = new Set();

    // Run validation
    this.validatePage(page);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  // ===========================================================================
  // PRIVATE VALIDATION METHODS
  // ===========================================================================

  private addError(
    code: ValidationErrorCode,
    message: string,
    path: string,
    value?: unknown
  ): void {
    this.errors.push({ code, message, path, value, severity: 'error' });
  }

  private addWarning(
    code: ValidationErrorCode,
    message: string,
    path: string,
    value?: unknown
  ): void {
    this.warnings.push({ code, message, path, value, severity: 'warning' });
  }

  private checkUniqueId(id: string | undefined, path: string): boolean {
    if (!id || id.trim() === '') {
      this.addError('MISSING_SENTENCE_ID', `Missing or empty ID`, path, id);
      return false;
    }

    if (this.seenIds.has(id)) {
      this.addError('DUPLICATE_ID', `Duplicate ID: "${id}"`, path, id);
      return false;
    }

    this.seenIds.add(id);
    return true;
  }

  private validatePage(page: Page): void {
    const path = 'page';

    // Page ID
    if (!page.id || page.id.trim() === '') {
      this.addError('MISSING_PAGE_ID', 'Page is missing an ID', path, page.id);
    } else {
      this.seenIds.add(page.id);
    }

    // Sections
    if (!page.sections || page.sections.length === 0) {
      this.addError('EMPTY_SECTIONS', 'Page has no sections', path);
      return;
    }

    page.sections.forEach((section, index) => {
      this.validateSection(section, `${path}.sections[${index}]`);
    });
  }

  private validateSection(section: Section, path: string): void {
    // Section ID
    this.checkUniqueId(section.id, `${path}.id`);

    // Section type
    const validTypes = ['objectives', 'text', 'dialogue', 'vocabulary', 'grammar', 'tip', 'exercise', 'instruction', 'activity', 'tonguetwister', 'matching', 'fillblank', 'multiplechoice', 'imagedescribe', 'bonus'];
    if (!validTypes.includes(section.type)) {
      this.addError(
        'INVALID_SECTION_TYPE',
        `Invalid section type: "${section.type}"`,
        `${path}.type`,
        section.type
      );
    }

    // Sentences - allow empty if section has an image or is a matching/fillblank exercise
    if (!section.sentences || section.sentences.length === 0) {
      // Only error if section has no image and is not a matching/fillblank section
      if (!section.image_url && section.type !== 'matching' && section.type !== 'fillblank' && section.type !== 'multiplechoice' && section.type !== 'imagedescribe' && section.type !== 'bonus' && section.type !== 'tip' && section.type !== 'activity') {
        this.addError('EMPTY_SENTENCES', 'Section has no sentences', path);
      }
      return;
    }

    section.sentences.forEach((sentence, index) => {
      this.validateSentence(sentence, `${path}.sentences[${index}]`);
    });
  }

  private validateSentence(sentence: Sentence, path: string): void {
    // Sentence ID
    this.checkUniqueId(sentence.id, `${path}.id`);

    // Image-only sentences (placeholders for textbook scans) skip text checks
    const isImageOnly = sentence.image_url && (!sentence.text_original || sentence.text_original.trim() === '');

    // Original text
    if (!isImageOnly && (!sentence.text_original || sentence.text_original.trim() === '')) {
      this.addError(
        'EMPTY_ORIGINAL_TEXT',
        'Sentence has empty original text',
        `${path}.text_original`
      );
    }

    // Translation
    if (!isImageOnly && (!sentence.text_translation || sentence.text_translation.trim() === '')) {
      if (this.options.allowEmptyTranslations) {
        this.addWarning(
          'EMPTY_TRANSLATION',
          'Sentence has empty translation (allowed by options)',
          `${path}.text_translation`
        );
      } else {
        this.addError(
          'EMPTY_TRANSLATION',
          'Sentence has empty translation',
          `${path}.text_translation`
        );
      }
    }

    // Words (optional - only validate if present)
    if (sentence.words && sentence.words.length > 0) {
      // Validate each word
      sentence.words.forEach((word, index) => {
        this.validateWord(word, `${path}.words[${index}]`);
      });

      // Word coverage check
      if (this.options.strictWordCoverage && sentence.text_original) {
        this.validateWordCoverage(sentence, path);
      }
    }

    // Audio URL
    if (sentence.audio_url && this.options.validateAudioUrls) {
      this.validateAudioUrl(sentence.audio_url, `${path}.audio_url`);
    }
  }

  private validateWord(word: WordToken, path: string): void {
    if (!word.id || word.id.trim() === '') {
      this.addError('MISSING_WORD_ID', 'Word is missing an ID', `${path}.id`, word.id);
    }

    if (!word.surface || word.surface.trim() === '') {
      this.addError(
        'EMPTY_ORIGINAL_TEXT',
        'Word has empty surface form',
        `${path}.surface`
      );
    }

    if (!word.lemma || word.lemma.trim() === '') {
      // Punctuation can have empty lemma
      if (!word.isPunctuation) {
        this.addWarning(
          'EMPTY_ORIGINAL_TEXT',
          'Word has empty lemma (not punctuation)',
          `${path}.lemma`
        );
      }
    }
  }

  private validateWordCoverage(sentence: Sentence, path: string): void {
    // Guard: words must exist (caller should check, but TypeScript needs this)
    if (!sentence.words) return;

    // Reconstruct original from word surfaces
    const reconstructed = sentence.words
      .map((w, i) => {
        // Add space before word unless it's punctuation or first word
        const needsSpace = i > 0 && !w.isPunctuation;
        return needsSpace ? ` ${w.surface}` : w.surface;
      })
      .join('');

    // Normalize both for comparison (remove extra spaces, normalize unicode)
    const normalizedOriginal = this.normalizeText(sentence.text_original);
    const normalizedReconstructed = this.normalizeText(reconstructed);

    if (normalizedOriginal !== normalizedReconstructed) {
      this.addWarning(
        'WORD_COVERAGE_MISMATCH',
        `Word tokens don't fully cover original text.\n` +
          `  Original:      "${sentence.text_original}"\n` +
          `  Reconstructed: "${reconstructed.trim()}"`,
        `${path}.words`,
        { original: sentence.text_original, reconstructed: reconstructed.trim() }
      );
    }
  }

  private validateAudioUrl(url: string, path: string): void {
    // Basic URL format check
    const validPatterns = [
      /^\/audio\/.+\.(mp3|wav|ogg|m4a)$/i, // Relative path
      /^https?:\/\/.+\.(mp3|wav|ogg|m4a)$/i, // Absolute URL
      /^data:audio\/.+;base64,/i, // Data URL
    ];

    const isValid = validPatterns.some((pattern) => pattern.test(url));

    if (!isValid) {
      this.addWarning(
        'INVALID_AUDIO_URL',
        `Audio URL may be invalid: "${url}"`,
        path,
        url
      );
    }
  }

  private normalizeText(text: string): string {
    return text
      .normalize('NFC') // Unicode normalization
      .replace(/\s+/g, '') // Remove all whitespace for comparison
      .trim();
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Validate a page with default options.
 * Throws if validation fails.
 */
export function validatePage(page: Page, options?: Partial<ValidationOptions>): Page {
  const validator = new PageValidator(options);
  const result = validator.validate(page);

  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `  - ${e.path}: ${e.message}`);
    throw new Error(
      `Page validation failed with ${result.errors.length} error(s):\n${errorMessages.join('\n')}`
    );
  }

  // Log warnings if any
  if (result.warnings.length > 0) {
    console.warn(
      `Page validation passed with ${result.warnings.length} warning(s):`,
      result.warnings
    );
  }

  return page;
}

/**
 * Validate a page without throwing.
 * Returns the validation result for caller to handle.
 */
export function validatePageSafe(
  page: Page,
  options?: Partial<ValidationOptions>
): ValidationResult {
  const validator = new PageValidator(options);
  return validator.validate(page);
}

/**
 * Quick check if a page is valid.
 */
export function isValidPage(page: Page, options?: Partial<ValidationOptions>): boolean {
  const validator = new PageValidator(options);
  return validator.validate(page).valid;
}
