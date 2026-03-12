import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarBuPage } from '@/components/GrammarBuPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '不 bù "inkor" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 不 (bù) — inkor shakli. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '不 bù "отрицание" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 不 (bù) — отрицательная частица. Примеры и объяснения.',
  },
  en: {
    title: '不 bù "negation" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 不 (bù) — negation. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/bu`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/bu',
        ru: '/ru/chinese/hsk1/grammar/bu',
        en: '/en/chinese/hsk1/grammar/bu',
        'x-default': '/uz/chinese/hsk1/grammar/bu',
      },
    },
  };
}

export default async function BuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/bu` },
    ]),
    grammarTermJsonLd('bu', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarBuPage />
    </>
  );
}
