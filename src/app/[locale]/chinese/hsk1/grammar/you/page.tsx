import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarYouPage } from '@/components/GrammarYouPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '有 yǒu "bor" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 有 (yǒu) — "bor" fe\'li — egalik va mavjudlik. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '有 yǒu "иметь" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 有 (yǒu) — глагол "иметь". Примеры и объяснения.',
  },
  en: {
    title: '有 yǒu "to have" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 有 (yǒu) — the verb "to have", possession and existence. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/you`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/you',
        ru: '/ru/chinese/hsk1/grammar/you',
        en: '/en/chinese/hsk1/grammar/you',
        'x-default': '/uz/chinese/hsk1/grammar/you',
      },
    },
  };
}

export default async function YouPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/you` },
    ]),
    grammarTermJsonLd('you', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarYouPage />
    </>
  );
}
