import { getSupabaseAdmin } from '@/lib/supabase-server';

// Toneless-lowercase pinyin, matching hsk_words.py_norm.
const TONE_FROM = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ';
const TONE_TO = 'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu';
const toneMap = new Map([...TONE_FROM].map((c, i) => [c, TONE_TO[i]]));
function toneless(p: string): string {
  return [...(p || '')].map((c) => toneMap.get(c) ?? c).join('').toLowerCase().replace(/[\s'…-]/g, '');
}

type Word = { i?: [number, number]; p?: string };
type Sentence = { text_original: string; pinyin?: string; words?: Word[]; charLvls?: (number | null)[] };
type Dialogue = { sections?: { sentences?: Sentence[] }[] };

const isHan = (c: string) => /[一-鿿]/.test(c);
const MAX_WORD = 4; // longest-match window for segmentation

/**
 * Attach a per-character HSK 3.0 level array (`charLvls`) to every sentence,
 * used to hide pinyin for words below the dialogue's level (progressive pinyin).
 * `charLvls[k]` = the "first-introduced-at" level of the word covering character
 * k; `null` = off-list / not in HSK 3.0 (keep pinyin). Levels come from the
 * sentence's own `words[]` when present (HSK 1), otherwise from longest-match
 * segmentation against the HSK word list (HSK 2+, which ship no word data).
 * Mutates and returns the dialogue.
 */
export async function attachWordLevels<T extends Dialogue>(dialogue: T): Promise<T> {
  const sentences = (dialogue.sections ?? []).flatMap((s) => s.sentences ?? []);
  // Every Han character present → used to pull candidate word forms.
  const chars = new Set<string>();
  for (const s of sentences) for (const c of s.text_original) if (isHan(c)) chars.add(c);
  if (chars.size === 0) return dialogue;

  // Fetch every HSK word form beginning with a character present in the dialogue,
  // with its lowest level. One batched query covers both lookup paths.
  const sb = getSupabaseAdmin();
  const charList = [...chars];
  const formMin = new Map<string, number>();       // zh → lowest level (segmentation)
  const byKey = new Map<string, number>();          // zh|py_norm → level (words[] precise)
  for (let i = 0; i < charList.length; i += 60) {
    const or = charList.slice(i, i + 60).map((c) => `zh.like.${c}*`).join(',');
    const { data } = await sb.from('hsk_word_levels').select('zh,py_norm,level').or(or).limit(10000);
    for (const r of data ?? []) {
      formMin.set(r.zh, Math.min(formMin.get(r.zh) ?? 99, r.level));
      byKey.set(`${r.zh}|${r.py_norm}`, r.level);
    }
  }

  for (const s of sentences) {
    const text = [...s.text_original];
    const lvls: (number | null)[] = new Array(text.length).fill(undefined) as (number | null)[];

    if (s.words?.length) {
      // Precise: use the sentence's own word ranges + pinyin (homograph-safe).
      for (const w of s.words) {
        const [a, b] = w.i ?? [];
        if (typeof a !== 'number' || typeof b !== 'number') continue;
        const zh = text.slice(a, b).join('');
        const exact = w.p ? byKey.get(`${zh}|${toneless(w.p)}`) : undefined;
        const lvl = exact ?? formMin.get(zh) ?? null;
        for (let k = a; k < b; k++) lvls[k] = lvl;
      }
    } else {
      // Segment by greedy longest-match against the HSK word list.
      let i = 0;
      while (i < text.length) {
        if (!isHan(text[i])) { i += 1; continue; }
        let hit = 0;
        for (let len = Math.min(MAX_WORD, text.length - i); len >= 1; len--) {
          const cand = text.slice(i, i + len).join('');
          const lvl = formMin.get(cand);
          if (lvl !== undefined) { for (let k = 0; k < len; k++) lvls[i + k] = lvl; hit = len; break; }
        }
        if (hit) i += hit;
        else { lvls[i] = null; i += 1; } // single Han char not in HSK → off-list
      }
    }
    s.charLvls = lvls;
  }
  return dialogue;
}
