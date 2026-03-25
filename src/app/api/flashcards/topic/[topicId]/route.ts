import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { FlashcardDeckData } from '@/types';

const TOPICS_DIR = path.join(process.cwd(), 'content', 'flashcards', 'topics');

export async function GET(_req: Request, { params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  if (!/^[a-z0-9_-]+$/.test(topicId)) {
    return NextResponse.json({ error: 'invalid topic id' }, { status: 400 });
  }
  const filePath = path.join(TOPICS_DIR, `${topicId}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const deck = JSON.parse(content) as FlashcardDeckData;
    return NextResponse.json(deck);
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
