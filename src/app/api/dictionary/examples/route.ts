import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Example sentences for one dictionary word.
 *
 * These are written FOR the headword and capped at its own HSK 3.0 level (see
 * `scripts/gen-word-examples.py`). An earlier version mined the app's dialogues
 * instead, which produced level-6 sentences for level-1 words — 白天 ("daytime",
 * HSK 1) was illustrated with 我现在都有点神经衰弱了. An example must never be
 * harder than the word it explains.
 *
 * `word_examples` is RLS-with-no-policies (service-role only), so all reads come
 * through here. Public, like the rest of the dictionary.
 */

const TONE_FROM = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ';
const TONE_TO = 'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu';
const toneMap = new Map([...TONE_FROM].map((c, i) => [c, TONE_TO[i]]));
const toneless = (p: string) =>
  [...(p || '')].map((c) => toneMap.get(c) ?? c).join('').toLowerCase().replace(/[\s'·・-]/g, '');

export async function GET(req: NextRequest) {
  const zh = (req.nextUrl.searchParams.get('zh') || '').trim();
  const py = (req.nextUrl.searchParams.get('py') || '').trim();
  if (!zh || zh.length > 12) return NextResponse.json({ examples: [] });

  try {
    const sb = getSupabaseAdmin();
    let q = sb
      .from('word_examples')
      .select('ex_zh,ex_py,uz,ru,en,level')
      .eq('zh', zh)
      .order('seq');
    // Senses are keyed by pinyin (打 dǎ vs dá). Without a pinyin we'd mix them,
    // so filter when the caller knows which sense it is showing.
    if (py) q = q.eq('py_norm', toneless(py));

    const { data, error } = await q.limit(3);
    if (error) throw new Error(error.message);

    return NextResponse.json(
      { zh, examples: data ?? [] },
      { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
    );
  } catch (e) {
    console.error('[dictionary] examples failed', e);
    return NextResponse.json({ examples: [] });
  }
}
