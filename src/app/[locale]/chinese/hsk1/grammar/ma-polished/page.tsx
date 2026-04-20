import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarMaPolishedPage } from '@/components/GrammarMaPolishedPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '吗 ma "-mi?" (polished) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 吗 (ma) — so\'roq zarrasi. Karta formatidagi yangi dizayn.',
  },
  ru: {
    title: '吗 ma «ли?» (polished) — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 吗 (ma) — вопросительная частица. Новый карточный формат.',
  },
  en: {
    title: '吗 ma "yes/no question particle" (polished) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 吗 (ma) — the yes/no question particle. New card-based lesson format.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/ma-polished`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/ma-polished',
        ru: '/ru/chinese/hsk1/grammar/ma-polished',
        en: '/en/chinese/hsk1/grammar/ma-polished',
        'x-default': '/uz/chinese/hsk1/grammar/ma-polished',
      },
    },
  };
}

export default async function MaPolishedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarMaPolishedPage />;
}
