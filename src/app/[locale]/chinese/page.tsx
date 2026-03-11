import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { LanguagePage } from '@/components/LanguagePage';
import { loadDialoguesForBook } from '@/services/dialogues';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: 'Xitoy tili darslari — HSK 1-6 dialoglar, fleshkartalar, karaoke',
    description: 'HSK 1-6 dialoglar, fleshkartalar, karaoke, ieroglif yozish va grammatika. Bepul boshlang!',
  },
  ru: {
    title: 'Уроки китайского — HSK 1-6 диалоги, флешкарты, караоке',
    description: 'HSK 1-6: диалоги, флешкарты, караоке, написание иероглифов и грамматика. Начните бесплатно!',
  },
  en: {
    title: 'Chinese Lessons — HSK 1-6 Dialogues, Flashcards, Karaoke',
    description: 'HSK 1-6: dialogues, flashcards, karaoke, character writing and grammar. Start for free!',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese`,
      languages: { uz: '/uz/chinese', ru: '/ru/chinese', en: '/en/chinese', 'x-default': '/uz/chinese' },
    },
  };
}

export default async function ChinesePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [dialogues, deck, lessonInfos] = await Promise.all([
    loadDialoguesForBook('hsk1'),
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
      <LanguagePage dialogues={dialogues} flashcardLessons={flashcardLessons} />
    </Suspense>
  );
}
