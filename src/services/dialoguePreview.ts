import type { DialoguePageResolved } from './dialogues';
import type { DialoguePreviewData, PreviewSentence } from '@/components/dialoguePreview.types';

/** Number of dialogue lines shown publicly as a teaser. */
export const TEASER_LINES = 2;

/**
 * Derive the public, crawlable slice from a fully-resolved dialogue.
 * Public = image, description, the first TEASER_LINES lines, and ALL vocab.
 * Everything else (remaining lines, audio) stays gated and is never returned here.
 */
export function buildDialoguePreview(d: DialoguePageResolved): DialoguePreviewData {
  const allSentences = (d.sections ?? []).flatMap((s) => s.sentences ?? []);
  const teaser: PreviewSentence[] = allSentences.slice(0, TEASER_LINES).map((s) => ({
    id: s.id,
    text_original: s.text_original,
    pinyin: s.pinyin,
    text_translation: s.text_translation,
    text_translation_ru: s.text_translation_ru,
    text_translation_en: s.text_translation_en,
    speaker: s.speaker,
  }));
  return {
    image: d.image,
    description_uz: d.description_uz,
    description_ru: d.description_ru,
    description_en: d.description_en,
    teaser,
    hiddenCount: Math.max(0, allSentences.length - teaser.length),
    vocab: d.vocab ?? [],
  };
}
