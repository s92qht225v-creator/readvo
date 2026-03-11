import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarHuiPage } from '@/components/GrammarHuiPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '会 (huì) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 会 (huì) — qobiliyat va kelajak bildiruvchi modal fe\'l. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '会 (huì) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 会 (huì) — модальный глагол "уметь/мочь". Примеры и объяснения.',
  },
  en: {
    title: '会 (huì) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 会 (huì) — modal verb for ability and future. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/hui`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/hui',
        ru: '/ru/chinese/hsk1/grammar/hui',
        en: '/en/chinese/hsk1/grammar/hui',
        'x-default': '/uz/chinese/hsk1/grammar/hui',
      },
    },
  };
}

export default async function HuiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarHuiPage />;
}
