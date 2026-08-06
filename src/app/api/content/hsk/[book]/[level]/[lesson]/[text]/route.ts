import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { getHskText } from '@/services/hsk';
import { resolveDialogueVocab } from '@/services';
import { attachWordLevels } from '@/lib/hskWordLevels';

/**
 * One text of an HSK course lesson, in the dialogue shape.
 *
 * Deliberately mirrors /api/content/dialogue/[book]/[slug] — same auth, same
 * entitlement check, same vocab resolution, same progressive-pinyin levels — so
 * `DialogueReader` renders a course text with no idea it isn't a dialogue.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ book: string; level: string; lesson: string; text: string }> },
) {
  const { book, level, lesson, text } = await params;
  if (!/^[a-z0-9-]+$/.test(book) || !/^[1-6]$/.test(level)
      || !/^[\w-]+$/.test(lesson) || !/^[\w-]+$/.test(text)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) return NextResponse.json({ locked: true }, { status: 401 });

  const { entitled } = await resolveEntitlement(userId);
  if (!entitled) return NextResponse.json({ locked: true }, { status: 402 });

  const found = getHskText(book, level, lesson, text);
  if (!found) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Shape it as a dialogue: the reader keys off id/title/sections/vocab.
  const dialogue = await resolveDialogueVocab({
    ...found.text,
    title: found.lesson.title,
    pinyin: found.lesson.pinyin,
    titleTranslation: found.lesson.titleTranslation,
    titleTranslation_ru: found.lesson.titleTranslation_ru,
    titleTranslation_en: found.lesson.titleTranslation_en,
  } as Parameters<typeof resolveDialogueVocab>[0]);
  await attachWordLevels(dialogue);

  return NextResponse.json({ dialogue }, { headers: { 'Cache-Control': 'no-store, private' } });
}
