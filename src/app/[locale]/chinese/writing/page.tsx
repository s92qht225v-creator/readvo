import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { WritingCatalog } from '@/components/catalog/WritingCatalog';
import { loadWritingCatalog } from '@/services/catalogData';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const meta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy ieroglif yozish — HSK 1-6', description: 'HSK 1-6 ieroglif yozishni mashq qiling: chiziq tartibi, SRS takrorlash.' },
  ru: { title: 'Написание иероглифов — HSK 1-6', description: 'Практика написания иероглифов HSK 1-6: порядок черт, интервальное повторение.' },
  en: { title: 'Chinese Character Writing — HSK 1-6', description: 'Practice writing HSK 1-6 characters: stroke order and spaced repetition.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/writing`,
      languages: {
        uz: '/uz/chinese/writing',
        ru: '/ru/chinese/writing',
        en: '/en/chinese/writing',
        'x-default': '/uz/chinese/writing',
      },
    },
  };
}

export default async function ChineseWritingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const w = loadWritingCatalog(locale);
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const sectionLabel = ({ uz: 'Yozish', ru: 'Письмо', en: 'Writing' } as Record<string, string>)[locale] || 'Writing';
  const jsonLd = jsonLdScript([breadcrumbJsonLd([
    { name: homeLabel, path: `/${locale}` },
    { name: 'Chinese', path: `/${locale}/chinese` },
    { name: sectionLabel, path: `/${locale}/chinese/writing` },
  ])]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense><WritingCatalog {...w} /></Suspense>
    </>
  );
}
