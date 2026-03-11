import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarMeiPage } from '@/components/GrammarMeiPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '没 (méi) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 没 (méi) — o\'tgan zamondagi inkor shakli. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '没 (méi) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 没 (méi) — отрицание в прошедшем времени. Примеры и объяснения.',
  },
  en: {
    title: '没 (méi) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 没 (méi) — past tense negation. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/mei`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/mei',
        ru: '/ru/chinese/hsk1/grammar/mei',
        en: '/en/chinese/hsk1/grammar/mei',
        'x-default': '/uz/chinese/hsk1/grammar/mei',
      },
    },
  };
}

export default async function MeiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarMeiPage />;
}
