import type { VocabItem } from '@/services/glossary';

/** One dialogue line exposed publicly in the teaser. */
export interface PreviewSentence {
  id: string;
  text_original: string;
  pinyin: string;
  text_translation: string;
  text_translation_ru: string;
  text_translation_en?: string;
  speaker?: string;
}

/** The public, crawlable slice of a dialogue. Server-rendered into the page HTML. */
export interface DialoguePreviewData {
  image?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  category_uz?: string;
  category_ru?: string;
  category_en?: string;
  /** First N dialogue lines shown to everyone. */
  teaser: PreviewSentence[];
  /** Number of lines hidden behind the gate (for the "yana N qator" divider). */
  hiddenCount: number;
  /** Full resolved vocab — public (the primary SEO content). */
  vocab: VocabItem[];
}
