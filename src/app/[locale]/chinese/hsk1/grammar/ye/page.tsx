import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarYePage } from '@/components/GrammarYePage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '也 yě "ham" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 也 (yě) — "ham" ma\'nosidagi yuklama. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '也 yě "тоже" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 也 (yě) — частица "тоже". Примеры и объяснения.',
  },
  en: {
    title: '也 yě "also" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 也 (yě) — the particle "also". Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/ye`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/ye',
        ru: '/ru/chinese/hsk1/grammar/ye',
        en: '/en/chinese/hsk1/grammar/ye',
        'x-default': '/uz/chinese/hsk1/grammar/ye',
      },
    },
  };
}

export default async function YePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/ye` },
    ]),
    grammarTermJsonLd('ye', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarYePage />
    </>
  );
}
