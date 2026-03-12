import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarDouPage } from '@/components/GrammarDouPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '都 dōu "hammasi" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 都 (dōu) — "hammasi/barchasi" ma\'nosidagi yuklama. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '都 dōu "все" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 都 (dōu) — частица "все/оба". Примеры и объяснения.',
  },
  en: {
    title: '都 dōu "all/both" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 都 (dōu) — the particle "all/both". Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/dou`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/dou',
        ru: '/ru/chinese/hsk1/grammar/dou',
        en: '/en/chinese/hsk1/grammar/dou',
        'x-default': '/uz/chinese/hsk1/grammar/dou',
      },
    },
  };
}

export default async function DouPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/dou` },
    ]),
    grammarTermJsonLd('dou', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarDouPage />
    </>
  );
}
