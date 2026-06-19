import fs from 'fs';
import path from 'path';

export interface ArabicSentence {
  id: string;
  speaker?: 'A' | 'B';
  // Gendered wording (present → the dialogue is gendered):
  ar_m?: string;
  translit_m?: string;
  ar_f?: string;
  translit_f?: string;
  // Legacy single-gender wording (present when not gendered):
  ar?: string;
  translit?: string;
  text_translation_uz: string;
  text_translation_ru: string;
  text_translation_en: string;
  audio_url?: string;
}

export interface ArabicDialogue {
  id: string;
  level: string;              // 'a1'..'c2'
  title: string;              // Arabic (vowelized)
  translit: string;
  titleTranslation_uz: string;
  titleTranslation_ru: string;
  titleTranslation_en: string;
  sentences: ArabicSentence[];
}

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const ROOT = path.join(process.cwd(), 'content', 'arabic', 'dialogues');

/** Load one Arabic dialogue, or null if missing/invalid. */
export function loadArabicDialogue(level: string, slug: string): ArabicDialogue | null {
  if (!LEVELS.includes(level) || !/^[\w-]+$/.test(slug)) return null;
  const file = path.join(ROOT, level, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as ArabicDialogue;
  } catch {
    return null;
  }
}

/** List every (level, slug) for generateStaticParams. */
export function listArabicDialogues(): { level: string; slug: string }[] {
  const out: { level: string; slug: string }[] = [];
  for (const level of LEVELS) {
    const dir = path.join(ROOT, level);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.json')) out.push({ level, slug: f.replace(/\.json$/, '') });
    }
  }
  return out;
}

/** Lightweight per-dialogue metadata for the catalog grid. */
export interface ArabicDialogueCardMeta {
  id: string;
  slug: string;
  level: string;
  title: string;
  translit: string;
  titleTranslation_uz: string;
  titleTranslation_ru: string;
  titleTranslation_en: string;
}

/** Load catalog metadata for every Arabic dialogue, grouped by CEFR level. */
export function loadArabicDialogueCatalog(): Record<string, ArabicDialogueCardMeta[]> {
  const out: Record<string, ArabicDialogueCardMeta[]> = { a1: [], a2: [], b1: [], b2: [], c1: [], c2: [] };
  for (const { level, slug } of listArabicDialogues()) {
    const d = loadArabicDialogue(level, slug);
    if (!d) continue;
    out[level].push({
      id: d.id, slug, level,
      title: d.title, translit: d.translit,
      titleTranslation_uz: d.titleTranslation_uz,
      titleTranslation_ru: d.titleTranslation_ru,
      titleTranslation_en: d.titleTranslation_en,
    });
  }
  return out;
}

// ── Flashcards ───────────────────────────────────────────────────────────────

export interface ArabicFlashcard {
  id: string;
  ar: string;        // fully vowelized Arabic
  translit: string;  // Latin transliteration
  uz: string;
  ru: string;
  en: string;
}

export interface ArabicFlashcardDeck {
  id: string;
  level: string;     // 'a1'..'c2'
  title_uz: string;
  title_ru: string;
  title_en: string;
  cards: ArabicFlashcard[];
}

const FLASHCARD_ROOT = path.join(process.cwd(), 'content', 'flashcards', 'arabic');

/** Load one Arabic flashcard deck by CEFR level, or null. */
export function loadArabicFlashcardDeck(level: string): ArabicFlashcardDeck | null {
  if (!LEVELS.includes(level)) return null;
  const file = path.join(FLASHCARD_ROOT, `${level}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as ArabicFlashcardDeck;
  } catch {
    return null;
  }
}

/** Levels that have a flashcard deck, with card counts (for the catalog). */
export function loadArabicFlashcardCatalog(): { level: string; count: number }[] {
  const out: { level: string; count: number }[] = [];
  for (const level of LEVELS) {
    const d = loadArabicFlashcardDeck(level);
    if (d && d.cards.length > 0) out.push({ level, count: d.cards.length });
  }
  return out;
}
