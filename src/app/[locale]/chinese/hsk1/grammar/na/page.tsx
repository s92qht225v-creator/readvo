import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarNaPage } from '@/components/GrammarNaPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '哪 nǎ "qaysi?" — Xitoy tili grammatikasi | HSK 1',
    description: "Xitoy tili grammatikasi: 哪 (nǎ) — qaysi? Tanlov savol so'zi. Misollar va tushuntirishlar.",
  },
  ru: {
    title: '哪 nǎ "который?" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 哪 (nǎ) — который/которое? Вопросительное слово выбора. Примеры и объяснения.',
  },
  en: {
    title: '哪 nǎ "which?" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 哪 (nǎ) — which? Question word for selecting from options. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/na`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/na',
        ru: '/ru/chinese/hsk1/grammar/na',
        en: '/en/chinese/hsk1/grammar/na',
        'x-default': '/uz/chinese/hsk1/grammar/na',
      },
    },
  };
}

export default async function NaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/na` },
    ]),
    grammarTermJsonLd('na', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarNaPage />
    </>
  );
}
