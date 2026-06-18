import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getWritingSet, WRITING_SETS_HSK2_L2 } from '@/services/writing';
import { FlashcardDeckLoader } from '@/components/FlashcardDeckLoader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface Props {
  params: Promise<{ locale: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, lessonId } = await params;
  const setNum = lessonId.split('-set')[1];

  const pageMeta: Record<string, { title: string; description: string }> = {
    uz: {
      title: `HSK 2 ${setNum}-to'plam — Fleshkartalar`,
      description: `HSK 2 ${setNum}-to'plam so'zlarini fleshkartalar bilan yodlang.`,
    },
    ru: {
      title: `HSK 2 Набор ${setNum} — Флешкарты`,
      description: `Учите слова HSK 2, набор ${setNum} с флешкартами.`,
    },
    en: {
      title: `HSK 2 Set ${setNum} — Flashcards`,
      description: `Learn HSK 2 set ${setNum} words with flashcards.`,
    },
  };
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk2/flashcards/${lessonId}`,
      languages: {
        uz: `/uz/chinese/hsk2/flashcards/${lessonId}`,
        ru: `/ru/chinese/hsk2/flashcards/${lessonId}`,
        en: `/en/chinese/hsk2/flashcards/${lessonId}`,
        'x-default': `/uz/chinese/hsk2/flashcards/${lessonId}`,
      },
    },
  };
}

export async function generateStaticParams() {
  return WRITING_SETS_HSK2_L2.map((s) => ({ lessonId: s.id }));
}

export default async function Hsk2FlashcardsPage({ params }: Props) {
  const { locale, lessonId } = await params;
  setRequestLocale(locale);

  const writingSet = getWritingSet(lessonId);
  if (!writingSet) notFound();

  const setNum = lessonId.split('-set')[1];
  const flashLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const setLabel = ({ uz: `${setNum}-to'plam`, ru: `Набор ${setNum}`, en: `Set ${setNum}` } as Record<string, string>)[locale] || `Set ${setNum}`;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: flashLabel, path: `/${locale}/chinese/flashcards` },
      { name: setLabel, path: `/${locale}/chinese/hsk2/flashcards/${lessonId}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <FlashcardDeckLoader
        book="hsk2"
        deckId={lessonId}
        bookPath="/chinese/hsk2"
        backHref="/chinese/flashcards?flashhsk=2"
      />
    </>
  );
}
