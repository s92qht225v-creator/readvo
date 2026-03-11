import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarShiPage } from '@/components/GrammarShiPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '是 (shì) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 是 (shì) — "bu" yordamchi fe\'li. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '是 (shì) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 是 (shì) — глагол-связка "быть". Примеры и объяснения.',
  },
  en: {
    title: '是 (shì) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 是 (shì) — the verb "to be". Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/shi`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/shi',
        ru: '/ru/chinese/hsk1/grammar/shi',
        en: '/en/chinese/hsk1/grammar/shi',
        'x-default': '/uz/chinese/hsk1/grammar/shi',
      },
    },
  };
}

export default async function ShiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarShiPage />;
}
