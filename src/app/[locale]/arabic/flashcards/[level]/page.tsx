import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadArabicFlashcardDeck, loadArabicFlashcardCatalog } from '@/services/arabicContent';
import { ArabicFlashcardDeck } from '@/components/reader/ArabicFlashcardDeck';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

interface PageParams { params: Promise<{ locale: string; level: string }>; }

export async function generateStaticParams() {
  return loadArabicFlashcardCatalog().map((d) => ({ level: d.level }));
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, level } = await params;
  const deck = loadArabicFlashcardDeck(level);
  if (!deck) return {};
  const title = ({ uz: deck.title_uz, ru: deck.title_ru, en: deck.title_en } as Record<string, string>)[locale] || deck.title_uz;
  return {
    title: `${title} — ${({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale]}`,
    description: ({
      uz: `Arab tili ${level.toUpperCase()} so'zlarini fleshkartalar bilan yodlang. Harakat va transliteratsiya bilan.`,
      ru: `Учите арабские слова ${level.toUpperCase()} с флешкартами. С огласовками и транслитерацией.`,
      en: `Learn Arabic ${level.toUpperCase()} words with flashcards. With harakat and transliteration.`,
    } as Record<string, string>)[locale],
    alternates: {
      canonical: `/${locale}/arabic/flashcards/${level}`,
      languages: { uz: `/uz/arabic/flashcards/${level}`, ru: `/ru/arabic/flashcards/${level}`, en: `/en/arabic/flashcards/${level}`, 'x-default': `/uz/arabic/flashcards/${level}` },
    },
  };
}

export default async function ArabicFlashcardDeckPage({ params }: PageParams) {
  const { locale, level } = await params;
  setRequestLocale(locale);
  const deck = loadArabicFlashcardDeck(level);
  if (!deck) notFound();
  const flashLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/dialogues` },
      { name: flashLabel, path: `/${locale}/arabic/flashcards` },
      { name: level.toUpperCase(), path: `/${locale}/arabic/flashcards/${level}` },
    ]),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ArabicFlashcardDeck level={level} />
    </>
  );
}
