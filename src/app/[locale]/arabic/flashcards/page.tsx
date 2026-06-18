import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ArabicFlashcardsCatalog } from '@/components/catalog/ArabicFlashcardsCatalog';
import { loadArabicFlashcardCatalog } from '@/services/arabicContent';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Arab tili fleshkartalar — A1-C2', description: "Arab tili so'zlarini fleshkartalar bilan yodlang. Harakat va transliteratsiya bilan. Bepul!" },
  ru: { title: 'Арабские флешкарты — A1-C2', description: 'Учите арабские слова с флешкартами. С огласовками и транслитерацией. Бесплатно!' },
  en: { title: 'Arabic Flashcards — A1-C2', description: 'Learn Arabic words with flashcards. With harakat and transliteration. Free!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/arabic/flashcards`,
      languages: {
        uz: '/uz/arabic/flashcards',
        ru: '/ru/arabic/flashcards',
        en: '/en/arabic/flashcards',
        'x-default': '/uz/arabic/flashcards',
      },
    },
  };
}

export default async function ArabicFlashcardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const decks = loadArabicFlashcardCatalog();
  const flashLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/dialogues` },
      { name: flashLabel, path: `/${locale}/arabic/flashcards` },
    ]),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ArabicFlashcardsCatalog decks={decks} />
    </>
  );
}
