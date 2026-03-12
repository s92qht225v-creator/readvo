import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarZaiPage } from '@/components/GrammarZaiPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '在 zài "joylashmoq" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 在 (zài) — joylashuv va davom etayotgan harakat. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '在 zài "находиться" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 在 (zài) — предлог места и продолженное действие. Примеры и объяснения.',
  },
  en: {
    title: '在 zài "to be at" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 在 (zài) — location and ongoing actions. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/zai`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/zai',
        ru: '/ru/chinese/hsk1/grammar/zai',
        en: '/en/chinese/hsk1/grammar/zai',
        'x-default': '/uz/chinese/hsk1/grammar/zai',
      },
    },
  };
}

export default async function ZaiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/zai` },
    ]),
    grammarTermJsonLd('zai', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarZaiPage />
    </>
  );
}
