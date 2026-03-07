import { notFound } from 'next/navigation';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import { FlashcardDeck } from '@/components/FlashcardDeck';

interface Props {
  params: { lessonId: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `HSK 1 ${params.lessonId}-dars so'zlari — Fleshkartalar`,
    description: `HSK 1, ${params.lessonId}-dars xitoy tili so'zlarini fleshkartalar bilan yodlang. Audio va tarjima bilan. | Флешкарты HSK 1, урок ${params.lessonId}: учите китайские слова с аудио и переводом.`,
  };
}

export async function generateStaticParams() {
  const deck = await loadFlashcardDeck('hsk1');
  if (!deck) return [];

  const lessons = new Set(deck.words.map((w) => w.lesson).filter(Boolean));
  return Array.from(lessons).map((l) => ({ lessonId: String(l) }));
}

export default async function LessonFlashcardsPage({ params }: Props) {
  const [deck, lessonInfos] = await Promise.all([
    loadFlashcardDeck('hsk1'),
    getLessonsWithInfo(),
  ]);
  const lessonNum = parseInt(params.lessonId, 10);

  if (!deck || isNaN(lessonNum)) {
    notFound();
  }

  const lessonWords = deck.words.filter((w) => w.lesson === lessonNum);

  if (lessonWords.length === 0) {
    notFound();
  }

  const info = lessonInfos.find((l) => l.lessonNumber === lessonNum);

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
      lessonTitle={info?.title}
      lessonPinyin={info?.pinyin}
      lessonTitleTranslation={info?.titleTranslation}
      lessonTitleTranslation_ru={info?.titleTranslation_ru}
    />
  );
}
