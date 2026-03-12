import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarNengPage } from '@/components/GrammarNengPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '能 néng "imkoniyat" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 能 (néng) — imkoniyat va ruxsat bildiruvchi modal fe\'l. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '能 néng "мочь" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 能 (néng) — модальный глагол "мочь". Примеры и объяснения.',
  },
  en: {
    title: '能 néng "can (ability)" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 能 (néng) — modal verb for ability and permission. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/neng`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/neng',
        ru: '/ru/chinese/hsk1/grammar/neng',
        en: '/en/chinese/hsk1/grammar/neng',
        'x-default': '/uz/chinese/hsk1/grammar/neng',
      },
    },
  };
}

export default async function NengPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/neng` },
    ]),
    grammarTermJsonLd('neng', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarNengPage />
    </>
  );
}
