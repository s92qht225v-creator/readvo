import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// Toneless-lowercase pinyin, matching hsk_words.py_norm.
const TONE_FROM = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ';
const TONE_TO = 'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu';
const toneMap = new Map([...TONE_FROM].map((c, i) => [c, TONE_TO[i]]));
function toneless(p: string): string {
  return [...(p || '')].map((c) => toneMap.get(c) ?? c).join('').toLowerCase().replace(/[\s'…-]/g, '');
}

// Chinese word-boundary dictionary (CC-CEDICT multi-char simplified forms) —
// so compounds like 每天 / 试衣间 that aren't HSK headwords still segment as ONE
// word. Loaded once, cached for the process. Levels still come from HSK.
let SEG_WORDS: Set<string> | null = null;
function segWords(): Set<string> {
  if (!SEG_WORDS) {
    try {
      const txt = fs.readFileSync(path.join(process.cwd(), 'content', 'segwords.txt'), 'utf-8');
      SEG_WORDS = new Set(txt.split('\n').filter(Boolean));
    } catch { SEG_WORDS = new Set(); }
  }
  return SEG_WORDS;
}
const MAX_WORD = 4;

type Word = { i?: [number, number]; p?: string };
type Sentence = { text_original: string; pinyin?: string; words?: Word[]; charLvls?: (number | null)[] };
type Dialogue = { sections?: { sentences?: Sentence[] }[] };

const isHan = (c: string) => /[一-鿿]/.test(c);

/**
 * Attach a per-character HSK 3.0 level array (`charLvls`) to every sentence,
 * used to hide pinyin for words below the dialogue's level (progressive pinyin).
 * `charLvls[k]` = level of the word covering character k; `null` = off-list.
 *
 * Word boundaries: the sentence's own `words[]` (HSK 1) or CC-CEDICT longest-match
 * segmentation (HSK 2+, which ship no word data). A word's level = its own HSK
 * level if it's a headword, else the MAX of its characters' HSK levels (a word is
 * only "known" once you know its hardest character), else null when any part is
 * off-list. This keeps a compound like 每天 (每=2, 天=1 → level 2) uniform.
 * Mutates and returns the dialogue.
 */
export async function attachWordLevels<T extends Dialogue>(dialogue: T): Promise<T> {
  const sentences = (dialogue.sections ?? []).flatMap((s) => s.sentences ?? []);
  const chars = new Set<string>();
  for (const s of sentences) for (const c of s.text_original) if (isHan(c)) chars.add(c);
  if (chars.size === 0) return dialogue;

  const sb = getSupabaseAdmin();
  const charList = [...chars];
  const hskWhole = new Map<string, number>();  // zh → lowest HSK level (headwords + single chars)
  const byKey = new Map<string, number>();       // zh|py_norm → level (pinyin-exact)
  for (let i = 0; i < charList.length; i += 60) {
    const or = charList.slice(i, i + 60).map((c) => `zh.like.${c}*`).join(',');
    const { data } = await sb.from('hsk_word_levels').select('zh,py_norm,level').or(or).limit(10000);
    for (const r of data ?? []) {
      hskWhole.set(r.zh, Math.min(hskWhole.get(r.zh) ?? 99, r.level));
      byKey.set(`${r.zh}|${r.py_norm}`, r.level);
    }
  }

  // Level of a word: HSK headword level, else max of component-char levels, else null.
  const wordLevel = (zh: string, py?: string): number | null => {
    const exact = py ? byKey.get(`${zh}|${toneless(py)}`) : undefined;
    const whole = exact ?? hskWhole.get(zh);
    if (whole !== undefined) return whole;
    let mx = 0;
    for (const c of zh) {
      const cl = hskWhole.get(c);
      if (cl === undefined) return null; // a part is off-list → whole word off-list
      mx = Math.max(mx, cl);
    }
    return mx || null;
  };

  const dict = segWords();
  for (const s of sentences) {
    const text = [...s.text_original];
    const lvls: (number | null)[] = new Array(text.length).fill(undefined) as (number | null)[];

    if (s.words?.length) {
      for (const w of s.words) {
        const [a, b] = w.i ?? [];
        if (typeof a !== 'number' || typeof b !== 'number') continue;
        const lvl = wordLevel(text.slice(a, b).join(''), w.p);
        for (let k = a; k < b; k++) lvls[k] = lvl;
      }
    } else {
      let i = 0;
      while (i < text.length) {
        if (!isHan(text[i])) { i += 1; continue; }
        let hit = 0;
        // longest-match against the CEDICT dictionary (len 4..2), then single char.
        for (let len = Math.min(MAX_WORD, text.length - i); len >= 2; len--) {
          const cand = text.slice(i, i + len).join('');
          if (dict.has(cand) || hskWhole.has(cand)) {
            const lvl = wordLevel(cand);
            for (let k = 0; k < len; k++) lvls[i + k] = lvl;
            hit = len; break;
          }
        }
        if (!hit) { lvls[i] = wordLevel(text[i]); hit = 1; }
        i += hit;
      }
    }
    s.charLvls = lvls;
  }
  return dialogue;
}
