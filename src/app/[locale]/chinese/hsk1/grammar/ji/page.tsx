import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarJiPage } from '@/components/GrammarJiPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '几 (jǐ) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 几 (jǐ) — son so\'rash uchun savol so\'zi. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '几 (jǐ) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 几 (jǐ) — вопросительное слово "сколько". Примеры и объяснения.',
  },
  en: {
    title: '几 (jǐ) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 几 (jǐ) — question word "how many". Examples and explanations.',
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

  return <GrammarJiPage />;
}
