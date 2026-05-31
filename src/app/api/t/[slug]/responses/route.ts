import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { gradeAnswer, hasAnswer, summarizeSectionScores } from '@/lib/test/grade';
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

  const body = await req.json().catch(() => null) as (ResponseSubmission & { response_id?: string }) | null;
  if (!body || typeof body.respondent_token !== 'string' || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const timedOut = body.timed_out === true;
  const sessionResponseId = typeof body.response_id === 'string' && body.response_id ? body.response_id : null;

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

  // Load canonical questions, build lookup map.
  // Hidden questions are skipped — they don't reach the player, so they
  // can't be answered and shouldn't enforce required-question checks.
  const { data: questions } = await admin
    .from('test_questions')
    .select('*')
    .eq('test_id', test.id);
  const qMap = new Map<string, TestQuestion>();
  for (const q of (questions ?? []) as TestQuestion[]) {
    if (!q.hidden) qMap.set(q.id, q);
  }

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

  let respRow: { id: string; score: number | null } | null = null;
  let respErr: { message?: string } | null = null;
  let updatedSession = false;

  /* If the client opened a session up-front (POST /session), update that
     row instead of inserting a new one — the shuffle seed lives on that
     row, so this keeps the seed-to-answers tie intact. If the session
     row can't be found (stale localStorage, session POST failed, server
     reset), fall back to inserting a fresh response rather than failing
     the submission — a missing session must never strand a respondent.
     A genuinely completed session is still rejected as a duplicate. */
  if (sessionResponseId) {
    const { data: existing } = await admin
      .from('test_responses')
      .select('id, completed_at')
      .eq('id', sessionResponseId)
      .eq('test_id', test.id)
      .eq('respondent_token', body.respondent_token)
      .maybeSingle();
    if (existing?.completed_at) {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 });
    }
    if (existing) {
      /* Don't overwrite started_at — keep the original session-open time. */
      const { started_at: _started, ...updatePatch } = responsePayload;
      const update = await admin
        .from('test_responses')
        .update(updatePatch)
        .eq('id', sessionResponseId)
        .select('id, score')
        .single();
      respRow = update.data;
      respErr = update.error;
      updatedSession = !respErr;

      /* Clear stale answers from any partial earlier submission attempt
         for this session row before inserting the canonical ones. */
      if (updatedSession) {
        await admin.from('test_answers').delete().eq('response_id', sessionResponseId);
      }
    }
    /* else: session row not found → fall through to insert below. */
  }

  if (!updatedSession) {
    const insert = await admin
      .from('test_responses')
      .insert(responsePayload)
      .select('id, score')
      .single();
    respRow = insert.data;
    respErr = insert.error;

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

  /* Per-section breakdown for the student's done screen (graded tests with
     sections only). Computed over ALL non-hidden questions so unanswered
     gradable questions count as wrong, mirroring the overall score. */
  let sectionScores: ReturnType<typeof summarizeSectionScores> = [];
  if (test.is_graded) {
    const { data: sectionRows } = await admin
      .from('test_sections')
      .select('id, title, position')
      .eq('test_id', test.id);
    if (sectionRows && sectionRows.length > 0) {
      sectionScores = summarizeSectionScores([...qMap.values()], submitted, sectionRows);
    }
  }

  return NextResponse.json({
    ok: true,
    response_id: respRow.id,
    score: respRow.score,
    total: gradeable ? answerRows.filter(r => r.is_correct !== null).length : null,
    sections: sectionScores,
  });
}
