import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarHenPage } from '@/components/GrammarHenPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '很 (hěn) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 很 (hěn) — sifat oldidagi "juda" ravishi. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '很 (hěn) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 很 (hěn) — наречие "очень". Примеры и объяснения.',
  },
  en: {
    title: '很 (hěn) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 很 (hěn) — the adverb "very" before adjectives. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/hen`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/hen',
        ru: '/ru/chinese/hsk1/grammar/hen',
        en: '/en/chinese/hsk1/grammar/hen',
        'x-default': '/uz/chinese/hsk1/grammar/hen',
      },
    },
  };
}

export default async function HenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarHenPage />;
}
