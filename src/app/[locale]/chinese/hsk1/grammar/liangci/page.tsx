import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarLiangciPage } from '@/components/GrammarLiangciPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '量词 liàngcí "sanash so\'zlari" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 量词 (liàngcí) — sanash so\'zlari (measure words): 个、本、杯 va boshqalar. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '量词 liàngcí "счётные слова" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 量词 (liàngcí) — счётные слова (measure words): 个、本、杯 и другие. Примеры и объяснения.',
  },
  en: {
    title: '量词 liàngcí "measure words" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 量词 (liàngcí) — measure words: 个、本、杯 and more. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/liangci`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/liangci',
        ru: '/ru/chinese/hsk1/grammar/liangci',
        en: '/en/chinese/hsk1/grammar/liangci',
        'x-default': '/uz/chinese/hsk1/grammar/liangci',
      },
    },
  };
}

export default async function LiangciPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/liangci` },
    ]),
    grammarTermJsonLd('liangci', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarLiangciPage />
    </>
  );
}
