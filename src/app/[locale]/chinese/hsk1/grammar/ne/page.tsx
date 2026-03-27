import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarNePage } from '@/components/GrammarNePage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '呢 ne "…chi?" — Xitoy tili grammatikasi | HSK 1',
    description: "Xitoy tili grammatikasi: 呢 (ne) — …chi? Qaytarish savol yuklamasi. Misollar va tushuntirishlar.",
  },
  ru: {
    title: '呢 ne "…а вы?" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 呢 (ne) — …а вы? Частица переспроса. Примеры и объяснения.',
  },
  en: {
    title: '呢 ne "…and you?" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 呢 (ne) — bounce-back question particle. Used to redirect questions. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/ne`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/ne',
        ru: '/ru/chinese/hsk1/grammar/ne',
        en: '/en/chinese/hsk1/grammar/ne',
        'x-default': '/uz/chinese/hsk1/grammar/ne',
      },
    },
  };
}

export default async function NePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/ne` },
    ]),
    grammarTermJsonLd('ne', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarNePage />
    </>
  );
}
