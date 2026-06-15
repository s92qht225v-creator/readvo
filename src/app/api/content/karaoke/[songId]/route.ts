// src/app/api/content/karaoke/[songId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { loadKaraokeSong } from '@/services/karaoke';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> },
) {
  const { songId } = await params;
  if (!/^[\w-]+$/.test(songId)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) {
    return NextResponse.json({ locked: true }, { status: 401 });
  }

  const { entitled } = await resolveEntitlement(userId);
  if (!entitled) {
    return NextResponse.json({ locked: true }, { status: 402 });
  }

  const song = await loadKaraokeSong(songId);
  if (!song) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ song }, { headers: { 'Cache-Control': 'no-store, private' } });
}
