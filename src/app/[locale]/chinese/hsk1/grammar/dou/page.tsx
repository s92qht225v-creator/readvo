import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarDouPage } from '@/components/GrammarDouPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '都 (dōu) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 都 (dōu) — "hammasi/barchasi" ma\'nosidagi yuklama. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '都 (dōu) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 都 (dōu) — частица "все/оба". Примеры и объяснения.',
  },
  en: {
    title: '都 (dōu) — Chinese Grammar | HSK 1',
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

  return <GrammarDouPage />;
}
