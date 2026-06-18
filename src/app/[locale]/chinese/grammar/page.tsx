import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { GrammarCatalog } from '@/components/catalog/GrammarCatalog';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const meta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy tili grammatikasi — HSK 1', description: 'HSK 1 xitoy tili grammatikasi: 是, 吗, 的, 谁 va boshqalar. Audio mashqlar bilan.' },
  ru: { title: 'Грамматика китайского — HSK 1', description: 'Грамматика китайского HSK 1: 是, 吗, 的, 谁 и другие. С аудиоупражнениями.' },
  en: { title: 'Chinese Grammar — HSK 1', description: 'HSK 1 Chinese grammar: 是, 吗, 的, 谁 and more, with audio practice.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/grammar`,
      languages: {
        uz: '/uz/chinese/grammar',
        ru: '/ru/chinese/grammar',
        en: '/en/chinese/grammar',
        'x-default': '/uz/chinese/grammar',
      },
    },
  };
}

export default async function ChineseGrammarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const sectionLabel = ({ uz: 'Grammatika', ru: 'Грамматика', en: 'Grammar' } as Record<string, string>)[locale] || 'Grammar';
  const jsonLd = jsonLdScript([breadcrumbJsonLd([
    { name: homeLabel, path: `/${locale}` },
    { name: 'Chinese', path: `/${locale}/chinese` },
    { name: sectionLabel, path: `/${locale}/chinese/grammar` },
  ])]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense><GrammarCatalog /></Suspense>
    </>
  );
}
