import { NextResponse } from 'next/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';

export async function GET() {
  const [deck, lessonInfos] = await Promise.all([loadFlashcardDeck('hsk1'), getLessonsWithInfo()]);
  if (!deck) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const lessonHeaders: Record<number, { title: string; pinyin: string; titleTranslation: string; titleTranslation_ru: string }> = {};
  for (const info of lessonInfos) {
    lessonHeaders[info.lessonNumber] = {
      title: info.title,
      pinyin: info.pinyin,
      titleTranslation: info.titleTranslation,
      titleTranslation_ru: info.titleTranslation_ru,
    };
  }
  return NextResponse.json({ ...deck, lessonHeaders });
}
