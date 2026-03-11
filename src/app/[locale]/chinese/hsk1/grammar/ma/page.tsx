import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarMaPage } from '@/components/GrammarMaPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '吗 (ma) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 吗 (ma) — ha/yo\'q savol yasash. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '吗 (ma) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 吗 (ma) — вопросительная частица. Примеры и объяснения.',
  },
  en: {
    title: '吗 (ma) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 吗 (ma) — yes/no question particle. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/ma`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/ma',
        ru: '/ru/chinese/hsk1/grammar/ma',
        en: '/en/chinese/hsk1/grammar/ma',
        'x-default': '/uz/chinese/hsk1/grammar/ma',
      },
    },
  };
}

export default async function MaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarMaPage />;
}
