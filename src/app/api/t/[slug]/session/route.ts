import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * POST /api/t/[slug]/session — opens (or rejoins) a respondent session.
 *
 * Creates a `test_responses` row up-front with a server-generated `seed`
 * (a stable per-session shuffle key) and `started_at`. The client uses
 * the returned `seed` when fetching `/api/t/[slug]?seed=…` so all
 * randomized questions shuffle identically across reloads of the same
 * session, but differently for every test-taker.
 *
 * If the respondent already has an in-flight (not yet completed) session
 * for this test, the existing row is returned instead of creating a new
 * one. The client keys this on `respondent_token` from localStorage, so
 * the same browser reloading the page sees the same shuffle order.
 *
 * Body: { respondent_token: string }
 * Returns: { response_id: string, seed: string }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6}$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null) as { respondent_token?: string } | null;
  const token = body?.respondent_token;
  if (!token || typeof token !== 'string' || token.length < 8 || token.length > 128) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: test } = await admin
    .from('tests')
    .select('id, is_published')
    .eq('slug', slug)
    .maybeSingle();
  if (!test || !test.is_published) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  /* Reuse an in-flight session if one exists — keeps the shuffle order
     stable across reloads even if the client lost its localStorage. */
  const { data: existing } = await admin
    .from('test_responses')
    .select('id, seed')
    .eq('test_id', test.id)
    .eq('respondent_token', token)
    .is('completed_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing && existing.seed) {
    return NextResponse.json({ response_id: existing.id, seed: existing.seed });
  }

  const seed = randomUUID();
  const startedAt = new Date().toISOString();
  const { data: row, error } = await admin
    .from('test_responses')
    .insert({
      test_id: test.id,
      respondent_token: token,
      respondent_name: '',
      started_at: startedAt,
      completed_at: null,
      seed,
    })
    .select('id, seed')
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'session_create_failed' }, { status: 500 });
  }

  return NextResponse.json({ response_id: row.id, seed: row.seed });
}
