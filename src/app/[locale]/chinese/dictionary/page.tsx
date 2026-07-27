import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { DictionarySearch, type DictEntry } from '@/components/DictionarySearch';

// The starter list is effectively static; the search itself is client-fetched.
export const revalidate = 86400;

const META: Record<string, { title: string; description: string }> = {
  uz: {
    title: "Xitoycha lug'at — HSK 3.0 so'zlari",
    description: "11 000 dan ortiq xitoycha so'z: iyeroglif, pinyin va o'zbekcha tarjima bilan. HSK 3.0 darajasi ko'rsatilgan. Iyeroglif, pinyin yoki o'zbekcha so'z bo'yicha qidiring.",
  },
  ru: {
    title: 'Китайский словарь — слова HSK 3.0',
    description: 'Более 11 000 китайских слов: иероглиф, пиньинь и перевод на русский, с уровнем HSK 3.0. Поиск по иероглифу, пиньиню или русскому слову.',
  },
  en: {
    title: 'Chinese Dictionary — HSK 3.0 Word List',
    description: 'Over 11,000 Chinese words with characters, pinyin and English meanings, each tagged with its HSK 3.0 level. Search by character, pinyin, or English.',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] || META.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/dictionary`,
      languages: {
        uz: '/uz/chinese/dictionary',
        ru: '/ru/chinese/dictionary',
        en: '/en/chinese/dictionary',
        'x-default': '/uz/chinese/dictionary',
      },
    },
    openGraph: { title: m.title, description: m.description, type: 'website' },
  };
}

/** A small, stable slice of HSK 1 words so the page ships real content for
 *  crawlers (and something useful to browse) before anyone types. Glossary
 *  glosses override the machine ones, same precedence as search. */
async function starterWords(locale: string): Promise<DictEntry[]> {
  const lang = locale === 'ru' ? 'ru' : locale === 'en' ? 'en' : 'uz';
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('hsk_words')
      .select('zh,pinyin,level,uz,ru,en')
      .eq('level', 1)
      .order('hsk_id')
      .limit(36);
    const rows = data ?? [];
    const { data: gl } = await sb
      .from('glossary')
      .select('zh,uz,ru,en')
      .in('zh', rows.map((r) => r.zh));
    const override = new Map((gl ?? []).map((g) => [g.zh, g]));
    return rows.map((r) => {
      const g = override.get(r.zh);
      const pick = (o: Record<string, unknown> | undefined) =>
        o ? String((o[lang] as string) || (o.en as string) || (o.uz as string) || '').trim() : '';
      return {
        zh: r.zh,
        pinyin: r.pinyin,
        level: r.level,
        meaning: pick(g) || pick(r),
      };
    }).filter((e) => e.meaning);
  } catch {
    return [];   // dictionary still works — search is client-side
  }
}

export default async function DictionaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const initial = await starterWords(locale);
  return <DictionarySearch initial={initial} />;
}
