import { NextRequest, NextResponse } from 'next/server';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) return NextResponse.json({ locked: true }, { status: 401 });

  const { entitled } = await resolveEntitlement(userId);
  if (!entitled) return NextResponse.json({ locked: true }, { status: 402 });

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
  return NextResponse.json({ ...deck, lessonHeaders }, { headers: { 'Cache-Control': 'no-store, private' } });
}
