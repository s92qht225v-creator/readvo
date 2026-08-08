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
  vocab?: { zh?: string; proper?: boolean | string }[];
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
export async function attachWordLevels<T extends Dialogue>(
  dialogue: T,
  opts: { annotateOnly?: string[] } = {},
): Promise<T> {
  const sentences = (dialogue.sections ?? []).flatMap((s) => s.sentences ?? []);

  // ── vocabOnly: annotate exactly this text's new words ──────────────────
  //
  // HSK Standard Course texts ship the book's own 生词 list, so "new" is a
  // stated fact rather than something to infer from a level. The level rule is
  // nearly vacuous here anyway: in a level-4 text every interesting word IS
  // level 4, so it annotated 中年 and 就是 (in no word list) exactly as loudly
  // as the seven words the lesson actually teaches.
  //
  // Free dialogues keep the level rule — they have no authoritative new-word
  // list, so there is nothing else to key on.
  //
  // The caller passes the spans (from the AUTHORED vocab, not the glossary-
  // resolved list — a ref that fails to resolve should lose its Words-tab card,
  // never its annotation). An empty list means the text has no 生词 of its own,
  // e.g. a 文化 passage: fall through to the level rule rather than stripping
  // every annotation from the hardest text in the unit.
  //
  // A span is the vocab entry itself, except where `proper` names a part:
  // `proper: "李"` on 李老师 annotates the surname and leaves 老师, an ordinary
  // word, bare. Needs no HSK data at all, so no database round-trip.
  if (opts.annotateOnly?.length) {
    const spans = opts.annotateOnly;
    for (const s of sentences) {
      const text = [...s.text_original];
      // 0, not 1: `hidePy` is `level < dialogueLevel`, so a level-1 book needs
      // something below 1 to count as hidden.
      const lvls: (number | null)[] = new Array(text.length).fill(0);
      for (const span of spans) {
        const t = [...span];
        for (let i = 0; i + t.length <= text.length; i++) {
          if (t.every((c, k) => text[i + k] === c)) {
            for (let k = 0; k < t.length; k++) lvls[i + k] = null;
          }
        }
      }
      s.charLvls = lvls;
    }
    return dialogue;
  }

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
  // `proper: "李"` on 李老师 marks only the surname: 老师 is an ordinary HSK 1
  // word, so blanket-nulling the whole span annotated a word the learner knows.
  // NOTE this makes that character off-list for the WHOLE text, so name a
  // character that is only ever the name in this text (高 as a surname, not 高 in
  // 高兴).
  const properSet = new Set(
    (dialogue.vocab ?? [])
      .filter((v) => v?.proper && v.zh)
      .map((v) => (typeof v.proper === 'string' ? v.proper : (v.zh as string))),
  );
  const properMax = Math.max(0, ...[...properSet].map((w) => [...w].length));


  // Easiest HSK word beginning with a given character. hskWhole was filled by a
  // `zh.like.<char>*` prefix query, so every such word is already loaded.
  const fallbackMemo = new Map<string, number | null>();
  const charFallback = (c: string): number | null => {
    if (fallbackMemo.has(c)) return fallbackMemo.get(c)!;
    let min: number | null = null;
    for (const [w, l] of hskWhole) {
      if (w.startsWith(c) && (min === null || l < min)) min = l;
    }
    fallbackMemo.set(c, min);
    return min;
  };

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
    if (mx) return mx;

    // A single character with no headword of its own. 没 is the case that
    // exposed this: HSK 3.0 lists 没有 (level 1) but not 没 alone, so 没 came
    // back off-list and kept its pinyin in every text at every level — the one
    // annotated character in an otherwise bare sentence.
    //
    // Fall back to the EASIEST HSK word that starts with the character: that is
    // where a learner first meets it. 没 → 没有 → level 1. If the character only
    // ever begins hard words the level stays high and the pinyin still shows,
    // which is the safe direction to fail in.
    if ([...zh].length === 1) return charFallback(zh);
    return null; // 0 means "no parts" → treat as off-list
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

      // 数词/指示词 + 量词 + 名词: after one of these, the next character is a
      // classifier, so a dictionary match starting ON the classifier is reading
      // across a word boundary. 两个人 matched 个人 ("individual", HSK 5) and
      // showed pinyin for 个 and 人 — both level 1 — in a level-4 text.
      // Measured over the whole corpus: 个人 follows a quantifier 80 times (all
      // classifier readings) and a non-quantifier 15 times (all genuine 个人),
      // so this test separates them cleanly and leaves real 个人 alone.
      const QUANT = new Set([...'0123456789一二三四五六七八九十百千万亿两半几每整多某这那各']);

      let i = 0;
      while (i < text.length) {
        if (!isHan(text[i])) { i += 1; continue; }
        let hit = matchLen(i);

        if (hit >= 2 && i > 0 && QUANT.has(text[i - 1])) {
          const single = wordLevel(text[i]);
          const greedy = wordLevel(text.slice(i, i + hit).join(''));
          // Only split when the classifier really is the easier reading; this
          // leaves compounds where the first char is no simpler untouched.
          if (single !== null && (greedy === null || single < greedy)) hit = 1;
        }

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
