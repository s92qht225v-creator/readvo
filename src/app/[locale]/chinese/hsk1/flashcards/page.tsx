import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services';
import { FlashcardListPage } from '@/components/FlashcardListPage';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: 'HSK 1 so\'zlar — Xitoy tili fleshkartalar',
    description: 'HSK 1 so\'zlar ro\'yxati: fleshkartalar bilan xitoy tili so\'zlarini yodlang. Dars bo\'yicha ajratilgan. Bepul sinab ko\'ring! | Флешкарты HSK 1: учите китайские слова по урокам.',
    alternates: {
      canonical: `/${locale}/chinese/hsk1/flashcards`,
      languages: {
        uz: '/uz/chinese/hsk1/flashcards',
        ru: '/ru/chinese/hsk1/flashcards',
        en: '/en/chinese/hsk1/flashcards',
        'x-default': '/uz/chinese/hsk1/flashcards',
      },
    },
  };
}

export default async function FlashcardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const deck = await loadFlashcardDeck('hsk1');

  if (!deck || deck.words.length === 0) {
    notFound();
  }

  const lessons = await getLessonsWithInfo();

  // Group word counts by lesson
  const wordCountByLesson: Record<number, number> = {};
  for (const word of deck.words) {
    if (word.lesson) {
      wordCountByLesson[word.lesson] = (wordCountByLesson[word.lesson] || 0) + 1;
    }
  }

  // Build lesson list with word counts
  const lessonItems = lessons.map((l) => ({
    lessonId: l.lessonId,
    lessonNumber: l.lessonNumber,
    titleTranslation: l.titleTranslation,
    titleTranslation_ru: l.titleTranslation_ru,
    wordCount: wordCountByLesson[l.lessonNumber] || 0,
  })).filter((l) => l.wordCount > 0);

  return (
    <FlashcardListPage
      lessons={lessonItems}
      bookPath="/chinese/hsk1"
    />
  );
}
