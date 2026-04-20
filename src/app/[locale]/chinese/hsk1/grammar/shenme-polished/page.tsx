import type { Metadata } from 'next';
import { getLocale, setRequestLocale } from 'next-intl/server';
import { GrammarShenmePolishedPage } from '@/components/GrammarShenmePolishedPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: 'Shenme polished lesson — Xitoy tili grammatikasi | HSK 1',
    description: '什么 uchun polished sample grammar lesson.',
  },
  ru: {
    title: 'Shenme polished lesson — Грамматика китайского языка | HSK 1',
    description: 'Полированный sample grammar lesson для 什么.',
  },
  en: {
    title: 'Shenme polished lesson — Chinese Grammar | HSK 1',
    description: 'A polished sample grammar lesson for 什么.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/shenme-polished`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/shenme-polished',
        ru: '/ru/chinese/hsk1/grammar/shenme-polished',
        en: '/en/chinese/hsk1/grammar/shenme-polished',
        'x-default': '/uz/chinese/hsk1/grammar/shenme-polished',
      },
    },
  };
}

export default async function ShenmePolishedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarShenmePolishedPage />;
}
