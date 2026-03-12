import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarDePage } from '@/components/GrammarDePage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '的 de "egalik yuklamasi" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 的 (de) — egalik va sifat yasovchi yuklama. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '的 de "притяжательная частица" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 的 (de) — притяжательная частица. Примеры и объяснения.',
  },
  en: {
    title: '的 de "possessive particle" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 的 (de) — the possessive and attributive particle. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/de`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/de',
        ru: '/ru/chinese/hsk1/grammar/de',
        en: '/en/chinese/hsk1/grammar/de',
        'x-default': '/uz/chinese/hsk1/grammar/de',
      },
    },
  };
}

export default async function DePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/de` },
    ]),
    grammarTermJsonLd('de', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarDePage />
    </>
  );
}
