import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function ok(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  return !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

// Toneless-lowercase pinyin, matching the generated hsk_words.py_norm column.
const TONE_FROM = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ';
const TONE_TO = 'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu';
const toneMap = new Map([...TONE_FROM].map((c, i) => [c, TONE_TO[i]]));
function toneless(p: string): string {
  return [...(p || '')]
    .map((c) => toneMap.get(c) ?? c)
    .join('')
    .toLowerCase()
    .replace(/[\s'…-]/g, '');
}

type Word = { zh: string; pinyin: string };

// Pull the words to analyze: either an existing dialogue's tokenised words[],
// or raw pasted text segmented by longest-match against the HSK list.
function wordsFromDialogue(slug: string): Word[] | null {
  const dirs = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk6'];
  for (const d of dirs) {
    const dir = path.join(process.cwd(), 'content', 'dialogues', d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
      if (data.slug !== slug) continue;
      const words: Word[] = [];
      for (const sec of data.sections || []) {
        for (const s of sec.sentences || []) {
          for (const w of s.words || []) {
            const [a, b] = w.i || [];
            const zh = typeof a === 'number' ? (s.text_original as string).slice(a, b) : '';
            if (zh) words.push({ zh, pinyin: w.p || '' });
          }
        }
      }
      return words;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { slug, text } = await req.json();

  let words: Word[] | null = null;
  let mode: 'dialogue' | 'text' = 'dialogue';

  if (slug) {
    words = wordsFromDialogue(String(slug).trim());
    if (!words) return NextResponse.json({ error: `Dialogue "${slug}" not found` }, { status: 404 });
  } else if (text) {
    mode = 'text';
    // Longest-match segmentation against the HSK list (approximate).
    const hz = [...String(text).replace(/[^一-鿿]/g, '')];
    const sb = getSupabaseAdmin();
    const uniq = [...new Set(hz)];
    // fetch every hsk_words row whose zh starts with a char present in the text (cheap prefilter)
    const { data } = await sb.from('hsk_words').select('zh').in('zh', await candidateForms(sb, uniq));
    const forms = new Set((data || []).map((r) => r.zh));
    words = [];
    let i = 0;
    while (i < hz.length) {
      let matched = '';
      for (let len = Math.min(4, hz.length - i); len >= 1; len--) {
        const cand = hz.slice(i, i + len).join('');
        if (forms.has(cand)) { matched = cand; break; }
      }
      if (matched) { words.push({ zh: matched, pinyin: '' }); i += matched.length; }
      else { words.push({ zh: hz[i], pinyin: '' }); i += 1; }
    }
  } else {
    return NextResponse.json({ error: 'Provide slug or text' }, { status: 400 });
  }

  // Look up levels + glosses for every distinct zh.
  const sb = getSupabaseAdmin();
  const distinct = [...new Set(words.map((w) => w.zh))];
  const [{ data: senses }, { data: gloss }] = await Promise.all([
    sb.from('hsk_words').select('zh,py_norm,level,pinyin,en').in('zh', distinct),
    sb.from('glossary').select('zh,py,uz,ru,en,hsk30_level').in('zh', distinct),
  ]);

  // Level per (zh, toneless-pinyin), and lowest level per zh (the "first introduced at").
  const byKey = new Map<string, number>();
  const byZh = new Map<string, number>();
  for (const r of senses || []) {
    byKey.set(`${r.zh}|${r.py_norm}`, r.level);
    byZh.set(r.zh, Math.min(byZh.get(r.zh) ?? 99, r.level));
  }
  const glossByZh = new Map<string, Record<string, unknown>>();
  for (const g of gloss || []) glossByZh.set(g.zh, g);

  // For words with no whole-word match, estimate a level by composing from
  // their component characters: a word is only understood once you know its
  // hardest part, so level ≈ max(level of each single char). Off-list only if
  // a *part* is also off-list. Clearly marked as an estimate, not authoritative.
  const unmatched = distinct.filter((zh) => !byZh.has(zh) && [...zh].length > 1);
  const charLevel = new Map<string, number>();
  if (unmatched.length) {
    const chars = [...new Set(unmatched.flatMap((zh) => [...zh]))];
    const { data: cl } = await sb.from('hsk_word_levels').select('zh,level').in('zh', chars);
    for (const r of cl || []) charLevel.set(r.zh, Math.min(charLevel.get(r.zh) ?? 99, r.level));
  }
  function composed(zh: string): number | null {
    const parts = [...zh].map((c) => charLevel.get(c));
    return parts.every((p) => p !== undefined) ? Math.max(...(parts as number[])) : null;
  }

  const seen = new Set<string>();
  const rows = words
    .filter((w) => (seen.has(w.zh + w.pinyin) ? false : seen.add(w.zh + w.pinyin)))
    .map((w) => {
      const exact = w.pinyin ? byKey.get(`${w.zh}|${toneless(w.pinyin)}`) : undefined;
      const whole = exact ?? byZh.get(w.zh) ?? null;
      const level = whole ?? composed(w.zh); // 1..6, 7 = 7–9, null = off-list
      const g = glossByZh.get(w.zh);
      return {
        zh: w.zh,
        pinyin: w.pinyin || null,
        level,
        estimate: whole === null && level !== null, // composed, not an official whole-word level
        inGlossary: !!g,
        gloss: g ? (g.uz as string) || (g.en as string) || null : null,
      };
    });

  // Summary: count per level + off-list list.
  const perLevel: Record<string, number> = {};
  const offList: string[] = [];
  for (const r of rows) {
    if (r.level === null) offList.push(r.zh);
    else perLevel[r.level] = (perLevel[r.level] || 0) + 1;
  }

  return NextResponse.json({ mode, count: rows.length, words: rows, perLevel, offList });
}

// Given the distinct chars present, return the set of hsk_words zh values that
// could possibly appear (any multi-char form starting with one of those chars).
// Keeps the segmentation prefilter to a bounded query.
async function candidateForms(
  sb: ReturnType<typeof getSupabaseAdmin>,
  chars: string[],
): Promise<string[]> {
  const out = new Set<string>();
  for (let i = 0; i < chars.length; i += 50) {
    const batch = chars.slice(i, i + 50);
    const or = batch.map((c) => `zh.like.${c}*`).join(',');
    const { data } = await sb.from('hsk_words').select('zh').or(or).limit(5000);
    for (const r of data || []) out.add(r.zh);
  }
  return [...out];
}
