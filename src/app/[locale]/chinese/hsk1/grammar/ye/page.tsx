import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarYePage } from '@/components/GrammarYePage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '也 (yě) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 也 (yě) — "ham" ma\'nosidagi yuklama. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '也 (yě) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 也 (yě) — частица "тоже". Примеры и объяснения.',
  },
  en: {
    title: '也 (yě) — Chinese Grammar | HSK 1',
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

  return <GrammarYePage />;
}
