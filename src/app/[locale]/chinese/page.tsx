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

const tabMeta: Record<string, Record<string, { title: string; description: string }>> = {
  grammar: {
    uz: { title: 'Xitoy tili grammatikasi — HSK 1', description: 'HSK 1 grammatika qoidalari: 是, 有, 在, 的, 不, 吗, 了 va boshqalar. Misollar bilan o\'rganing.' },
    ru: { title: 'Грамматика китайского — HSK 1', description: 'Грамматика HSK 1: 是, 有, 在, 的, 不, 吗, 了 и другие. Учите с примерами.' },
    en: { title: 'Chinese Grammar — HSK 1', description: 'HSK 1 grammar patterns: 是, 有, 在, 的, 不, 吗, 了 and more. Learn with examples.' },
  },
  writing: {
    uz: { title: 'Ieroglif yozish mashqi — HSK 1', description: 'HSK 1 ierogliflarini yozishni o\'rganing. Interaktiv mashqlar va SRS takrorlash tizimi.' },
    ru: { title: 'Написание иероглифов — HSK 1', description: 'Учитесь писать иероглифы HSK 1. Интерактивные упражнения и система повторения SRS.' },
    en: { title: 'Character Writing Practice — HSK 1', description: 'Learn to write HSK 1 characters. Interactive stroke practice with SRS review system.' },
  },
  karaoke: {
    uz: { title: 'Xitoycha karaoke — KTV qo\'shiqlar', description: 'Xitoy tilida karaoke qo\'shiqlar: so\'z bilan sinxronlashtirilgan matn, pinyin va tarjima.' },
    ru: { title: 'Китайское караоке — KTV песни', description: 'Караоке на китайском: синхронизированный текст, пиньинь и перевод.' },
    en: { title: 'Chinese Karaoke — KTV Songs', description: 'Chinese karaoke songs: synced lyrics with pinyin and translation.' },
  },
};

const indexableTabs = ['grammar', 'writing', 'karaoke'];

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const locale = await getLocale();
  const sp = await searchParams;
  const tab = typeof sp.tab === 'string' && indexableTabs.includes(sp.tab) ? sp.tab : null;

  const m = tab ? (tabMeta[tab]?.[locale] || tabMeta[tab]?.uz) : (pageMeta[locale] || pageMeta.uz);
  const suffix = tab ? `?tab=${tab}` : '';

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese${suffix}`,
      languages: {
        uz: `/uz/chinese${suffix}`,
        ru: `/ru/chinese${suffix}`,
        en: `/en/chinese${suffix}`,
        'x-default': `/uz/chinese${suffix}`,
      },
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
