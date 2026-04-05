import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarHenPage } from '@/components/GrammarHenPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '很 hěn "juda" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 很 (hěn) — "juda" ravishi. Sifat oldida ishlatilishi, misollar va tushuntirishlar.',
  },
  ru: {
    title: '很 hěn "очень" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 很 (hěn) — наречие "очень". Употребление перед прилагательными, примеры и объяснения.',
  },
  en: {
    title: '很 hěn "very" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 很 (hěn) — the adverb "very". Usage before adjectives, examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/hen`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/hen',
        ru: '/ru/chinese/hsk1/grammar/hen',
        en: '/en/chinese/hsk1/grammar/hen',
        'x-default': '/uz/chinese/hsk1/grammar/hen',
      },
    },
  };
}

export default async function HenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/hen` },
    ]),
    grammarTermJsonLd('hen', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarHenPage />
    </>
  );
}
