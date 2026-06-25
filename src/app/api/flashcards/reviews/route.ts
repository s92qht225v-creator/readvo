import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { newCardState, schedule, type CardState, type Grade } from '@/lib/srs';

/**
 * Flashcard spaced-repetition review API.
 *
 * Table: `flashcard_reviews`
 *   user_id uuid, card_id text, ease real, interval_days int, reps int,
 *   lapses int, due_at timestamptz, last_grade text, updated_at timestamptz
 *   PRIMARY KEY (user_id, card_id)
 *
 * Scheduling is done server-side via the shared `srs` scheduler so the
 * algorithm stays authoritative (clients only send a grade).
 */

function userIdFrom(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  return token ? getUserIdFromJWT(token) : null;
}

/** GET: the user's review states (optional `?prefix=` to scope to a deck). */
export async function GET(request: NextRequest) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ reviews: [] });

  const admin = getSupabaseAdmin();
  const prefix = request.nextUrl.searchParams.get('prefix');
  let query = admin
    .from('flashcard_reviews')
    .select('card_id, ease, interval_days, reps, lapses, due_at, last_grade')
    .eq('user_id', userId);
  if (prefix) query = query.like('card_id', `${prefix}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ reviews: data });
}

const GRADES = new Set<Grade>(['again', 'good', 'easy']);

/** POST: grade a card → schedule + persist. Body: { card_id, grade }. */
export async function POST(request: NextRequest) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { card_id, grade } = await request.json();
  if (!card_id || typeof card_id !== 'string' || !GRADES.has(grade)) {
    return NextResponse.json({ error: 'Missing card_id or invalid grade' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from('flashcard_reviews')
    .select('ease, interval_days, reps, lapses, due_at')
    .eq('user_id', userId)
    .eq('card_id', card_id)
    .maybeSingle();

  const now = new Date();
  const prev: CardState = existing
    ? { reps: existing.reps, lapses: existing.lapses, ease: existing.ease, intervalDays: existing.interval_days, dueAt: existing.due_at }
    : newCardState(now);
  const next = schedule(prev, grade as Grade, now);

  const { error } = await admin.from('flashcard_reviews').upsert({
    user_id: userId,
    card_id,
    ease: next.ease,
    interval_days: next.intervalDays,
    reps: next.reps,
    lapses: next.lapses,
    due_at: next.dueAt,
    last_grade: grade,
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id,card_id' });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true, state: next });
}
