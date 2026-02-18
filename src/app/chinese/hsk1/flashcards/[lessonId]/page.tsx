import { notFound } from 'next/navigation';
import { loadFlashcardDeck } from '@/services/flashcards';
import { FlashcardDeck } from '@/components/FlashcardDeck';

interface Props {
  params: { lessonId: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `${params.lessonId}-dars Fleshkartalari - HSK 1 - Blim`,
  };
}

export async function generateStaticParams() {
  const deck = await loadFlashcardDeck('hsk1');
  if (!deck) return [];

  const lessons = new Set(deck.words.map((w) => w.lesson).filter(Boolean));
  return Array.from(lessons).map((l) => ({ lessonId: String(l) }));
}

export default async function LessonFlashcardsPage({ params }: Props) {
  const deck = await loadFlashcardDeck('hsk1');
  const lessonNum = parseInt(params.lessonId, 10);

  if (!deck || isNaN(lessonNum)) {
    notFound();
  }

  const lessonWords = deck.words.filter((w) => w.lesson === lessonNum);

  if (lessonWords.length === 0) {
    notFound();
  }

  return (
    <FlashcardDeck
      deck={{
        id: `${deck.id}-lesson${lessonNum}`,
        title: `${lessonNum}-dars`,
        title_ru: `Урок ${lessonNum}`,
        words: lessonWords.map((w) => ({
          id: w.id,
          text_original: w.text_original,
          pinyin: w.pinyin,
          text_translation: w.text_translation,
          text_translation_ru: w.text_translation_ru,
          lesson: w.lesson,
          audio_url: w.audio_url,
        })),
      }}
      bookPath="/chinese/hsk1"
    />
  );
}
