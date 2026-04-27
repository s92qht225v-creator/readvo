import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarShuziPolishedPage } from '@/components/GrammarShuziPolishedPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '数字 shùzì "1-99 sonlar" — Xitoy tili grammatikasi | HSK 1',
    description: "Xitoy tili grammatikasi: 数字 (shùzì) — 1 dan 99 gacha sonlar. Raqamlar tizimi, misollar va tushuntirishlar.",
  },
  ru: {
    title: '数字 shùzì "числа 1-99" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 数字 (shùzì) — числа от 1 до 99. Система счёта, примеры и объяснения.',
  },
  en: {
    title: '数字 shùzì "Numbers 1-99" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 数字 (shùzì) — numbers from 1 to 99. Counting system, examples, and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/shuzi`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/shuzi',
        ru: '/ru/chinese/hsk1/grammar/shuzi',
        en: '/en/chinese/hsk1/grammar/shuzi',
        'x-default': '/uz/chinese/hsk1/grammar/shuzi',
      },
    },
  };
}

export default async function ShuziPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/shuzi` },
    ]),
    grammarTermJsonLd('shuzi', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarShuziPolishedPage />
    </>
  );
}
