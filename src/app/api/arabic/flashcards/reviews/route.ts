import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { scheduleArabic, type ArabicGrade } from '@/lib/arabicSrs';

/**
 * Arabic flashcard review API (2-grade SRS — see src/lib/arabicSrs.ts).
 *
 * Persists into the shared `flashcard_reviews` table, namespaced by an `ar:`
 * card_id prefix (`ar:{level}:{cardId}`) so it never collides with the Chinese
 * SM-2 rows. Reads reuse the generic `GET /api/flashcards/reviews?prefix=ar:`
 * endpoint; this route only handles grading (POST).
 */

function userIdFrom(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  return token ? getUserIdFromJWT(token) : null;
}

const GRADES = new Set<ArabicGrade>(['know', 'dontKnow']);

export async function POST(request: NextRequest) {
  const userId = userIdFrom(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { card_id, grade } = await request.json();
  if (!card_id || typeof card_id !== 'string' || !card_id.startsWith('ar:') || !GRADES.has(grade)) {
    return NextResponse.json({ error: 'Missing card_id or invalid grade' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from('flashcard_reviews')
    .select('interval_days, reps')
    .eq('user_id', userId)
    .eq('card_id', card_id)
    .maybeSingle();

  const now = new Date();
  const prev = existing ? { intervalDays: existing.interval_days, reps: existing.reps } : null;
  const next = scheduleArabic(prev, grade as ArabicGrade, now);

  const { error } = await admin.from('flashcard_reviews').upsert({
    user_id: userId,
    card_id,
    ease: 2.5,            // unused by the 2-grade scheduler; column is shared
    interval_days: next.intervalDays,
    reps: next.reps,
    lapses: 0,
    due_at: next.dueAt,
    last_grade: grade,
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id,card_id' });

  if (error) return NextResponse.json({ error: 'Database error' }, { status: 500 });
  return NextResponse.json({ ok: true, state: next });
}
