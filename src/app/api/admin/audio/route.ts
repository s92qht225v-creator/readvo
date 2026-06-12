import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const BUCKET = 'audio';
const LIB_PREFIX = 'tts/library';

function ok(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  return !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

function publicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
}

/** List the saved TTS library (newest first). */
export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data, error } = await getSupabaseAdmin()
    .from('tts_library')
    .select('id, text, style, url, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

/** Save a generated clip: upload base64 audio to storage + record a row. */
export async function POST(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { text, style, audioBase64 } = await req.json();
  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }
  if (!audioBase64 || typeof audioBase64 !== 'string') {
    return NextResponse.json({ error: 'Missing audio' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const path = `${LIB_PREFIX}/${randomUUID()}.wav`;
  const buffer = Buffer.from(audioBase64, 'base64');

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'audio/wav', upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const url = publicUrl(path);
  const { data, error } = await admin
    .from('tts_library')
    .insert({ text: text.trim(), style: typeof style === 'string' ? style : '', path, url })
    .select('id, text, style, url, created_at')
    .single();
  if (error) {
    // roll back the orphaned upload
    await admin.storage.from(BUCKET).remove([path]).catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}

/** Delete a saved clip (storage file + row). */
export async function DELETE(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: row } = await admin.from('tts_library').select('path').eq('id', id).single();
  if (row?.path) {
    await admin.storage.from(BUCKET).remove([row.path]).catch(() => {});
  }
  const { error } = await admin.from('tts_library').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
