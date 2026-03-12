import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarShiPage } from '@/components/GrammarShiPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '是 shì "bo\'lmoq" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 是 (shì) — "...dir" bog\'lovchi fe\'li. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '是 shì "быть" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 是 (shì) — глагол-связка "быть". Примеры и объяснения.',
  },
  en: {
    title: '是 shì "to be" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 是 (shì) — the verb "to be". Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/shi`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/shi',
        ru: '/ru/chinese/hsk1/grammar/shi',
        en: '/en/chinese/hsk1/grammar/shi',
        'x-default': '/uz/chinese/hsk1/grammar/shi',
      },
    },
  };
}

export default async function ShiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/shi` },
    ]),
    grammarTermJsonLd('shi', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarShiPage />
    </>
  );
}
