import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarLiangciPage } from '@/components/GrammarLiangciPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '量词 (liàngcí) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 量词 (liàngcí) — sanash so\'zlari (measure words): 个、本、杯 va boshqalar. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '量词 (liàngcí) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 量词 (liàngcí) — счётные слова (measure words): 个、本、杯 и другие. Примеры и объяснения.',
  },
  en: {
    title: '量词 (liàngcí) — Chinese Grammar | HSK 1',
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

  return <GrammarLiangciPage />;
}
