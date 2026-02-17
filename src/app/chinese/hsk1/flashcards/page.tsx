import { notFound } from 'next/navigation';
import { loadFlashcardDeck } from '@/services/flashcards';
import { FlashcardDeck } from '@/components/FlashcardDeck';

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

  return (
    <FlashcardDeck
      deck={{
        id: deck.id,
        title: deck.title,
        title_ru: deck.title_ru,
        words: deck.words.map((w) => ({
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
