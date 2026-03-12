import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarXiangPage } from '@/components/GrammarXiangPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '想 xiǎng "xohlamoq" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 想 (xiǎng) — xohish va niyat bildiruvchi fe\'l. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '想 xiǎng "хотеть" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 想 (xiǎng) — глагол "хотеть". Примеры и объяснения.',
  },
  en: {
    title: '想 xiǎng "to want" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 想 (xiǎng) — the verb "to want/to think". Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/xiang`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/xiang',
        ru: '/ru/chinese/hsk1/grammar/xiang',
        en: '/en/chinese/hsk1/grammar/xiang',
        'x-default': '/uz/chinese/hsk1/grammar/xiang',
      },
    },
  };
}

export default async function XiangPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/xiang` },
    ]),
    grammarTermJsonLd('xiang', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarXiangPage />
    </>
  );
}
