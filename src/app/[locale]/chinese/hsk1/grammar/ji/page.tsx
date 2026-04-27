import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarJiPolishedPage } from '@/components/GrammarJiPolishedPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '几 jǐ "nechta?" — Xitoy tili grammatikasi | HSK 1',
    description: "Xitoy tili grammatikasi: 几 (jǐ) — nechta? Son so'rash uchun so'roq so'zi. Misollar va tushuntirishlar.",
  },
  ru: {
    title: '几 jǐ "сколько?" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 几 (jǐ) — сколько? Вопросительное слово для количества. Примеры и объяснения.',
  },
  en: {
    title: '几 jǐ "how many?" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 几 (jǐ) — how many? Question word for small quantities. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/ji`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/ji',
        ru: '/ru/chinese/hsk1/grammar/ji',
        en: '/en/chinese/hsk1/grammar/ji',
        'x-default': '/uz/chinese/hsk1/grammar/ji',
      },
    },
  };
}

export default async function JiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/ji` },
    ]),
    grammarTermJsonLd('ji', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarJiPolishedPage />
    </>
  );
}
