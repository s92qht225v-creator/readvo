import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';

/**
 * "My Vocabulary" API — words a user saves from dialogue Words tabs, reviewed
 * in a personal swipe deck (`/chinese/vocabulary`).
 *
 * Table: `saved_vocab`
 *   user_id    UUID
 *   zh         TEXT
 *   py         TEXT   (default '')
 *   uz/ru/en   TEXT   (the resolved gloss, so the deck renders without a glossary hit)
 *   hsk        INT    (nullable)
 *   created_at TIMESTAMPTZ
 *   PRIMARY KEY (user_id, zh, py)
 *   RLS enabled, no policies → service-role only (never queried from the browser).
 */

function userFrom(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  return token ? getUserIdFromJWT(token) : null;
}

/** GET: all saved words for the user (newest first). */
export async function GET(request: NextRequest) {
  const userId = userFrom(request);
  if (!userId) return NextResponse.json({ words: [] });

  const { data, error } = await getSupabaseAdmin()
    .from('saved_vocab')
    .select('zh, py, uz, ru, en, hsk, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ words: data ?? [] });
}

/** POST: save a word (idempotent upsert on (user_id, zh, py)). */
export async function POST(request: NextRequest) {
  const userId = userFrom(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const zh = typeof body?.zh === 'string' ? body.zh.trim() : '';
  if (!zh) return NextResponse.json({ error: 'Missing zh' }, { status: 400 });

  const row = {
    user_id: userId,
    zh,
    py: typeof body.py === 'string' ? body.py : '',
    uz: typeof body.uz === 'string' ? body.uz : '',
    ru: typeof body.ru === 'string' ? body.ru : '',
    en: typeof body.en === 'string' ? body.en : '',
    hsk: typeof body.hsk === 'number' ? body.hsk : null,
  };

  const { error } = await getSupabaseAdmin()
    .from('saved_vocab')
    .upsert(row, { onConflict: 'user_id,zh,py' });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE: remove a saved word (by zh + py). */
export async function DELETE(request: NextRequest) {
  const userId = userFrom(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const zh = typeof body?.zh === 'string' ? body.zh.trim() : '';
  if (!zh) return NextResponse.json({ error: 'Missing zh' }, { status: 400 });
  const py = typeof body?.py === 'string' ? body.py : '';

  const { error } = await getSupabaseAdmin()
    .from('saved_vocab')
    .delete()
    .eq('user_id', userId)
    .eq('zh', zh)
    .eq('py', py);

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
