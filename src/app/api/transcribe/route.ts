import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { transcribeAudio } from '@/lib/transcribe/whisper';
import { scoreAnswer } from '@/lib/transcribe/scorer';

const DAILY_LIMIT = 100;

export async function POST(request: NextRequest) {
  // --- Auth (optional — daily limit only applies to logged-in users) ---
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const userId = token ? getUserIdFromJWT(token) : null;

  // --- Parse FormData ---
  const formData = await request.formData();
  const audio = formData.get('audio');
  const expected = typeof formData.get('expected') === 'string' ? (formData.get('expected') as string) : '';
  const language = typeof formData.get('language') === 'string' ? (formData.get('language') as string) : 'uz';

  if (!audio || !(audio instanceof Blob)) {
    return Response.json({ error: 'No audio file' }, { status: 400 });
  }

  // --- Daily usage limit (only for authenticated users) ---
  const admin = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  let currentCount = 0;

  if (userId) {
    const { data: usageRow } = await admin
      .from('transcription_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    currentCount = usageRow?.count ?? 0;
    if (currentCount >= DAILY_LIMIT) {
      return Response.json({ error: 'limit_reached' }, { status: 429 });
    }
  }

  // --- Buffer audio ---
  const arrayBuffer = await audio.arrayBuffer();
  const fileName = (audio as File).name || 'audio.webm';
  const mimeType = audio.type || 'audio/webm';

  // --- Transcribe ---
  let transcription;
  try {
    transcription = await transcribeAudio(arrayBuffer, fileName, mimeType);
  } catch (err) {
    console.error('[transcribe] Both providers failed:', err);
    return Response.json({ error: 'transcription_failed' }, { status: 503 });
  }

  const heard = transcription.text.replace(/\d+/g, '').trim();

  // --- Silence detection (empty text or Whisper's own no_speech probability) ---
  if (heard.length === 0 || transcription.noSpeechProb > 0.6) {
    return Response.json({ text: '', result: 'no_speech', feedback: '', source: transcription.source });
  }

  // --- Hallucination detection ---
  // If the expected answer is Chinese but Whisper returned zero CJK characters,
  // it hallucinated Latin text (e.g. "whoa whoa Schröingfei") — treat as no_speech
  const CJK_RE = /[\u4e00-\u9fff]/;
  if (expected && CJK_RE.test(expected) && !CJK_RE.test(heard)) {
    return Response.json({ text: '', result: 'no_speech', feedback: '', source: transcription.source });
  }

  // --- Score ---
  let result: 'correct' | 'close' | 'wrong' = 'wrong';
  let feedback = '';

  if (expected) {
    const score = await scoreAnswer(expected, heard, language);
    result = score.result;
    feedback = score.feedback;
  }

  // --- Increment usage (only for authenticated users) ---
  if (userId) {
    await admin
      .from('transcription_usage')
      .upsert(
        { user_id: userId, date: today, count: currentCount + 1 },
        { onConflict: 'user_id,date' },
      );
  }

  console.log({ source: transcription.source, expected, heard, result });

  return Response.json({
    text: heard,
    result,
    feedback,
    source: transcription.source,
  });
}
