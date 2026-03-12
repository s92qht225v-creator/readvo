import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarLePage } from '@/components/GrammarLePage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '了 le "tugallangan harakat" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 了 (le) — tugallangan harakat va o\'zgarish. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '了 le "завершённое действие" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 了 (le) — завершённое действие и изменение. Примеры и объяснения.',
  },
  en: {
    title: '了 le "completed action" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 了 (le) — completed action and change of state. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/le`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/le',
        ru: '/ru/chinese/hsk1/grammar/le',
        en: '/en/chinese/hsk1/grammar/le',
        'x-default': '/uz/chinese/hsk1/grammar/le',
      },
    },
  };
}

export default async function LePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/le` },
    ]),
    grammarTermJsonLd('le', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarLePage />
    </>
  );
}
