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
type Dialogue = {
  sections?: { sentences?: Sentence[] }[];
  /** Vocab entries flagged `proper` are personal/place names — see below. */
  vocab?: { zh?: string; proper?: boolean }[];
};

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

  // Personal and place names (专有名词, flagged `proper` in a text's vocab).
  //
  // Two things go wrong without this, and both were visible on 李进:
  //   1. The name isn't in CC-CEDICT, so it segments per character — 李 (a
  //      surname, off-list) kept its pinyin while 进 (HSK 1) was hidden, giving
  //      a half-annotated name that reads as a bug.
  //   2. Even segmented whole, a name built from ordinary characters (王静,
  //      孙月) would take the MAX of their HSK levels and be hidden entirely.
  // A name has no HSK level and its reading cannot be guessed from the
  // characters, so it is always one word and always off-list: pinyin at every
  // level. `properSet` is consulted before the dictionary and short-circuits
  // `wordLevel`.
  const properSet = new Set(
    (dialogue.vocab ?? []).filter((v) => v?.proper && v.zh).map((v) => v.zh as string),
  );
  const properMax = Math.max(0, ...[...properSet].map((w) => [...w].length));


  // Level of a word: HSK headword level, else the max over its largest known
  // SUB-WORDS, else null.
  //
  // Sub-words, not single characters: 有时候 is not an HSK headword, and 候 alone
  // isn't an HSK entry either, so a char-by-char fallback called the whole thing
  // off-list and showed pinyin for it at every level. Decomposing into 有 + 时候
  // (both level 1) gets it right. Same for 工作时间 → 工作 + 时间.
  const wordLevel = (zh: string, py?: string): number | null => {
    // A name is off-list by definition — never fall through to the HSK lookup
    // or the character decomposition below, which would give 王静 the max of
    // 王 and 静 and hide the whole name at level 4.
    if (properSet.has(zh)) return null;
    const exact = py ? byKey.get(`${zh}|${toneless(py)}`) : undefined;
    const whole = exact ?? hskWhole.get(zh);
    if (whole !== undefined) return whole;
    // Pick the decomposition with the LOWEST hardest part, not the one with the
    // longest first match. Longest-first reads 一个人 as 一 + 个人 ("individual",
    // HSK 5) and calls a level-1 phrase level 5; the easiest reading 一 + 个 + 人
    // is the one a learner actually parses. Words are <= a few characters, so
    // this exhaustive search is trivial.
    const t = [...zh];
    const memo = new Map<number, number | null>();
    const best = (i: number): number | null => {
      if (i >= t.length) return 0;
      if (memo.has(i)) return memo.get(i)!;
      let out: number | null = null;
      for (let len = 1; len <= Math.min(MAX_WORD, t.length - i); len++) {
        const l = hskWhole.get(t.slice(i, i + len).join(''));
        if (l === undefined) continue;
        const rest = best(i + len);
        if (rest === null) continue;
        const cand = Math.max(l, rest);
        if (out === null || cand < out) out = cand;
      }
      memo.set(i, out);
      return out;
    };
    const mx = best(0);
    return mx ? mx : null; // 0 means "no parts" → treat as off-list
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
      // Longest match starting at `at`, or 0 if none beyond a bare character.
      const matchLen = (at: number): number => {
        // Names first, and beyond MAX_WORD if need be (李老师 is 3, but a full
        // name can be longer than an ordinary compound).
        for (let len = Math.min(properMax, text.length - at); len >= 2; len--) {
          if (properSet.has(text.slice(at, at + len).join(''))) return len;
        }
        for (let len = Math.min(MAX_WORD, text.length - at); len >= 2; len--) {
          const cand = text.slice(at, at + len).join('');
          if (dict.has(cand) || hskWhole.has(cand)) return len;
        }
        return 0;
      };

      let i = 0;
      while (i < text.length) {
        if (!isHan(text[i])) { i += 1; continue; }
        let hit = matchLen(i);

        // Greedy longest-match sometimes swallows a rare CC-CEDICT entry that
        // straddles two ordinary words: 没有同事在旁边 matched 在旁 ("at one's
        // side", literary) and stranded 边, so the reader showed pinyin for a
        // word that isn't in the sentence and hid none for 旁边 (HSK 2).
        //
        // When the greedy match is off-list, prefer a SHORTER split — but only
        // if BOTH resulting words are known. That guard is what keeps a genuine
        // off-list compound intact: 通勤 would split to 通 + 勤, and 勤 is
        // off-list, so it stays whole and keeps its pinyin.
        if (hit >= 2 && wordLevel(text.slice(i, i + hit).join('')) === null) {
          for (let len = hit - 1; len >= 1; len--) {
            if (wordLevel(text.slice(i, i + len).join('')) === null) continue;
            const nextLen = matchLen(i + len) || 1;
            if (wordLevel(text.slice(i + len, i + len + nextLen).join('')) !== null) {
              hit = len;
              break;
            }
          }
        }

        if (!hit) { lvls[i] = wordLevel(text[i]); hit = 1; }
        else {
          const lvl = wordLevel(text.slice(i, i + hit).join(''));
          for (let k = 0; k < hit; k++) lvls[i + k] = lvl;
        }
        i += hit;
      }
    }
    s.charLvls = lvls;
  }
  return dialogue;
}
