import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export interface GlossaryEntry { zh: string; py: string; uz: string; ru: string; en: string; hsk?: number }
/** Marks a personal or place name (专有名词). It rides through to
 *  `attachWordLevels`, which treats the name as off-list so its pinyin shows at
 *  every HSK level — you cannot guess how to read a name.
 *
 *  `true`   — the whole entry is the name (李进, 王静).
 *  `"..."`  — only this part is (`proper: "李"` on 李老师). A title like 老师 is
 *             an ordinary HSK 1 word the learner already knows, so annotating it
 *             is noise; and dropping the flag altogether isn't the answer either,
 *             because a surname that happens to be an HSK headword (高, level 2)
 *             would then lose its pinyin. Naming the span settles both. */
export type ProperFlag = boolean | string;
export type VocabRef = string
  | { zh: string; py?: string; uz?: string; ru?: string; en?: string; proper?: ProperFlag };
export interface VocabItem { zh: string; py: string; uz: string; ru: string; en: string; proper?: ProperFlag }

export function normPy(py: string): string {
  return py.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

const GLOSSARY_COLS = 'zh, py, uz, ru, en, hsk';

/**
 * Read the ENTIRE glossary table, paged.
 *
 * PostgREST caps a single response at 1000 rows. The glossary has grown past
 * that, so every full-table read MUST page — a bare `.select()` silently
 * truncates to the first 1000 rows and the most recently added words vanish
 * from whatever consumes them (dialogue Words tabs, the validator, the admin
 * list). ALWAYS use this helper; never a bare `.select()` over `glossary`.
 *
 * Throws on a Supabase error (never returns a partial/empty list) so a transient
 * failure isn't mistaken for "no glossary" — callers catch and fall back.
 */
export async function fetchAllGlossaryRows<T = GlossaryEntry>(columns: string = GLOSSARY_COLS): Promise<T[]> {
  const PAGE = 1000;
  const all: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await getSupabaseAdmin()
      .from('glossary')
      .select(columns)
      // Order by the immutable PK so page boundaries are stable across requests
      // (zh has homograph ties that could skip/duplicate a row at a boundary).
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`[glossary] load failed: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as unknown as T[]));
    if (data.length < PAGE) break;
  }
  return all;
}

/**
 * All glossary rows, cached under the `glossary` tag.
 *
 * `revalidate: 300` is a safety net, not the primary freshness mechanism: admin
 * edits call `revalidateTag('glossary')` for instant propagation. But the tag
 * bust can be missed (raw-SQL inserts don't fire it) or a stale snapshot can
 * survive in `.next/cache` across a deploy — without a TTL that stale glossary
 * would be served *forever*, which is exactly how words "kept not showing".
 * The TTL guarantees any staleness self-heals within 5 minutes.
 */
export const getGlossary = unstable_cache(
  async (): Promise<GlossaryEntry[]> => fetchAllGlossaryRows<GlossaryEntry>(),
  ['glossary-all'],
  { tags: ['glossary'], revalidate: 300 },
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
    const o: { py?: string; uz?: string; ru?: string; en?: string; proper?: ProperFlag } = typeof ref === 'string' ? {} : ref;
    // `proper` is authored on the ref, never stored in the glossary, so it has
    // to be copied onto every result shape below or it is silently lost.
    const proper = o.proper ? { proper: o.proper } : {};
    if (!entry) {
      // No glossary row. A SELF-CONTAINED ref — one that carries its own pinyin
      // and at least an Uzbek gloss — has everything the Words tab needs, so
      // render it rather than silently dropping authored content.
      //
      // Bare and partial refs still drop: that is the guard against typos, and
      // it only works because such a ref genuinely lacks the data to render.
      // Prefer adding the word to the glossary anyway — that is what makes it
      // reusable across dialogues, and editable without a deploy.
      if (o.py && o.uz) out.push({ zh, py: o.py, uz: o.uz, ru: o.ru ?? '', en: o.en ?? '', ...proper });
      continue;
    }
    out.push({
      zh: entry.zh,
      py: entry.py,
      uz: o.uz ?? entry.uz,
      ru: o.ru ?? entry.ru,
      en: o.en ?? entry.en,
      ...proper,
    });
  }
  return out;
}
