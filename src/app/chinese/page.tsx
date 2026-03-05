import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LanguagePage } from '@/components/LanguagePage';
import { loadDialoguesForBook } from '@/services/dialogues';
import { loadStoriesForBook } from '@/services/stories';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';

export const metadata: Metadata = {
  title: 'Xitoy tili darsliklari',
  description: 'HSK 1-6 darajali xitoy tili darsliklari, fleshkartalar, hikoyalar, dialoglar va karaoke.',
};

export default async function ChinesePage() {
  const [dialogues, stories, deck, lessonInfos] = await Promise.all([
    loadDialoguesForBook('hsk1'),
    loadStoriesForBook('hsk2'),
    loadFlashcardDeck('hsk1'),
    getLessonsWithInfo(),
  ]);

  const flashcardLessons = deck
    ? Array.from(new Set(deck.words.map((w) => w.lesson).filter(Boolean)))
        .sort((a, b) => (a as number) - (b as number))
        .map((lessonNum) => {
          const info = lessonInfos.find((l) => l.lessonNumber === lessonNum);
          return {
            lessonId: String(lessonNum),
            lessonNumber: lessonNum as number,
            wordCount: deck.words.filter((w) => w.lesson === lessonNum).length,
            title: info?.title,
            title_ru: info?.titleTranslation_ru,
          };
        })
    : [];

  return (
    <Suspense>
      <LanguagePage dialogues={dialogues} stories={stories} flashcardLessons={flashcardLessons} />
    </Suspense>
  );
}
