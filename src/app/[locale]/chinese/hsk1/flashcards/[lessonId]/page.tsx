import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import { getWritingSet, WRITING_SETS } from '@/services/writing';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface Props {
  params: Promise<{ locale: string; lessonId: string }>;
}

function isWritingSetId(id: string) {
  return id.startsWith('hsk') && id.includes('-set');
}

const WRITING_AUDIO_BASE = 'https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201/Writing';

function getWritingAudioUrl(char: string, pinyin: string): string {
  const first = pinyin.split(' / ')[0];
  const stripped = first.replace(/[ǖǘǚǜü]/gi, 'v').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s']/g, '').toLowerCase();
  const unicode = Array.from(char).map(c => c.codePointAt(0)).join('');
  return `${WRITING_AUDIO_BASE}/${stripped}_${unicode}.mp3`;
}

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
        { name: flashLabel, path: `/${locale}/chinese?tab=flashcards` },
        { name: setLabel, path: `/${locale}/chinese/hsk1/flashcards/${lessonId}` },
      ]),
    ]);

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <FlashcardDeck
          deck={{
            id: lessonId,
            title: `${setNum}-to'plam`,
            title_ru: `Набор ${setNum}`,
            words: writingSet.words.map((w, i) => ({
              id: `${lessonId}-${i}`,
              text_original: w.char,
              pinyin: w.pinyin,
              text_translation: w.uz,
              text_translation_ru: w.ru,
              text_translation_en: w.en,
              audio_url: getWritingAudioUrl(w.char, w.pinyin),
            })),
          }}
          bookPath="/chinese/hsk1"
        />
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
