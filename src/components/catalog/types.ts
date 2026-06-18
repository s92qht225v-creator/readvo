// src/components/catalog/types.ts
export type Tab = 'dialogues' | 'writing' | 'flashcards' | 'karaoke' | 'grammar';
export type HskLevel = '1' | '2' | '3' | '4' | '5' | '6';

export const BOOKMARK_KEY = 'blim-dialogue-bookmarks';

export const TAGS: Record<string, { uz: string; ru: string; en: string }> = {
  tanishuv: { uz: 'Tanishuv', ru: 'Знакомство', en: 'Introductions' },
  kundalik: { uz: 'Kundalik', ru: 'Повседневное', en: 'Daily Life' },
  xaridlar: { uz: 'Xaridlar', ru: 'Покупки', en: 'Shopping' },
  ovqat: { uz: 'Ovqat', ru: 'Еда', en: 'Food' },
  salomatlik: { uz: 'Salomatlik', ru: 'Здоровье', en: 'Health' },
  transport: { uz: 'Transport', ru: 'Транспорт', en: 'Transport' },
  telefon: { uz: 'Telefon', ru: 'Телефон', en: 'Phone' },
  ish: { uz: 'Ish/O\'qish', ru: 'Работа/Учёба', en: 'Work/Study' },
  reja: { uz: 'Reja', ru: 'Планы', en: 'Plans' },
  muloqot: { uz: 'Muloqot', ru: 'Общение', en: 'Communication' },
  'ob-havo': { uz: 'Ob-havo', ru: 'Погода', en: 'Weather' },
  texnologiya: { uz: 'Texnologiya', ru: 'Технологии', en: 'Technology' },
};

export function parseHskLevel(raw: string | null | undefined, max = 6): HskLevel {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= max) return String(n) as HskLevel;
  return '1';
}

export interface FlashcardLesson {
  lessonId: string;
  lessonNumber: number;
  wordCount: number;
  title?: string;
  title_ru?: string;
  sampleChar?: string;
  sampleUz?: string;
  sampleRu?: string;
  sampleEn?: string;
}

export interface WritingSetMeta {
  id: string;
  title: string;
  title_ru: string;
  subtitle: string;
  subtitle_ru: string;
  chars: string;
  /** Toneless pinyin of every word in the set, space-joined (e.g.
   *  "de wo ni shi le bu zai ta women hao"). Lets the search box match
   *  pinyin typed without tone marks. */
  pinyin?: string;
  wordCount?: number;
  sampleChar?: string;
  sampleUz?: string;
  sampleRu?: string;
  sampleEn?: string;
}
