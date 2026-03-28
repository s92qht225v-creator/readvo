import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarDuodaPage } from '@/components/GrammarDuodaPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '多大 duō dà "necha yoshda?" — Xitoy tili grammatikasi | HSK 1',
    description: "Xitoy tili grammatikasi: 多大 (duō dà) — necha yoshda? Yoshni so'rash va aytish. Misollar va tushuntirishlar.",
  },
  ru: {
    title: '多大 duō dà "сколько лет?" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 多大 (duō dà) — сколько лет? Как спрашивать и называть возраст. Примеры и объяснения.',
  },
  en: {
    title: '多大 duō dà "how old?" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 多大 (duō dà) — how old? How to ask and tell age in Chinese. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/duoda`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/duoda',
        ru: '/ru/chinese/hsk1/grammar/duoda',
        en: '/en/chinese/hsk1/grammar/duoda',
        'x-default': '/uz/chinese/hsk1/grammar/duoda',
      },
    },
  };
}

export default async function DuodaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/duoda` },
    ]),
    grammarTermJsonLd('duoda', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarDuodaPage />
    </>
  );
}
