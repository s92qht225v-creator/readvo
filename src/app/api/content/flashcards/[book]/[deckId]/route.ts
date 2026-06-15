import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { buildFlashcardDeck } from '@/services/flashcards';

const BOOKS = new Set(['hsk1', 'hsk2', 'hsk3']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ book: string; deckId: string }> },
) {
  const { book, deckId } = await params;
  if (!BOOKS.has(book) || !/^[\w-]+$/.test(deckId)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) {
    return NextResponse.json({ locked: true }, { status: 401 });
  }

  const built = await buildFlashcardDeck(book, deckId);
  if (!built) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (!built.isFree) {
    const { entitled } = await resolveEntitlement(userId);
    if (!entitled) {
      return NextResponse.json({ locked: true }, { status: 402 });
    }
  }

  return NextResponse.json({ deck: built.deck }, { headers: { 'Cache-Control': 'no-store, private' } });
}
