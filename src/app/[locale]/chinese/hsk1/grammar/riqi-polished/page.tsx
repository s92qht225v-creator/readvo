import type { Metadata } from 'next';
import { getLocale, setRequestLocale } from 'next-intl/server';
import { GrammarRiqiPolishedPage } from '@/components/GrammarRiqiPolishedPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: 'Riqi polished lesson — Xitoy tili grammatikasi | HSK 1',
    description: 'Sanalar va hafta kunlari uchun polished grammar lesson sample.',
  },
  ru: {
    title: 'Riqi polished lesson — Грамматика китайского языка | HSK 1',
    description: 'Полированный sample grammar lesson для дат и дней недели.',
  },
  en: {
    title: 'Riqi polished lesson — Chinese Grammar | HSK 1',
    description: 'A polished grammar lesson sample for dates and days of the week.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/riqi-polished`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/riqi-polished',
        ru: '/ru/chinese/hsk1/grammar/riqi-polished',
        en: '/en/chinese/hsk1/grammar/riqi-polished',
        'x-default': '/uz/chinese/hsk1/grammar/riqi-polished',
      },
    },
  };
}

export default async function RiqiPolishedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarRiqiPolishedPage />;
}
