import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarZenmePage } from '@/components/GrammarZenmePage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '怎么 zěnme "qanday" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 怎么 (zěnme) — "qanday" savol ravishi. Fe\'ldan oldin ishlatilishi, misollar va tushuntirishlar.',
  },
  ru: {
    title: '怎么 zěnme "как" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 怎么 (zěnme) — вопросительное наречие "как". Употребление перед глаголами, примеры и объяснения.',
  },
  en: {
    title: '怎么 zěnme "how" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 怎么 (zěnme) — the interrogative adverb "how". Usage before verbs, examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/zenme`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/zenme',
        ru: '/ru/chinese/hsk1/grammar/zenme',
        en: '/en/chinese/hsk1/grammar/zenme',
        'x-default': '/uz/chinese/hsk1/grammar/zenme',
      },
    },
  };
}

export default async function ZenmePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/zenme` },
    ]),
    grammarTermJsonLd('zenme', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarZenmePage />
    </>
  );
}
