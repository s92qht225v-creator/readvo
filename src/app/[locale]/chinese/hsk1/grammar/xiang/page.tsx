import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarXiangPage } from '@/components/GrammarXiangPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '想 (xiǎng) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 想 (xiǎng) — xohish va niyat bildiruvchi fe\'l. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '想 (xiǎng) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 想 (xiǎng) — глагол "хотеть". Примеры и объяснения.',
  },
  en: {
    title: '想 (xiǎng) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 想 (xiǎng) — the verb "to want/to think". Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/xiang`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/xiang',
        ru: '/ru/chinese/hsk1/grammar/xiang',
        en: '/en/chinese/hsk1/grammar/xiang',
        'x-default': '/uz/chinese/hsk1/grammar/xiang',
      },
    },
  };
}

export default async function XiangPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarXiangPage />;
}
