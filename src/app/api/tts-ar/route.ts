import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const BUCKET = 'audio';
const TTS_PREFIX = 'ar/tts';

const ALLOWED_VOICES = new Set(['alloy', 'echo', 'onyx', 'nova', 'shimmer', 'fable']);

function storagePath(text: string, voice: string): string {
  const hex = Buffer.from(text, 'utf-8').toString('hex');
  return `${TTS_PREFIX}/${voice}/${hex}.mp3`;
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
  const voice = typeof rawVoice === 'string' && ALLOWED_VOICES.has(rawVoice) ? rawVoice : 'alloy';

  const supabase = getSupabaseAdmin();
  const path = storagePath(text, voice);

  // 1. Cache hit?
  const { data: existing, error: dlError } = await supabase.storage.from(BUCKET).download(path);
  if (existing && !dlError) {
    return NextResponse.json({ url: publicUrl(path) });
  }

  // 2. Generate via OpenAI TTS (provider is swappable; OPENAI_API_KEY already in env).
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice, input: text, response_format: 'mp3' }),
    });
    if (!res.ok) {
      console.error('OpenAI TTS error:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'TTS request failed' }, { status: res.status });
    }
    const audioBuffer = Buffer.from(await res.arrayBuffer());

    // 3. Cache to Supabase
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, audioBuffer, { contentType: 'audio/mpeg', upsert: true });
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ url: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}` });
    }
    return NextResponse.json({ url: publicUrl(path) });
  } catch (e) {
    console.error('TTS fetch error:', e);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
