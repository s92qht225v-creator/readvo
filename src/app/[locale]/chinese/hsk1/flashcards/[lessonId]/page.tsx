import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import { FlashcardDeck } from '@/components/FlashcardDeck';

interface Props {
  params: Promise<{ locale: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, lessonId } = await params;
  return {
    title: `HSK 1 ${lessonId}-dars so'zlari — Fleshkartalar`,
    description: `HSK 1, ${lessonId}-dars xitoy tili so'zlarini fleshkartalar bilan yodlang. Audio va tarjima bilan. | Флешкарты HSK 1, урок ${lessonId}: учите китайские слова с аудио и переводом.`,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/flashcards/${lessonId}`,
      languages: {
        uz: `/uz/chinese/hsk1/flashcards/${lessonId}`,
        ru: `/ru/chinese/hsk1/flashcards/${lessonId}`,
        en: `/en/chinese/hsk1/flashcards/${lessonId}`,
        'x-default': `/uz/chinese/hsk1/flashcards/${lessonId}`,
      },
    },
  };
}

export async function generateStaticParams() {
  const deck = await loadFlashcardDeck('hsk1');
  if (!deck) return [];

  const lessons = new Set(deck.words.map((w) => w.lesson).filter(Boolean));
  return Array.from(lessons).map((l) => ({ lessonId: String(l) }));
}

export default async function LessonFlashcardsPage({ params }: Props) {
  const { locale, lessonId } = await params;
  setRequestLocale(locale);

  const [deck, lessonInfos] = await Promise.all([
    loadFlashcardDeck('hsk1'),
    getLessonsWithInfo(),
  ]);
  const lessonNum = parseInt(lessonId, 10);

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
