import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getUserIdFromJWT } from '@/lib/jwt';
import type { FlashcardDeckData } from '@/types';

const TOPICS_DIR = path.join(process.cwd(), 'content', 'flashcards', 'topics');

export async function GET(request: NextRequest, { params }: { params: Promise<{ topicId: string }> }) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) return NextResponse.json({ locked: true }, { status: 401 });

  const { topicId } = await params;
  if (!/^[a-z0-9_-]+$/.test(topicId)) {
    return NextResponse.json({ error: 'invalid topic id' }, { status: 400 });
  }
  const filePath = path.join(TOPICS_DIR, `${topicId}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const deck = JSON.parse(content) as FlashcardDeckData;
    return NextResponse.json(deck, { headers: { 'Cache-Control': 'no-store, private' } });
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
