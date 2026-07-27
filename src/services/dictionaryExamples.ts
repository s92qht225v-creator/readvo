import fs from 'fs';
import path from 'path';

/**
 * Example sentences for the dictionary, sourced from the app's own dialogues.
 *
 * Every sentence from `content/dialogues/*` is flattened into one in-memory list
 * on first use (~3.5k rows, read once per server process) and then scanned with
 * a substring match. Loading 226 JSON files per request would be far too slow;
 * scanning a few thousand short strings is sub-millisecond.
 */

export interface DictExample {
  zh: string;
  pinyin: string;
  uz: string;
  ru: string;
  en: string;
  slug: string;
  level: string;      // 'hsk1'…'hsk6'
  title: string;      // dialogue title (Chinese)
}

let CACHE: DictExample[] | null = null;

/** CC-CEDICT word forms (same file the progressive-pinyin segmenter uses), for
 *  checking that a match is a real WORD and not a coincidental character run. */
let SEG: Set<string> | null = null;
function segWords(): Set<string> {
  if (!SEG) {
    try {
      SEG = new Set(fs.readFileSync(path.join(process.cwd(), 'content', 'segwords.txt'), 'utf-8').split('\n').filter(Boolean));
    } catch { SEG = new Set(); }
  }
  return SEG;
}

const isHan = (c: string) => /[\u4e00-\u9fff]/.test(c);

/**
 * Greedy longest-match segmentation — does `word` appear as its own token?
 * Substring matching alone is wrong across word boundaries: 天天 "matches"
 * 明**天天**气 (明天 + 天气), which is not the word at all.
 */
function containsAsWord(sentence: string, word: string): boolean {
  const dict = segWords();
  if (dict.size === 0) return true;            // no dict → fall back to substring
  const t = [...sentence];
  let i = 0;
  while (i < t.length) {
    if (!isHan(t[i])) { i += 1; continue; }
    let len = 0;
    for (let L = Math.min(4, t.length - i); L >= 2; L--) {
      if (dict.has(t.slice(i, i + L).join(''))) { len = L; break; }
    }
    if (!len) len = 1;
    if (t.slice(i, i + len).join('') === word) return true;
    i += len;
  }
  return false;
}

function load(): DictExample[] {
  if (CACHE) return CACHE;
  const out: DictExample[] = [];
  const root = path.join(process.cwd(), 'content', 'dialogues');
  try {
    for (const level of fs.readdirSync(root)) {
      const dir = path.join(root, level);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        try {
          const d = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
          for (const sec of d.sections ?? []) {
            for (const s of sec.sentences ?? []) {
              if (!s?.text_original) continue;
              out.push({
                zh: s.text_original,
                pinyin: s.pinyin || '',
                uz: s.text_translation || '',
                ru: s.text_translation_ru || '',
                en: s.text_translation_en || s.text_translation || '',
                slug: d.slug,
                level,
                title: d.title || '',
              });
            }
          }
        } catch { /* skip an unreadable dialogue rather than fail the lookup */ }
      }
    }
  } catch { /* no content dir → no examples, dictionary still works */ }
  CACHE = out;
  return out;
}

/**
 * Sentences containing `word`, shortest first — a short sentence is the clearer
 * example, and it keeps the expanded row compact.
 */
export function findExamples(word: string, limit = 3): DictExample[] {
  const w = (word || '').trim();
  if (!w) return [];
  const seen = new Set<string>();
  const hits = load().filter((s) => {
    if (!s.zh.includes(w)) return false;
    if (seen.has(s.zh)) return false;            // same sentence across dialogues
    // Skip sentences that are basically just the word ("喜欢。") — they teach nothing.
    if ([...s.zh].filter(isHan).length < [...w].length + 2) return false;
    seen.add(s.zh);
    return true;
  });
  // Prefer real word-boundary matches; fall back to substring hits only if the
  // segmenter finds none (better a loose example than none at all).
  const exact = hits.filter((s) => containsAsWord(s.zh, w));
  const pool = exact.length ? exact : hits;
  return pool.sort((a, b) => a.zh.length - b.zh.length).slice(0, limit);
}
