import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { stripTanwin } from '@/lib/reader/harakat';

const BUCKET = 'audio';
// Google Cloud TTS with native `ar-XA` Arabic voices. Unlike OpenAI's models
// (tts-1 mis-read MSA words; gpt-4o-mini-tts is generative and *added* words on
// short lines), Google's neural voices are deterministic — they pronounce
// exactly the text given, no hallucinated/extra words. Provider is baked into
// the cache path so the switch regenerates every clip fresh.
const PROVIDER = 'google';
const TTS_PREFIX = `ar/tts/${PROVIDER}`;
const DEFAULT_VOICE = 'ar-XA-Chirp3-HD-Charon';

// Chirp3-HD natively accepts `speakingRate` (confirmed: it measurably changes
// clip duration, not silently ignored) — this paces speech through Google's
// own generative model rather than resampling audio afterward, so it doesn't
// introduce the pitch/robotic artifacts a post-processing slowdown would.
// 0.85 reads noticeably calmer for A2 listeners without sounding unnatural.
// Baked into the cache path (like PROVIDER) so a future rate change
// regenerates fresh instead of silently mixing old/new-pace clips.
const SPEAKING_RATE = 0.85;
const RATE_SEGMENT = `r${String(SPEAKING_RATE).replace('.', '')}`;

// Allow Google ar-XA voices: Chirp3-HD (newest, most natural), Wavenet, Standard.
const VOICE_RE = /^ar-XA-(Chirp3-HD-[A-Za-z]+|Wavenet-[A-D]|Standard-[A-D])$/;

function storagePath(text: string, voice: string): string {
  const hex = Buffer.from(text, 'utf-8').toString('hex');
  return `${TTS_PREFIX}/${voice}/${RATE_SEGMENT}/${hex}.mp3`;
}

function publicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
}

export async function POST(req: NextRequest) {
  // Paid external API + storage write — gate on the same-origin HttpOnly
  // blim-auth cookie, exactly like /api/tts.
  if (req.cookies.get('blim-auth')?.value !== '1') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { text, voice: rawVoice } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }
  const voice = typeof rawVoice === 'string' && VOICE_RE.test(rawVoice) ? rawVoice : DEFAULT_VOICE;

  const supabase = getSupabaseAdmin();
  const path = storagePath(text, voice);

  // 1. Cache hit?
  const { data: existing, error: dlError } = await supabase.storage.from(BUCKET).download(path);
  if (existing && !dlError) {
    return NextResponse.json({ url: publicUrl(path) });
  }

  // 2. Generate via Google Cloud TTS.
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Strip tanwin (case-ending nunation) before synthesis so the
          // voice reads it like natural spoken MSA rather than formal
          // recitation. The cache key (`path`, below) stays keyed to the
          // original fully-vowelized `text` so callers are unaffected.
          input: { text: stripTanwin(text) },
          voice: { languageCode: 'ar-XA', name: voice },
          audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE },
        }),
      },
    );
    if (!res.ok) {
      console.error('Google TTS error:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'TTS request failed' }, { status: res.status });
    }
    const json = await res.json();
    const b64 = json.audioContent as string | undefined;
    if (!b64) {
      console.error('Google TTS: no audioContent in response');
      return NextResponse.json({ error: 'TTS request failed' }, { status: 502 });
    }
    const audioBuffer = Buffer.from(b64, 'base64');

    // 3. Cache to Supabase
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, audioBuffer, { contentType: 'audio/mpeg', upsert: true });
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ url: `data:audio/mpeg;base64,${b64}` });
    }
    return NextResponse.json({ url: publicUrl(path) });
  } catch (e) {
    console.error('TTS fetch error:', e);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
