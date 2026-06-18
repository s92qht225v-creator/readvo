import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import {
  getWritingSet,
  WRITING_SETS,
  WRITING_SETS_HSK2_L2,
  WRITING_SETS_HSK3,
} from '@/services/writing';
import { FlashcardDeckLoader } from '@/components/FlashcardDeckLoader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface Props {
  params: Promise<{ locale: string; level: string; lessonId: string }>;
}

const VALID_LEVELS = new Set(['hsk1', 'hsk2', 'hsk3']);

function isWritingSetId(id: string) {
  return id.startsWith('hsk') && id.includes('-set');
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const out: { level: string; lessonId: string }[] = [];

  // hsk1: numeric lessons (from the flashcard deck) + writing-set decks
  const deck = await loadFlashcardDeck('hsk1');
  if (deck) {
    for (const l of Array.from(new Set(deck.words.map((w) => w.lesson).filter(Boolean)))) {
      out.push({ level: 'hsk1', lessonId: String(l) });
    }
  }
  for (const s of WRITING_SETS) out.push({ level: 'hsk1', lessonId: s.id });

  // hsk2 / hsk3: writing-set decks
  for (const s of WRITING_SETS_HSK2_L2) out.push({ level: 'hsk2', lessonId: s.id });
  for (const s of WRITING_SETS_HSK3) out.push({ level: 'hsk3', lessonId: s.id });

  return out;
}

export async function generateMetadata({ params }: Props) {
  const { locale, level, lessonId } = await params;
  if (!VALID_LEVELS.has(level)) return {};
  const num = level.replace('hsk', '');
  const canonical = `/${locale}/chinese/flashcards/${level}/${lessonId}`;
  const alternates = {
    canonical,
    languages: {
      uz: `/uz/chinese/flashcards/${level}/${lessonId}`,
      ru: `/ru/chinese/flashcards/${level}/${lessonId}`,
      en: `/en/chinese/flashcards/${level}/${lessonId}`,
      'x-default': `/uz/chinese/flashcards/${level}/${lessonId}`,
    },
  };

  // Writing-set deck (hsk1-set1, hsk2-set1, hsk3-set1, …)
  if (isWritingSetId(lessonId)) {
    const setNum = lessonId.split('-set')[1];
    const pageMeta: Record<string, { title: string; description: string }> = {
      uz: {
        title: `HSK ${num} ${setNum}-to'plam — Fleshkartalar`,
        description: `HSK ${num} ${setNum}-to'plam so'zlarini fleshkartalar bilan yodlang.`,
      },
      ru: {
        title: `HSK ${num} Набор ${setNum} — Флешкарты`,
        description: `Учите слова HSK ${num}, набор ${setNum} с флешкартами.`,
      },
      en: {
        title: `HSK ${num} Set ${setNum} — Flashcards`,
        description: `Learn HSK ${num} set ${setNum} words with flashcards.`,
      },
    };
    const m = pageMeta[locale] || pageMeta.uz;
    return { title: m.title, description: m.description, alternates };
  }

  // Numeric lesson deck (hsk1 only)
  const pageMeta: Record<string, { title: string; description: string }> = {
    uz: {
      title: `HSK ${num} ${lessonId}-dars so'zlari — Fleshkartalar`,
      description: `HSK ${num}, ${lessonId}-dars xitoy tili so'zlarini fleshkartalar bilan yodlang. Audio va tarjima bilan.`,
    },
    ru: {
      title: `Слова урока ${lessonId} HSK ${num} — Флешкарты`,
      description: `Учите китайские слова HSK ${num}, урок ${lessonId} с флешкартами. С аудио и переводом.`,
    },
    en: {
      title: `HSK ${num} Lesson ${lessonId} Words — Flashcards`,
      description: `Learn Chinese words from HSK ${num} lesson ${lessonId} with flashcards. With audio and translation.`,
    },
  };
  const m = pageMeta[locale] || pageMeta.uz;
  return { title: m.title, description: m.description, alternates };
}

export default async function LessonFlashcardsPage({ params }: Props) {
  const { locale, level, lessonId } = await params;
  setRequestLocale(locale);
  if (!VALID_LEVELS.has(level)) notFound();
  const num = level.replace('hsk', '');

  const flashLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const bookPath = `/chinese/${level}`;
  const backHref = level === 'hsk1' ? undefined : `/chinese/flashcards?flashhsk=${num}`;

  // Writing-set deck mode (hsk1-set1, hsk2-set1, hsk3-set1, …)
  if (isWritingSetId(lessonId)) {
    const writingSet = getWritingSet(lessonId);
    if (!writingSet) notFound();

    const setNum = lessonId.split('-set')[1];
    const setLabel = ({ uz: `${setNum}-to'plam`, ru: `Набор ${setNum}`, en: `Set ${setNum}` } as Record<string, string>)[locale] || `Set ${setNum}`;
    const jsonLd = jsonLdScript([
      breadcrumbJsonLd([
        { name: 'Blim', path: `/${locale}` },
        { name: 'Chinese', path: `/${locale}/chinese/dialogues` },
        { name: flashLabel, path: `/${locale}/chinese/flashcards` },
        { name: setLabel, path: `/${locale}/chinese/flashcards/${level}/${lessonId}` },
      ]),
    ]);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <FlashcardDeckLoader book={level} deckId={lessonId} bookPath={bookPath} backHref={backHref} />
      </>
    );
  }

  // Numeric lesson mode (hsk1 only)
  if (level !== 'hsk1') notFound();

  const [deck, lessonInfos] = await Promise.all([
    loadFlashcardDeck('hsk1'),
    getLessonsWithInfo(),
  ]);
  const lessonNum = parseInt(lessonId, 10);

  if (!deck || isNaN(lessonNum)) notFound();

  const lessonWords = deck.words.filter((w) => w.lesson === lessonNum);
  if (lessonWords.length === 0) notFound();

  const info = lessonInfos.find((l) => l.lessonNumber === lessonNum);
  const lessonLabel = ({ uz: `${lessonNum}-dars`, ru: `Урок ${lessonNum}`, en: `Lesson ${lessonNum}` } as Record<string, string>)[locale] || `Lesson ${lessonNum}`;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese/dialogues` },
      { name: flashLabel, path: `/${locale}/chinese/flashcards` },
      { name: lessonLabel, path: `/${locale}/chinese/flashcards/${level}/${lessonId}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <FlashcardDeckLoader
        book="hsk1"
        deckId={lessonId}
        bookPath={bookPath}
        lessonTitle={info?.title}
        lessonPinyin={info?.pinyin}
        lessonTitleTranslation={info?.titleTranslation}
        lessonTitleTranslation_ru={info?.titleTranslation_ru}
      />
    </>
  );
}
