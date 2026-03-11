import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarLePage } from '@/components/GrammarLePage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '了 (le) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 了 (le) — tugallangan harakat va o\'zgarish. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '了 (le) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 了 (le) — завершённое действие и изменение. Примеры и объяснения.',
  },
  en: {
    title: '了 (le) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 了 (le) — completed action and change of state. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/le`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/le',
        ru: '/ru/chinese/hsk1/grammar/le',
        en: '/en/chinese/hsk1/grammar/le',
        'x-default': '/uz/chinese/hsk1/grammar/le',
      },
    },
  };
}

export default async function LePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarLePage />;
}
