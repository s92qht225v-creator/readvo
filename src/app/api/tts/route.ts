import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const BUCKET = 'audio';
const TTS_PREFIX = 'tts/grammar';

/** Deterministic file path from Chinese text */
function storagePath(text: string): string {
  // Use hex encoding of the text to avoid URL-encoding issues
  const hex = Buffer.from(text, 'utf-8').toString('hex');
  return `${TTS_PREFIX}/${hex}.wav`;
}

/** Public URL for a file in the audio bucket */
function publicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
}

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const path = storagePath(text);
  const supabase = getSupabaseAdmin();

  // 1. Check if already cached in Supabase
  const { data: existing } = await supabase.storage.from(BUCKET).list(TTS_PREFIX, {
    search: path.split('/').pop(),
  });

  if (existing && existing.length > 0) {
    return NextResponse.json({ url: publicUrl(path) });
  }

  // 2. Generate via MiMo TTS
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
  }

  try {
    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mimo-v2-tts',
        messages: [{ role: 'assistant', content: `<style>语速缓慢，吐字清晰，适合语言学习者</style>${text}` }],
        audio: {
          format: 'wav',
          voice: 'default_zh',
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('MiMo TTS error:', response.status, err);
      return NextResponse.json({ error: 'TTS request failed' }, { status: response.status });
    }

    const data = await response.json();
    const audioBase64 = data.choices?.[0]?.message?.audio?.data;
    if (!audioBase64) {
      return NextResponse.json({ error: 'No audio in response' }, { status: 502 });
    }

    // 3. Upload to Supabase Storage
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, audioBuffer, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      // Still return the audio even if upload fails
      return NextResponse.json({ audio: audioBase64 });
    }

    return NextResponse.json({ url: publicUrl(path) });
  } catch (error) {
    console.error('TTS fetch error:', error);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
