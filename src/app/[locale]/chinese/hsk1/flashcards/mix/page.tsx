'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import type { FlashcardDeckData } from '@/types';

const FLASHCARD_MIX_KEY = 'blim-flashcard-mix';

interface LessonInfo {
  title?: string;
  pinyin?: string;
  titleTranslation?: string;
  titleTranslation_ru?: string;
}

export default function FlashcardMixPage() {
  const router = useRouter();
  const [deck, setDeck] = useState<FlashcardDeckData | null>(null);
  const [lessonInfo, setLessonInfo] = useState<LessonInfo>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const raw = localStorage.getItem(FLASHCARD_MIX_KEY);
        if (!raw) { router.replace('/chinese?tab=flashcards'); return; }

        const selectedIds: string[] = JSON.parse(raw);
        if (!selectedIds.length) { router.replace('/chinese?tab=flashcards'); return; }

        const res = await fetch('/api/flashcards/hsk1');
        if (!res.ok) throw new Error('fetch failed');
        const fullData = await res.json();
        const fullDeck: FlashcardDeckData = fullData;
        const lessonHeaders = fullData.lessonHeaders as Record<number, { title: string; pinyin: string; titleTranslation: string; titleTranslation_ru: string }> | undefined;

        const selectedNums = new Set(selectedIds.map(Number));
        const words = fullDeck.words.filter((w) => selectedNums.has(w.lesson ?? -1));

        if (words.length === 0) { router.replace('/chinese?tab=flashcards'); return; }

        const lessonList = [...selectedIds].map(Number).sort((a, b) => a - b).join(', ');
        const singleLesson = selectedIds.length === 1 ? Number(selectedIds[0]) : null;
        const info = singleLesson !== null ? lessonHeaders?.[singleLesson] : undefined;

        setLessonInfo({
          title: info?.title,
          pinyin: info?.pinyin,
          titleTranslation: info?.titleTranslation,
          titleTranslation_ru: info?.titleTranslation_ru,
        });
        setDeck({
          id: 'hsk1-mix',
          title: `Dars ${lessonList}`,
          title_ru: `Урок ${lessonList}`,
          words,
        });
      } catch {
        setError(true);
      }
    }
    load();
  }, [router]);

  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Xatolik yuz berdi</div>;
  if (!deck) return <div className="loading-spinner" />;

  return (
    <FlashcardDeck
      deck={deck}
      bookPath="/chinese/hsk1"
      lessonTitle={lessonInfo.title}
      lessonPinyin={lessonInfo.pinyin}
      lessonTitleTranslation={lessonInfo.titleTranslation}
      lessonTitleTranslation_ru={lessonInfo.titleTranslation_ru}
    />
  );
}
