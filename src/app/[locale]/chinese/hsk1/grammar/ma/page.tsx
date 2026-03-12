import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarMaPage } from '@/components/GrammarMaPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '吗 ma "savol yuklamasi" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 吗 (ma) — ha/yo\'q savol yasash. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '吗 ma "вопросительная частица" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 吗 (ma) — вопросительная частица. Примеры и объяснения.',
  },
  en: {
    title: '吗 ma "question particle" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 吗 (ma) — yes/no question particle. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/ma`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/ma',
        ru: '/ru/chinese/hsk1/grammar/ma',
        en: '/en/chinese/hsk1/grammar/ma',
        'x-default': '/uz/chinese/hsk1/grammar/ma',
      },
    },
  };
}

export default async function MaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/ma` },
    ]),
    grammarTermJsonLd('ma', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarMaPage />
    </>
  );
}
