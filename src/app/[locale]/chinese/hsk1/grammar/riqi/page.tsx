import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarRiqiPolishedPage } from '@/components/GrammarRiqiPolishedPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '月/号/日/星期 — Sanalar va hafta kunlari | HSK 1',
    description: 'Xitoy tili grammatikasi: sanalar (月, 号, 日) va hafta kunlari (星期). Oylar, kunlar, sana tartibi va misollar.',
  },
  ru: {
    title: '月/号/日/星期 — Даты и дни недели | HSK 1',
    description: 'Грамматика китайского языка: даты (月, 号, 日) и дни недели (星期). Месяцы, дни, порядок даты и примеры.',
  },
  en: {
    title: '月/号/日/星期 — Dates & Days of the Week | HSK 1',
    description: 'Chinese grammar: dates (月, 号, 日) and days of the week (星期). Months, days, date order and examples.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/riqi`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/riqi',
        ru: '/ru/chinese/hsk1/grammar/riqi',
        en: '/en/chinese/hsk1/grammar/riqi',
        'x-default': '/uz/chinese/hsk1/grammar/riqi',
      },
    },
  };
}

export default async function RiqiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/riqi` },
    ]),
    grammarTermJsonLd('riqi', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarRiqiPolishedPage />
    </>
  );
}
