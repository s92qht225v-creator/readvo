import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarNePage } from '@/components/GrammarNePage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '呢 (ne) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 呢 (ne) — "...chi?" savol yuklamasi. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '呢 (ne) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 呢 (ne) — вопросительная частица "а...?". Примеры и объяснения.',
  },
  en: {
    title: '呢 (ne) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 呢 (ne) — question particle "and...?". Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/ne`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/ne',
        ru: '/ru/chinese/hsk1/grammar/ne',
        en: '/en/chinese/hsk1/grammar/ne',
        'x-default': '/uz/chinese/hsk1/grammar/ne',
      },
    },
  };
}

export default async function NePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarNePage />;
}
