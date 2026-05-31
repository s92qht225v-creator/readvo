import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { detectScriptLang } from '@/lib/test/scriptLang';
import { judgeRubric, rubricMaxScore } from '@/lib/transcribe/rubricJudge';
import type { SpeakingOptions } from '@/lib/test/types';

/**
 * POST /api/t/[slug]/speaking-grade — record-time grading for a `speaking`
 * question. Uploads the recording to the private `test-recordings` bucket,
 * transcribes it (multi-language, auto-detect), grades the transcript against
 * the teacher's rubric, and persists the result to `test_speaking_grades`.
 *
 * Exam-style: the score/transcript are NEVER returned to the caller — the
 * student must not see how they did. Only `{ ok: true }`.
 *
 * Auth + shape mirror `audio-consumed`: the respondent token is the
 * per-respondent secret, so id+token is the real guard on the response row.
 *
 * Body (multipart FormData):
 *   respondent_token: string
 *   response_id:      string
 *   question_id:      string
 *   audio:           File/Blob (the recording)
 */

const SPEAKING_DAILY_CAP = 200;
const OPENAI_TRANSCRIBE_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6}$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // 1. Parse + validate the multipart body.
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const token = form.get('respondent_token');
  const responseId = form.get('response_id');
  const questionId = form.get('question_id');
  const audio = form.get('audio');
  if (
    typeof token !== 'string' || !token
    || typeof responseId !== 'string' || !responseId
    || typeof questionId !== 'string' || !questionId
    || !(audio instanceof Blob) || audio.size === 0
  ) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const audioFile = audio as File;

  const admin = getSupabaseAdmin();

  // 2. Load the response row — id+token is the guard. Read its test_id.
  const { data: response } = await admin
    .from('test_responses')
    .select('id, test_id')
    .eq('id', responseId)
    .eq('respondent_token', token)
    .maybeSingle();
  if (!response) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const testId = response.test_id as string;

  // 3. Load the test (for owner_id) and the question (must be speaking).
  const { data: test } = await admin
    .from('tests')
    .select('id, owner_id')
    .eq('id', testId)
    .maybeSingle();
  if (!test) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const ownerId = test.owner_id as string;

  const { data: question } = await admin
    .from('test_questions')
    .select('id, type, prompt, options')
    .eq('id', questionId)
    .eq('test_id', testId)
    .maybeSingle();
  if (!question || question.type !== 'speaking') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const speakingOpts = (question.options ?? {}) as SpeakingOptions;
  const rubric = Array.isArray(speakingOpts.rubric) ? speakingOpts.rubric : [];

  // 4. Guardrails.
  // 4a. Pro check — the test owner must have an active subscription.
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', ownerId)
    .gt('ends_at', new Date().toISOString())
    .limit(1)
    .maybeSingle();
  if (!sub) {
    return NextResponse.json({ error: 'not_pro' }, { status: 403 });
  }

  // 4b. Idempotent — never re-grade or re-upload an existing (response,question).
  const { data: existingGrade } = await admin
    .from('test_speaking_grades')
    .select('response_id')
    .eq('response_id', responseId)
    .eq('question_id', questionId)
    .maybeSingle();
  if (existingGrade) {
    return NextResponse.json({ ok: true, already: true });
  }

  // 4c. Daily cap — count grades for THIS test created today. Two-step,
  // RPC-free: fetch this test's response ids, then count grades against them.
  const { data: respIds } = await admin
    .from('test_responses')
    .select('id')
    .eq('test_id', testId);
  const ids = (respIds ?? []).map(r => r.id);
  if (ids.length > 0) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await admin
      .from('test_speaking_grades')
      .select('*', { count: 'exact', head: true })
      .in('response_id', ids)
      .gte('created_at', startOfDay.toISOString());
    if ((count ?? 0) >= SPEAKING_DAILY_CAP) {
      return NextResponse.json({ error: 'cap_reached' }, { status: 429 });
    }
  }

  // 5. Upload the recording to the private bucket.
  const arrayBuffer = await audioFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = audioFile.type || 'audio/webm';
  // Derive the file extension from the actual content-type. Browsers differ
  // (Chrome/Firefox → webm, Safari → mp4/m4a) and the OpenAI transcription
  // API keys off the filename extension, so a hardcoded .webm breaks Safari
  // recordings (and any non-webm upload).
  const ext = /(mp4|m4a|aac)/.test(contentType) ? 'm4a'
    : /(mpeg|mp3)/.test(contentType) ? 'mp3'
    : /ogg/.test(contentType) ? 'ogg'
    : /wav/.test(contentType) ? 'wav'
    : 'webm';
  const path = `${testId}/${responseId}/${questionId}.${ext}`;
  const { error: uploadErr } = await admin.storage
    .from('test-recordings')
    .upload(path, buffer, { contentType, upsert: true });
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // 6. Transcribe — standalone, multi-language, auto-detect (NO language field).
  let transcript = '';
  try {
    const fd = new FormData();
    fd.append('file', new Blob([arrayBuffer], { type: contentType }), `recording.${ext}`);
    fd.append('model', 'gpt-4o-transcribe');
    fd.append('response_format', 'text');
    const sttRes = await fetch(OPENAI_TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: fd,
    });
    if (sttRes.ok) {
      transcript = (await sttRes.text()).trim();
    } else {
      console.warn('[speaking-grade] transcription HTTP', sttRes.status, await sttRes.text());
    }
  } catch (err) {
    console.warn('[speaking-grade] transcription failed:', (err as Error).message);
  }

  // 7. Judge — derive language label from the script of the transcript
  // (fall back to the prompt's script when the transcript is empty).
  const script = detectScriptLang(transcript || (question.prompt as string));
  const langLabel =
    script === 'zh' ? 'Chinese'
    : script === 'ja' ? 'Japanese'
    : script === 'ko' ? 'Korean'
    : script === 'ar' ? 'Arabic'
    : 'English';
  const { criteria, score, maxScore, feedback } = transcript
    ? await judgeRubric(transcript, rubric, langLabel)
    : {
        criteria: rubric.map(c => ({ id: c.id, verdict: 'none' as const, earned: 0, note: '' })),
        score: 0,
        maxScore: rubricMaxScore(rubric),
        feedback: '',
      };

  // 8. Persist — PK is (response_id, question_id); upsert for safety.
  const { error: insertErr } = await admin
    .from('test_speaking_grades')
    .upsert(
      {
        response_id: responseId,
        question_id: questionId,
        audio_url: path,
        transcript,
        score,
        max_score: maxScore,
        detail: { criteria, feedback },
      },
      { onConflict: 'response_id,question_id' },
    );
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 9. Exam-style — never leak the score/transcript to the caller.
  return NextResponse.json({ ok: true });
}
