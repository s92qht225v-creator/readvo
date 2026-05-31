import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { verifyAudioToken, AUDIO_BUCKETS } from '@/lib/audio/token';

/**
 * GET /api/audio/<bucket>/<path...>?t=<token>
 *
 * Auth-gated audio proxy. Verifies the short-lived, bucket-scoped token,
 * then 302-redirects to a freshly-minted signed Storage URL (the CDN
 * serves the bytes — no proxying through our server). The real file URL is
 * never persistent or shareable: it expires in an hour and a missing/bad/
 * cross-scope token is rejected. Buckets are allowlisted.
 */
const SIGNED_URL_TTL_SEC = 60 * 60; // 1 hour — covers a full playback

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (!path || path.length < 2) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const bucket = path[0];
  const filePath = path.slice(1).join('/');
  if (!AUDIO_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const token = req.nextUrl.searchParams.get('t');
  if (!verifyAudioToken(token, bucket)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(filePath, SIGNED_URL_TTL_SEC);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  /* 302 so the browser's <audio> follows to the signed URL and does its
     Range requests against the CDN directly. no-store so the ephemeral
     redirect target isn't cached past its lifetime. */
  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: { 'Cache-Control': 'no-store' },
  });
}
