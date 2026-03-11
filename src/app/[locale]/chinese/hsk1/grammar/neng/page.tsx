import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarNengPage } from '@/components/GrammarNengPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '能 (néng) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 能 (néng) — imkoniyat va ruxsat bildiruvchi modal fe\'l. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '能 (néng) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 能 (néng) — модальный глагол "мочь". Примеры и объяснения.',
  },
  en: {
    title: '能 (néng) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 能 (néng) — modal verb for ability and permission. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/neng`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/neng',
        ru: '/ru/chinese/hsk1/grammar/neng',
        en: '/en/chinese/hsk1/grammar/neng',
        'x-default': '/uz/chinese/hsk1/grammar/neng',
      },
    },
  };
}

export default async function NengPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarNengPage />;
}
