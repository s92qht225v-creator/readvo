import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { FlashcardsCatalog } from '@/components/catalog/FlashcardsCatalog';
import { loadWritingCatalog } from '@/services/catalogData';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const meta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy tili fleshkartalar — HSK 1-3', description: "HSK 1-3 fleshkartalar bilan xitoycha so'zlarni yodlang. Bepul!" },
  ru: { title: 'Флешкарты китайского — HSK 1-3', description: 'Учите китайские слова с флешкартами HSK 1-3. Бесплатно!' },
  en: { title: 'Chinese Flashcards — HSK 1-3', description: 'Memorize Chinese words with HSK 1-3 flashcards. Free!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/flashcards`,
      languages: {
        uz: '/uz/chinese/flashcards',
        ru: '/ru/chinese/flashcards',
        en: '/en/chinese/flashcards',
        'x-default': '/uz/chinese/flashcards',
      },
    },
  };
}

export default async function ChineseFlashcardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const w = loadWritingCatalog(locale);
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const sectionLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const jsonLd = jsonLdScript([breadcrumbJsonLd([
    { name: homeLabel, path: `/${locale}` },
    { name: 'Chinese', path: `/${locale}/chinese` },
    { name: sectionLabel, path: `/${locale}/chinese/flashcards` },
  ])]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense>
        <FlashcardsCatalog
          writingSets={w.writingSets}
          writingSetsHsk2L2={w.writingSetsHsk2L2}
          writingSetsHsk3={w.writingSetsHsk3}
        />
      </Suspense>
    </>
  );
}
