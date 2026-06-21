import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export interface GlossaryEntry { zh: string; py: string; uz: string; ru: string; en: string; hsk?: number }
export type VocabRef = string | { zh: string; py?: string; uz?: string; ru?: string; en?: string };
export interface VocabItem { zh: string; py: string; uz: string; ru: string; en: string }

export function normPy(py: string): string {
  return py.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** All glossary rows, cached until the `glossary` tag is revalidated. */
export const getGlossary = unstable_cache(
  async (): Promise<GlossaryEntry[]> => {
    // PostgREST caps a single response at 1000 rows by default. The glossary has
    // grown past that, so page through it explicitly — otherwise rows beyond 1000
    // (the most recently added words) silently drop and their dialogues lose vocab.
    const PAGE = 1000;
    const all: GlossaryEntry[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await getSupabaseAdmin()
        .from('glossary')
        .select('zh, py, uz, ru, en, hsk')
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      // Throw (don't return []) so unstable_cache does NOT cache a transient failure —
      // otherwise one Supabase hiccup would persist an empty glossary for the whole
      // tag lifetime. Callers (resolveDialogueVocab) catch this and fall back.
      if (error) throw new Error(`[glossary] load failed: ${error.message}`);
      if (!data?.length) break;
      all.push(...data);
      if (data.length < PAGE) break;
    }
    return all;
  },
  ['glossary-all'],
  { tags: ['glossary'] },
);

/** Resolve a dialogue's reference list into display items. Unknown refs are
 *  dropped (the dialogue's auto-extract fallback covers the gap). */
export async function resolveVocab(refs: VocabRef[]): Promise<VocabItem[]> {
  if (!refs?.length) return [];
  const glossary = await getGlossary();
  const byZh = new Map<string, GlossaryEntry[]>();
  for (const e of glossary) {
    const list = byZh.get(e.zh) ?? [];
    list.push(e);
    byZh.set(e.zh, list);
  }
  const out: VocabItem[] = [];
  for (const ref of refs) {
    const zh = typeof ref === 'string' ? ref : ref.zh;
    const wantPy = typeof ref === 'string' ? undefined : ref.py;
    const candidates = byZh.get(zh) ?? [];
    let entry: GlossaryEntry | undefined;
    if (candidates.length === 1 && !wantPy) entry = candidates[0];
    else if (wantPy) entry = candidates.find((c) => normPy(c.py) === normPy(wantPy));
    else entry = undefined; // ambiguous bare ref: skip (validation catches authoring errors)
    if (!entry) continue;
    const o: { uz?: string; ru?: string; en?: string } = typeof ref === 'string' ? {} : ref;
    out.push({
      zh: entry.zh,
      py: entry.py,
      uz: o.uz ?? entry.uz,
      ru: o.ru ?? entry.ru,
      en: o.en ?? entry.en,
    });
  }
  return out;
}
