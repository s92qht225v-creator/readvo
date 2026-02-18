import { notFound } from 'next/navigation';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services';
import { FlashcardListPage } from '@/components/FlashcardListPage';

export async function generateMetadata() {
  return {
    title: 'Fleshkartalar - HSK 1 - Blim',
  };
}

export default async function FlashcardsPage() {
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
