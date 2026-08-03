import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Attach a gloss for every word in a dialogue, so long-press lookup in the
 * reader is instant.
 *
 * WHY BUNDLED, NOT FETCHED PER PRESS: a lookup is a reflex — you press because
 * you're stuck mid-sentence. A 100-400ms round trip on a phone in Tashkent turns
 * that into "panel appears empty, then fills", which reads as broken. A whole
 * dialogue is ~45 distinct words ≈ 5 KB on a response we already send, so we pay
 * once at load and every press afterwards is free.
 *
 * Words come from `wordSpans`, which `attachWordLevels` produces with the SAME
 * CC-CEDICT segmentation that drives progressive pinyin — so pressing any part
 * of 白天 selects 白天, and the reader can never disagree with itself about where
 * a word begins.
 */

export interface Gloss {
  py: string;
  uz: string;
  ru: string;
  en: string;
  hsk: number | null;
}

type Sentence = { text_original: string; wordSpans?: [number, number][] };
type Dialogue = { sections?: { sentences?: Sentence[] }[]; glosses?: Record<string, Gloss> };

const isHan = (c: string) => /[一-鿿]/.test(c);

export async function attachGlosses<T extends Dialogue>(dialogue: T): Promise<T> {
  const sentences = (dialogue.sections ?? []).flatMap((s) => s.sentences ?? []);

  const words = new Set<string>();
  for (const s of sentences) {
    const chars = [...s.text_original];
    for (const [a, b] of s.wordSpans ?? []) {
      const w = chars.slice(a, b).join('');
      if (w && [...w].some(isHan)) words.add(w);
    }
  }
  if (words.size === 0) return dialogue;

  const list = [...words];
  const out: Record<string, Gloss> = {};
  try {
    const sb = getSupabaseAdmin();
    // hsk_words first, glossary second — the glossary is the human-curated layer
    // and overwrites the machine gloss, same precedence as the dictionary search.
    for (let i = 0; i < list.length; i += 60) {
      const chunk = list.slice(i, i + 60);
      const or = chunk.map((w) => `zh.eq.${w}`).join(',');
      const [hsk, glos] = await Promise.all([
        sb.from('hsk_words').select('zh,pinyin,level,uz,ru,en').or(or).limit(500),
        sb.from('glossary').select('zh,py,uz,ru,en,hsk30_level').or(or).limit(500),
      ]);
      for (const r of hsk.data ?? []) {
        const prev = out[r.zh];
        // Multiple senses: keep the lowest level — the sense a learner meets first.
        if (prev && prev.hsk != null && r.level >= prev.hsk) continue;
        out[r.zh] = {
          py: r.pinyin, hsk: r.level,
          uz: String(r.uz || '').trim(), ru: String(r.ru || '').trim(), en: String(r.en || '').trim(),
        };
      }
      for (const r of glos.data ?? []) {
        const prev = out[r.zh];
        out[r.zh] = {
          py: r.py || prev?.py || '',
          hsk: (r.hsk30_level as number | null) ?? prev?.hsk ?? null,
          uz: String(r.uz || '').trim() || prev?.uz || '',
          ru: String(r.ru || '').trim() || prev?.ru || '',
          en: String(r.en || '').trim() || prev?.en || '',
        };
      }
    }
  } catch (e) {
    console.error('[dialogue] gloss lookup failed', e);
    return dialogue;      // reader still works, long-press just finds nothing
  }

  dialogue.glosses = out;
  return dialogue;
}
