import type { Metadata } from 'next';
import { getLocale, setRequestLocale } from 'next-intl/server';
import { GrammarRiqiSwipePage } from '@/components/GrammarRiqiSwipePage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: 'Riqi swipe lesson — Xitoy tili grammatikasi | HSK 1',
    description: 'Sanalar va hafta kunlari uchun swipe-card uslubidagi grammar lesson sample.',
  },
  ru: {
    title: 'Riqi swipe lesson — Грамматика китайского языка | HSK 1',
    description: 'Пример grammar lesson в формате swipe-card для дат и дней недели.',
  },
  en: {
    title: 'Riqi swipe lesson — Chinese Grammar | HSK 1',
    description: 'A swipe-card grammar lesson sample for dates and days of the week.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/riqi-swipe`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/riqi-swipe',
        ru: '/ru/chinese/hsk1/grammar/riqi-swipe',
        en: '/en/chinese/hsk1/grammar/riqi-swipe',
        'x-default': '/uz/chinese/hsk1/grammar/riqi-swipe',
      },
    },
  };
}

export default async function RiqiSwipePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarRiqiSwipePage />;
}
