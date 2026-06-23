import type { DialoguePageResolved } from './dialogues';
import type { DialoguePreviewData, PreviewSentence } from '@/components/dialoguePreview.types';

/** Number of dialogue lines shown publicly as a teaser. */
export const TEASER_LINES = 2;

/** Bare greetings — skipped at the start of a teaser so it surfaces the real exchange. */
const GREETINGS = new Set(['你好', '您好', '你们好', '大家好', '喂', '嗨', '哈喽', '哈啰']);
const stripPunct = (t: string) => t.replace(/[\s！!。.,，、；;：:？?~～…—]+/g, '');

/**
 * Derive the public, crawlable slice from a fully-resolved dialogue.
 * Public = image, description, TEASER_LINES dialogue lines, and ALL vocab.
 * Leading bare-greeting lines ("你好 / 你好") are skipped so the teaser shows the
 * substantive exchange — but only when enough lines remain after the greetings.
 * Everything else (remaining lines, audio) stays gated and is never returned here.
 */
export function buildDialoguePreview(d: DialoguePageResolved): DialoguePreviewData {
  const allSentences = (d.sections ?? []).flatMap((s) => s.sentences ?? []);
  let start = 0;
  while (start < allSentences.length && GREETINGS.has(stripPunct(allSentences[start].text_original ?? ''))) start++;
  const source = allSentences.length - start >= TEASER_LINES ? allSentences.slice(start) : allSentences;
  const teaser: PreviewSentence[] = source.slice(0, TEASER_LINES).map((s) => ({
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
