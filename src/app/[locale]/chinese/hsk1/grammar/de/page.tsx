import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarDePage } from '@/components/GrammarDePage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '的 (de) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 的 (de) — egalik va sifat yasovchi yuklama. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '的 (de) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 的 (de) — притяжательная частица. Примеры и объяснения.',
  },
  en: {
    title: '的 (de) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 的 (de) — the possessive and attributive particle. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/de`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/de',
        ru: '/ru/chinese/hsk1/grammar/de',
        en: '/en/chinese/hsk1/grammar/de',
        'x-default': '/uz/chinese/hsk1/grammar/de',
      },
    },
  };
}

export default async function DePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarDePage />;
}
