import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import { getWritingSet, WRITING_SETS } from '@/services/writing';
import { FlashcardDeckLoader } from '@/components/FlashcardDeckLoader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface Props {
  params: Promise<{ locale: string; lessonId: string }>;
}

function isWritingSetId(id: string) {
  return id.startsWith('hsk') && id.includes('-set');
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props) {
  const { locale, lessonId } = await params;

  if (isWritingSetId(lessonId)) {
    const setNum = lessonId.split('-set')[1];
    const pageMeta: Record<string, { title: string; description: string }> = {
      uz: {
        title: `HSK 1 ${setNum}-to'plam — Fleshkartalar`,
        description: `HSK 1 ${setNum}-to'plam so'zlarini fleshkartalar bilan yodlang.`,
      },
      ru: {
        title: `HSK 1 Набор ${setNum} — Флешкарты`,
        description: `Учите слова HSK 1, набор ${setNum} с флешкартами.`,
      },
      en: {
        title: `HSK 1 Set ${setNum} — Flashcards`,
        description: `Learn HSK 1 set ${setNum} words with flashcards.`,
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
  const lessonParams = deck
    ? Array.from(new Set(deck.words.map((w) => w.lesson).filter(Boolean))).map((l) => ({ lessonId: String(l) }))
    : [];

  const setParams = WRITING_SETS.map((s) => ({ lessonId: s.id }));

  return [...lessonParams, ...setParams];
}

export default async function LessonFlashcardsPage({ params }: Props) {
  const { locale, lessonId } = await params;
  setRequestLocale(locale);

  // Writing set mode (hsk1-set1, hsk1-set2, etc.)
  if (isWritingSetId(lessonId)) {
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
        { name: setLabel, path: `/${locale}/chinese/hsk1/flashcards/${lessonId}` },
      ]),
    ]);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <FlashcardDeckLoader book="hsk1" deckId={lessonId} bookPath="/chinese/hsk1" />
      </>
    );
  }

  // Legacy lesson mode (numeric lessonId)
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
      <FlashcardDeckLoader
        book="hsk1"
        deckId={lessonId}
        bookPath="/chinese/hsk1"
        lessonTitle={info?.title}
        lessonPinyin={info?.pinyin}
        lessonTitleTranslation={info?.titleTranslation}
        lessonTitleTranslation_ru={info?.titleTranslation_ru}
      />
    </>
  );
}
