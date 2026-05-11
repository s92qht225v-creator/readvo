import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { gradeAnswer, hasAnswer } from '@/lib/test/grade';
import type { TestQuestion, ResponseSubmission } from '@/lib/test/types';

const DOUBLE_SUBMIT_WINDOW_MS = 30_000;

/**
 * POST /api/t/[slug]/responses
 * Body: ResponseSubmission
 * - Loads canonical questions server-side
 * - Drops unknown question_ids
 * - Validates required questions
 * - Grades against canonical row's answer key
 * - Rejects duplicate within 30s window
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6}$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null) as ResponseSubmission | null;
  if (!body || typeof body.respondent_token !== 'string' || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const timedOut = body.timed_out === true;

  const admin = getSupabaseAdmin();
  const { data: test } = await admin
    .from('tests')
    .select('id, is_graded, is_published')
    .eq('slug', slug)
    .maybeSingle();
  if (!test || !test.is_published) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Double-submit guard
  const sinceISO = new Date(Date.now() - DOUBLE_SUBMIT_WINDOW_MS).toISOString();
  const { data: recent } = await admin
    .from('test_responses')
    .select('id')
    .eq('test_id', test.id)
    .eq('respondent_token', body.respondent_token)
    .gte('completed_at', sinceISO)
    .maybeSingle();
  if (recent) {
    return NextResponse.json({ error: 'duplicate' }, { status: 409 });
  }

  // Load canonical questions, build lookup map
  const { data: questions } = await admin
    .from('test_questions')
    .select('*')
    .eq('test_id', test.id);
  const qMap = new Map<string, TestQuestion>();
  for (const q of (questions ?? []) as TestQuestion[]) qMap.set(q.id, q);

  // Map submitted answers by question id (drop unknowns)
  const submitted = new Map<string, typeof body.answers[number]['value']>();
  for (const a of body.answers) {
    if (qMap.has(a.question_id)) submitted.set(a.question_id, a.value);
  }

  // Required-question check
  if (!timedOut) {
    for (const q of qMap.values()) {
      if (q.required && !hasAnswer(q, submitted.get(q.id))) {
        return NextResponse.json(
          { error: 'missing_required', question_id: q.id },
          { status: 400 },
        );
      }
    }
  }

  // ip_hash for privacy-friendly dedupe / abuse signals
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 32) : null;
  const completedAt = new Date().toISOString();
  const submittedStartedAt = typeof body.started_at === 'string' ? new Date(body.started_at) : null;
  const startedAt = submittedStartedAt
    && Number.isFinite(submittedStartedAt.getTime())
    && submittedStartedAt.getTime() <= Date.now()
    ? submittedStartedAt.toISOString()
    : completedAt;
  const profile = body.respondent_profile ?? {};
  const respondentName = [
    (body.respondent_name ?? '').toString().trim(),
    [
      (profile.first_name ?? '').toString().trim(),
      (profile.last_name ?? '').toString().trim(),
    ].filter(Boolean).join(' '),
    (profile.email ?? '').toString().trim(),
    (profile.phone ?? '').toString().trim(),
  ].filter(Boolean)[0] ?? '';

  // Grade and persist
  let score = 0;
  let gradeable = false;
  const answerRows: Array<{ question_id: string; value: unknown; is_correct: boolean | null }> = [];
  for (const [qid, val] of submitted) {
    const q = qMap.get(qid)!;
    const ic = test.is_graded ? gradeAnswer(q, val) : null;
    if (test.is_graded && ic != null) {
      gradeable = true;
      if (ic) score += 1;
    }
    answerRows.push({ question_id: qid, value: val, is_correct: ic });
  }

  const responsePayload = {
    test_id: test.id,
    respondent_name: respondentName.slice(0, 80),
    respondent_token: body.respondent_token,
    started_at: startedAt,
    completed_at: completedAt,
    score: test.is_graded && gradeable ? score : null,
    ip_hash: ipHash,
    timed_out: timedOut,
  };
  let { data: respRow, error: respErr } = await admin
    .from('test_responses')
    .insert(responsePayload)
    .select('id, score')
    .single();

  if (respErr?.message?.includes('timed_out')) {
    const { timed_out: _timedOut, ...legacyPayload } = responsePayload;
    const retry = await admin
      .from('test_responses')
      .insert(legacyPayload)
      .select('id, score')
      .single();
    respRow = retry.data;
    respErr = retry.error;
  }
  if (respErr || !respRow) {
    return NextResponse.json({ error: respErr?.message ?? 'insert_failed' }, { status: 500 });
  }

  if (answerRows.length > 0) {
    const insertRows = answerRows.map(r => ({ ...r, response_id: respRow.id }));
    const { error: ansErr } = await admin.from('test_answers').insert(insertRows);
    if (ansErr) {
      // Best effort — leave the response row in place, surface the error
      return NextResponse.json({ error: ansErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    response_id: respRow.id,
    score: respRow.score,
    total: gradeable ? answerRows.filter(r => r.is_correct !== null).length : null,
  });
}
