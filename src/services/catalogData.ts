// src/services/catalogData.ts
import { loadDialoguesForBook, type DialogueInfo } from '@/services/dialogues';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import {
  WRITING_SETS,
  WRITING_SETS_HSK2,
  WRITING_SETS_HSK2_L2,
  WRITING_SETS_HSK3,
  WRITING_SETS_HSK4,
  WRITING_SETS_HSK5,
  WRITING_SETS_HSK6,
  type WritingSet,
} from '@/services/writing';
import type { FlashcardLesson, WritingSetMeta } from '@/components/catalog/types';

/** Toneless, space-joined pinyin for a writing set's words (NFD-strip tone marks).
 *  NFD decomposes tone diacritics AND ü's diaeresis into combining marks which get
 *  stripped (wǒ→wo, nǚ→nu). Matches tonelessPinyin in chinese/page.tsx exactly. */
export const tonelessPinyin = (words: { pinyin: string }[] = []): string =>
  words
    .map((w) => (w.pinyin || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    .join(' ');

export async function loadDialoguesAll(): Promise<{
  dialogues: DialogueInfo[];
  dialoguesHsk2: DialogueInfo[];
  dialoguesHsk3: DialogueInfo[];
  dialoguesHsk4: DialogueInfo[];
  dialoguesHsk5: DialogueInfo[];
  dialoguesHsk6: DialogueInfo[];
}> {
  const [
    dialogues,
    dialoguesHsk2,
    dialoguesHsk3,
    dialoguesHsk4,
    dialoguesHsk5,
    dialoguesHsk6,
  ] = await Promise.all([
    loadDialoguesForBook('hsk1'),
    loadDialoguesForBook('hsk2'),
    loadDialoguesForBook('hsk3'),
    loadDialoguesForBook('hsk4'),
    loadDialoguesForBook('hsk5'),
    loadDialoguesForBook('hsk6'),
  ]);
  return { dialogues, dialoguesHsk2, dialoguesHsk3, dialoguesHsk4, dialoguesHsk5, dialoguesHsk6 };
}

export async function loadFlashcardCatalog(): Promise<FlashcardLesson[]> {
  const [deck, lessonInfos] = await Promise.all([
    loadFlashcardDeck('hsk1'),
    getLessonsWithInfo(),
  ]);
  if (!deck) return [];
  return Array.from(new Set(deck.words.map((w) => w.lesson).filter(Boolean)))
    .sort((a, b) => (a as number) - (b as number))
    .map((lessonNum) => {
      const info = lessonInfos.find((l) => l.lessonNumber === lessonNum);
      const wordsInLesson = deck.words.filter((w) => w.lesson === lessonNum);
      const sample = wordsInLesson[0];
      return {
        lessonId: String(lessonNum),
        lessonNumber: lessonNum as number,
        wordCount: wordsInLesson.length,
        title: info?.title,
        title_ru: info?.titleTranslation_ru,
        sampleChar: sample?.text_original,
        sampleUz: sample?.text_translation,
        sampleRu: sample?.text_translation_ru,
        sampleEn: sample?.text_translation_en,
      };
    });
}

/** Map a writing-set array to its catalog meta.
 *
 *  `withSamples` mirrors the current /chinese page behaviour:
 *   - true  → includes wordCount + sampleChar/Uz/Ru/En via shortest-word sort
 *   - false → base fields only (id, title, title_ru, subtitle, subtitle_ru, chars, pinyin)
 *
 *  Per-array flags (read directly from chinese/page.tsx lines 118-136):
 *   WRITING_SETS       → true   (has sample fields)
 *   WRITING_SETS_HSK2  → false  (base only)
 *   WRITING_SETS_HSK2_L2 → true (has sample fields)
 *   WRITING_SETS_HSK3  → true   (has sample fields)
 *   WRITING_SETS_HSK4  → false  (base only)
 *   WRITING_SETS_HSK5  → false  (base only)
 *   WRITING_SETS_HSK6  → false  (base only)
 */
function mapWriting(
  sets: WritingSet[],
  locale: string,
  withSamples: boolean,
): WritingSetMeta[] {
  const key = locale === 'ru' ? 'ru' : locale === 'en' ? 'en' : 'uz';
  return sets.map(({ id, title, title_ru, subtitle, subtitle_ru, chars, words }) => {
    const base: WritingSetMeta = {
      id,
      title,
      title_ru,
      subtitle,
      subtitle_ru,
      chars,
      pinyin: tonelessPinyin(words),
    };
    if (!withSamples) return base;
    const short = [...words].sort((a, b) => a[key].length - b[key].length)[0];
    return {
      ...base,
      wordCount: words.length,
      sampleChar: short?.char,
      sampleUz: short?.uz,
      sampleRu: short?.ru,
      sampleEn: short?.en,
    };
  });
}

export function loadWritingCatalog(locale: string): {
  writingSets: WritingSetMeta[];
  writingSetsHsk2: WritingSetMeta[];
  writingSetsHsk2L2: WritingSetMeta[];
  writingSetsHsk3: WritingSetMeta[];
  writingSetsHsk4: WritingSetMeta[];
  writingSetsHsk5: WritingSetMeta[];
  writingSetsHsk6: WritingSetMeta[];
} {
  return {
    writingSets: mapWriting(WRITING_SETS, locale, true),
    writingSetsHsk2: mapWriting(WRITING_SETS_HSK2, locale, false),
    writingSetsHsk2L2: mapWriting(WRITING_SETS_HSK2_L2, locale, true),
    writingSetsHsk3: mapWriting(WRITING_SETS_HSK3, locale, true),
    writingSetsHsk4: mapWriting(WRITING_SETS_HSK4, locale, false),
    writingSetsHsk5: mapWriting(WRITING_SETS_HSK5, locale, false),
    writingSetsHsk6: mapWriting(WRITING_SETS_HSK6, locale, false),
  };
}
