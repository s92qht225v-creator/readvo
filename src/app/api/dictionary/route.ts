import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Public dictionary search (M5).
 *
 * Searches the HSK 3.0 spine (`hsk_words`, 11k) plus the curated dialogue
 * `glossary` (2.5k), matching 汉字 (exact + prefix), toneless pinyin
 * ("kongtiao"), or native text (uz/ru/en). Results merge with
 * **glossary gloss winning** over the machine-generated hsk_words gloss.
 *
 * Public on purpose — top-of-funnel, same as the blog/catalogs. Both tables are
 * RLS-with-no-policies (service-role only), so all access goes through here;
 * user input is stripped of PostgREST filter metacharacters before it reaches a
 * filter, and results are hard-capped.
 */

const MAX_RESULTS = 40;

/** Toneless, lowercase pinyin — mirrors `hsk_words.py_norm`.
 *  (`glossary.py_norm` keeps its tones, so glossary pinyin is normalised here.) */
const TONE_FROM = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ';
const TONE_TO = 'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu';
const toneMap = new Map([...TONE_FROM].map((c, i) => [c, TONE_TO[i]]));
function toneless(p: string): string {
  return [...(p || '')].map((c) => toneMap.get(c) ?? c).join('').toLowerCase().replace(/[\s'·・-]/g, '');
}

const hasHan = (s: string) => /[\u4e00-\u9fff]/.test(s);

type Row = {
  zh: string;
  pinyin: string;
  level: number | null;
  meaning: string;
  source: 'glossary' | 'hsk';
};

type Lang = 'uz' | 'ru' | 'en';
const pickLang = (v: string | null): Lang => (v === 'ru' || v === 'en' ? v : 'uz');
const glossOf = (r: Record<string, unknown>, lang: Lang): string =>
  String((r[lang] as string) || (r.en as string) || (r.uz as string) || '').trim();

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get('q') || '').trim();
  const lang = pickLang(req.nextUrl.searchParams.get('lang'));
  if (!raw) return NextResponse.json({ q: '', results: [] });
  if (raw.length > 40) return NextResponse.json({ q: raw, results: [] });

  // Strip PostgREST filter metacharacters so input can't break out of a filter.
  const safe = raw.replace(/[,()*:."'\\%_]/g, ' ').trim();
  if (!safe) return NextResponse.json({ q: raw, results: [] });
  const tl = toneless(safe);
  const sb = getSupabaseAdmin();

  const han = hasHan(safe);
  // Latin input can be pinyin OR a native-language word, so we try both.
  const hskOr = han
    ? `zh.eq.${safe},zh.like.${safe}*`
    : `py_norm.eq.${tl},py_norm.like.${tl}*,uz.ilike.%${safe}%,ru.ilike.%${safe}%,en.ilike.%${safe}%`;
  const glosOr = han
    ? `zh.eq.${safe},zh.like.${safe}*`
    : `py.ilike.%${safe}%,uz.ilike.%${safe}%,ru.ilike.%${safe}%,en.ilike.%${safe}%`;

  try {
    const [hsk, glos] = await Promise.all([
      sb.from('hsk_words').select('zh,pinyin,py_norm,level,uz,ru,en').or(hskOr).limit(120),
      sb.from('glossary').select('zh,py,uz,ru,en,hsk30_level').or(glosOr).limit(120),
    ]);
    if (hsk.error) throw new Error(hsk.error.message);
    if (glos.error) throw new Error(glos.error.message);

    // Merge on (zh, toneless-pinyin). Glossary is the human layer → it wins.
    const byKey = new Map<string, Row>();
    for (const r of hsk.data ?? []) {
      const key = `${r.zh}|${r.py_norm}`;
      const meaning = glossOf(r, lang);
      const prev = byKey.get(key);
      // Same word, multiple senses → keep the lowest level, join distinct glosses.
      if (prev) {
        if (r.level != null && (prev.level == null || r.level < prev.level)) prev.level = r.level;
        if (meaning && !prev.meaning.includes(meaning)) prev.meaning += `; ${meaning}`;
      } else {
        byKey.set(key, { zh: r.zh, pinyin: r.pinyin, level: r.level, meaning, source: 'hsk' });
      }
    }
    for (const r of glos.data ?? []) {
      const key = `${r.zh}|${toneless(r.py)}`;
      const meaning = glossOf(r, lang);
      const existing = byKey.get(key);
      byKey.set(key, {
        zh: r.zh,
        pinyin: r.py || existing?.pinyin || '',
        level: (r.hsk30_level as number | null) ?? existing?.level ?? null,
        meaning: meaning || existing?.meaning || '',
        source: 'glossary',
      });
    }

    const qLower = safe.toLowerCase();
    const rank = (r: Row): number => {
      const rtl = toneless(r.pinyin);
      if (r.zh === safe) return 0;
      if (rtl === tl) return 1;
      if (r.zh.startsWith(safe)) return 2;
      if (rtl.startsWith(tl)) return 3;
      if (r.meaning.toLowerCase() === qLower) return 4;
      if (r.meaning.toLowerCase().startsWith(qLower)) return 5;
      return 6;
    };
    // Within the same match quality, surface the more common word first: lower
    // HSK level wins, unlevelled (off-list) last. Without this a prefix search
    // for 医 put 医保 (no level) above 医生 (HSK 1, "doctor").
    const lvlRank = (l: number | null) => (l == null ? 99 : l);
    const results = [...byKey.values()]
      .filter((r) => r.meaning)
      .sort((a, b) =>
        rank(a) - rank(b) ||
        lvlRank(a.level) - lvlRank(b.level) ||
        a.zh.length - b.zh.length ||
        a.zh.localeCompare(b.zh))
      .slice(0, MAX_RESULTS);

    return NextResponse.json({ q: raw, results }, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
    });
  } catch (e) {
    console.error('[dictionary] search failed', e);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}
