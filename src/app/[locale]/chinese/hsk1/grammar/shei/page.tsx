import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarSheiPage } from '@/components/GrammarSheiPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '谁 shéi "kim?" — Xitoy tili grammatikasi | HSK 1',
    description: "Xitoy tili grammatikasi: 谁 (shéi) — kim? Savol so'zi. Misollar va tushuntirishlar.",
  },
  ru: {
    title: '谁 shéi "кто?" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 谁 (shéi) — кто? Вопросительное слово. Примеры и объяснения.',
  },
  en: {
    title: '谁 shéi "who?" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 谁 (shéi) — who? Question word for people. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/shei`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/shei',
        ru: '/ru/chinese/hsk1/grammar/shei',
        en: '/en/chinese/hsk1/grammar/shei',
        'x-default': '/uz/chinese/hsk1/grammar/shei',
      },
    },
  };
}

export default async function SheiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/shei` },
    ]),
    grammarTermJsonLd('shei', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarSheiPage />
    </>
  );
}
