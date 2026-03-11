import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarBuPage } from '@/components/GrammarBuPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '不 (bù) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 不 (bù) — inkor shakli. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '不 (bù) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 不 (bù) — отрицательная частица. Примеры и объяснения.',
  },
  en: {
    title: '不 (bù) — Chinese Grammar | HSK 1',
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

  return <GrammarBuPage />;
}
