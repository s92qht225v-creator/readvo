import fs from 'fs';
import path from 'path';

export interface ArabicSentence {
  id: string;
  ar: string;                 // fully vowelized Arabic
  translit: string;           // Latin transliteration
  text_translation_uz: string;
  text_translation_ru: string;
  text_translation_en: string;
  speaker?: 'A' | 'B';
  audio_url?: string;         // optional recorded audio; else TTS
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
