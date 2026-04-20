import type { Metadata } from 'next';
import { getLocale, setRequestLocale } from 'next-intl/server';
import { GrammarRiqiSamplePage } from '@/components/GrammarRiqiSamplePage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: 'Riqi sample redesign — Xitoy tili grammatikasi | HSK 1',
    description: 'Sanalar va hafta kunlari uchun sample redesign sahifa: composer, xatolar, mini-check va speaking studio.',
  },
  ru: {
    title: 'Riqi sample redesign — Грамматика китайского языка | HSK 1',
    description: 'Пример переработки страницы про даты и дни недели: composer, ошибки, мини-проверка и speaking studio.',
  },
  en: {
    title: 'Riqi sample redesign — Chinese Grammar | HSK 1',
    description: 'A sample redesign for the dates and weekdays grammar page with a composer, mistakes panel, mini-check, and speaking studio.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/riqi-sample`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/riqi-sample',
        ru: '/ru/chinese/hsk1/grammar/riqi-sample',
        en: '/en/chinese/hsk1/grammar/riqi-sample',
        'x-default': '/uz/chinese/hsk1/grammar/riqi-sample',
      },
    },
  };
}

export default async function RiqiSamplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarRiqiSamplePage />;
}
