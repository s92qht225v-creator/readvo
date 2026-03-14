import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarShenmePage } from '@/components/GrammarShenmePage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '什么 shénme "nima" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 什么 (shénme) — "nima?" so\'roq so\'zi. Misollar, shablonlar va mashqlar.',
  },
  ru: {
    title: '什么 shénme "что" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 什么 (shénme) — вопросительное слово «что?». Примеры, шаблоны и упражнения.',
  },
  en: {
    title: '什么 shénme "what" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 什么 (shénme) — the question word "what". Examples, patterns and exercises.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/shenme`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/shenme',
        ru: '/ru/chinese/hsk1/grammar/shenme',
        en: '/en/chinese/hsk1/grammar/shenme',
        'x-default': '/uz/chinese/hsk1/grammar/shenme',
      },
    },
  };
}

export default async function ShenmePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/shenme` },
    ]),
    grammarTermJsonLd('shenme', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarShenmePage />
    </>
  );
}
