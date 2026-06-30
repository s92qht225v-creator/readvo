import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const BUCKET = 'audio';
const TTS_PREFIX = 'tts/grammar';

// MiMo voices → ascii-safe path slugs (Chinese voice names would percent-encode
// in the storage URL). The cache key includes the voice so per-speaker dialogue
// audio never collides (the old text-only key made A's and B's shared short
// lines overwrite each other). The DEFAULT voice keeps the original flat path
// so existing cached audio (grammar, flashcards) isn't orphaned.
const DEFAULT_VOICE = 'mimo_default';
const VOICE_SLUG: Record<string, string> = {
  mimo_default: 'mimo_default', '冰糖': 'bingtang', '茉莉': 'moli', '苏打': 'suda',
  '白桦': 'baihua', Mia: 'Mia', Chloe: 'Chloe', Milo: 'Milo', Dean: 'Dean',
};

/** Deterministic file path from Chinese text + voice */
function storagePath(text: string, voice: string): string {
  // Use hex encoding of the text to avoid URL-encoding issues
  const hex = Buffer.from(text, 'utf-8').toString('hex');
  return voice === DEFAULT_VOICE ? `${TTS_PREFIX}/${hex}.wav` : `${TTS_PREFIX}/${VOICE_SLUG[voice]}/${hex}.wav`;
}

/** Short content hash → cache-buster query param. When a line is regenerated
 *  its bytes change, so `?v=` changes, so the browser/CDN fetch the new clip
 *  instead of serving a stale copy at the same path (overwrites reuse the URL). */
function ver(buf: Buffer): string {
  return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
}

/** Public URL for a file in the audio bucket (with optional cache-buster). */
function publicUrl(path: string, v?: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const base = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  return v ? `${base}?v=${v}` : base;
}

export async function POST(req: NextRequest) {
  // Generating TTS hits a paid external API (MiMo) and writes to storage, so
  // it must not be open to anonymous callers. Gate on the same-origin
  // `blim-auth` cookie (HttpOnly, set on login) — logged-in users carry it
  // automatically, so legitimate in-app calls are unaffected.
  if (req.cookies.get('blim-auth')?.value !== '1') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { text, style, voice: rawVoice, skipCache } = await req.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  // Validate voice against the known MiMo voices; unknown → default.
  const voice = typeof rawVoice === 'string' && VOICE_SLUG[rawVoice] ? rawVoice : DEFAULT_VOICE;

  const supabase = getSupabaseAdmin();

  // 1. Check Supabase cache (skip when admin requests fresh generation)
  if (!skipCache) {
    const path = storagePath(text, voice);
    const { data: existing, error: dlError } = await supabase.storage
      .from(BUCKET)
      .download(path);

    if (existing && !dlError) {
      const buf = Buffer.from(await existing.arrayBuffer());
      return NextResponse.json({ url: publicUrl(path, ver(buf)) });
    }
  }

  // 2. Generate via MiMo TTS
  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
  }

  // MiMo-V2.5 pacing/style is steered by a natural-language instruction in a
  // separate `user`-role message — NOT a <style> tag inside the assistant text
  // (that tag is essentially ignored, which is why everything sounded fast).
  // The target text goes in the assistant message. `style` lets the admin pass
  // a custom instruction; '' = no instruction (natural pace); undefined =
  // default learner pace.
  const DEFAULT_INSTRUCTION = '请用适当放慢、清晰的语速朗读，适合语言学习者。';
  const instruction = style !== undefined ? style : DEFAULT_INSTRUCTION;
  const messages = instruction
    ? [{ role: 'user', content: instruction }, { role: 'assistant', content: text }]
    : [{ role: 'assistant', content: text }];

  try {
    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // MiMo renamed the model + voice (the old mimo-v2-tts / default_zh
        // now 400 with "Not supported model" / "Unknown voice"). Current
        // models: mimo-v2.5-tts; voices: mimo_default, 冰糖, 茉莉, … .
        model: 'mimo-v2.5-tts',
        messages,
        audio: {
          format: 'wav',
          voice,
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

    // skipCache mode: return base64 directly without Supabase upload
    if (skipCache) {
      return NextResponse.json({ audio: audioBase64 });
    }

    // 3. Upload to Supabase Storage
    const path = storagePath(text, voice);
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, audioBuffer, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ audio: audioBase64 });
    }

    return NextResponse.json({ url: publicUrl(path, ver(audioBuffer)) });
  } catch (error) {
    console.error('TTS fetch error:', error);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
