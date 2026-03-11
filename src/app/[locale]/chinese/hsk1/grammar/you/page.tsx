import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarYouPage } from '@/components/GrammarYouPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '有 (yǒu) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 有 (yǒu) — "bor" fe\'li — egalik va mavjudlik. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '有 (yǒu) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 有 (yǒu) — глагол "иметь". Примеры и объяснения.',
  },
  en: {
    title: '有 (yǒu) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 有 (yǒu) — the verb "to have", possession and existence. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/you`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/you',
        ru: '/ru/chinese/hsk1/grammar/you',
        en: '/en/chinese/hsk1/grammar/you',
        'x-default': '/uz/chinese/hsk1/grammar/you',
      },
    },
  };
}

export default async function YouPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarYouPage />;
}
