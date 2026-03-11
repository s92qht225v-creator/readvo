'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { FlashcardDeck } from '@/components/FlashcardDeck';
import type { FlashcardDeckData } from '@/types';

export default function TopicFlashcardPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = (params?.topicId as string) ?? '';

  const [deck, setDeck] = useState<FlashcardDeckData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/flashcards/topic/${topicId}`);
        if (!res.ok) { router.replace('/chinese?tab=flashcards'); return; }
        const data = await res.json() as FlashcardDeckData;
        setDeck(data);
      } catch {
        setError(true);
      }
    }
    load();
  }, [topicId, router]);

  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Xatolik yuz berdi</div>;
  if (!deck) return <div className="loading-spinner" />;

  return (
    <FlashcardDeck
      deck={deck}
      bookPath="/chinese/hsk1"
      backHref="/chinese?tab=flashcards&subtab=topics"
      lessonTitle={deck.title_zh}
      lessonPinyin={deck.title_pinyin}
      lessonTitleTranslation={deck.title}
      lessonTitleTranslation_ru={deck.title_ru}
    />
  );
}
