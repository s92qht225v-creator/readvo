import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface Props {
  params: Promise<{ locale: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, lessonId } = await params;
  const pageMeta: Record<string, { title: string; description: string }> = {
    uz: {
      title: `HSK 1 ${lessonId}-dars so'zlari — Fleshkartalar`,
      description: `HSK 1, ${lessonId}-dars xitoy tili so'zlarini fleshkartalar bilan yodlang. Audio va tarjima bilan.`,
    },
    ru: {
      title: `Слова урока ${lessonId} HSK 1 — Флешкарты`,
      description: `Учите китайские слова HSK 1, урок ${lessonId} с флешкартами. С аудио и переводом.`,
    },
    en: {
      title: `HSK 1 Lesson ${lessonId} Words — Flashcards`,
      description: `Learn Chinese words from HSK 1 lesson ${lessonId} with flashcards. With audio and translation.`,
    },
  };
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
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

  const flashLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const lessonLabel = ({ uz: `${lessonNum}-dars`, ru: `Урок ${lessonNum}`, en: `Lesson ${lessonNum}` } as Record<string, string>)[locale] || `Lesson ${lessonNum}`;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: flashLabel, path: `/${locale}/chinese/hsk1/flashcards` },
      { name: lessonLabel, path: `/${locale}/chinese/hsk1/flashcards/${lessonId}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
          text_translation_en: w.text_translation_en,
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
    </>
  );
}
