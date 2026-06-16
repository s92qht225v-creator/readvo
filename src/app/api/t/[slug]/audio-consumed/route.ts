import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * POST /api/t/[slug]/audio-consumed — mark a play-once listening track as
 * consumed for this respondent's session, so a page refresh can't replay
 * it. Appends `track_id` (a section id, or 'global' for the test-level
 * track) to `test_responses.consumed_audio`.
 *
 * Body: { respondent_token: string, response_id: string, track_id: string }
 * Idempotent — appending an already-present track is a no-op.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6}$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null) as {
    respondent_token?: string;
    response_id?: string;
    track_id?: string;
  } | null;
  const token = body?.respondent_token;
  const responseId = body?.response_id;
  const trackId = body?.track_id;
  if (!token || typeof token !== 'string'
    || !responseId || typeof responseId !== 'string'
    || !trackId || typeof trackId !== 'string' || trackId.length > 64) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  /* Ownership: the session row must match this respondent token — the
     token is the per-respondent secret, so id+token is the real guard.
     Read-modify-write the array (single respondent, no real contention). */
  const { data: row } = await admin
    .from('test_responses')
    .select('id, consumed_audio')
    .eq('id', responseId)
    .eq('respondent_token', token)
    .maybeSingle();
  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const current: string[] = Array.isArray(row.consumed_audio) ? row.consumed_audio : [];
  if (current.includes(trackId)) {
    return NextResponse.json({ ok: true, consumed_audio: current });
  }
  // Cap the array so a client can't grow this row's storage unboundedly by
  // posting an endless stream of distinct track ids. Any real test has far
  // fewer than 200 listening tracks.
  if (current.length >= 200) {
    return NextResponse.json({ ok: true, consumed_audio: current });
  }
  const next = [...current, trackId];
  const { error } = await admin
    .from('test_responses')
    .update({ consumed_audio: next })
    .eq('id', responseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, consumed_audio: next });
}
