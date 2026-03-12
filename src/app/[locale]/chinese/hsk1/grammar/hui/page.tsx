import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarHuiPage } from '@/components/GrammarHuiPage';
import { breadcrumbJsonLd, jsonLdScript, grammarTermJsonLd } from '@/utils/jsonLd';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '会 huì "bilmoq/qila olmoq" — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 会 (huì) — qobiliyat va kelajak bildiruvchi modal fe\'l. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '会 huì "уметь" — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 会 (huì) — модальный глагол "уметь/мочь". Примеры и объяснения.',
  },
  en: {
    title: '会 huì "can/will" — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 会 (huì) — modal verb for ability and future. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/hui`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/hui',
        ru: '/ru/chinese/hsk1/grammar/hui',
        en: '/en/chinese/hsk1/grammar/hui',
        'x-default': '/uz/chinese/hsk1/grammar/hui',
      },
    },
  };
}

export default async function HuiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const grammarLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: grammarLabel, path: `/${locale}/chinese?tab=grammar` },
      { name: (pageMeta[locale] || pageMeta.uz).title.split(' — ')[0], path: `/${locale}/chinese/hsk1/grammar/hui` },
    ]),
    grammarTermJsonLd('hui', locale),
  ].filter(Boolean) as Record<string, unknown>[]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <GrammarHuiPage />
    </>
  );
}
