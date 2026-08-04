import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { loadDialogue, resolveDialogueVocab } from '@/services';
import { attachWordLevels } from '@/lib/hskWordLevels';

const BOOKS = new Set(['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ book: string; slug: string }> },
) {
  const { book, slug } = await params;
  if (!BOOKS.has(book)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (!/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) {
    return NextResponse.json({ locked: true }, { status: 401 });
  }

  const { entitled } = await resolveEntitlement(userId);
  if (!entitled) {
    return NextResponse.json({ locked: true }, { status: 402 });
  }

  const raw = await loadDialogue(book, slug);
  if (!raw) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const dialogue = await resolveDialogueVocab(raw);
  await attachWordLevels(dialogue);
  return NextResponse.json({ dialogue }, { headers: { 'Cache-Control': 'no-store, private' } });
}
