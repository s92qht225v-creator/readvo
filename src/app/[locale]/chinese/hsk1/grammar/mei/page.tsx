import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarMeiPage } from '@/components/GrammarMeiPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '没 méi "inkor (o\'tgan zamon)" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 没 (méi) — o\'tgan zamondagi inkor shakli. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '没 méi "не (прошедшее)" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 没 (méi) — отрицание в прошедшем времени. Примеры и объяснения.',
  },
  en: {
    title: '没 méi "did not" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 没 (méi) — past tense negation. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/mei`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/mei',
        ru: '/ru/chinese/hsk1/grammar/mei',
        en: '/en/chinese/hsk1/grammar/mei',
        'x-default': '/uz/chinese/hsk1/grammar/mei',
      },
    },
  };
}

export default async function MeiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/mei` },
    ]),
    grammarTermJsonLd('mei', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarMeiPage />
    </>
  );
}
