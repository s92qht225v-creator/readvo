import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { loadArabicDialogue } from '@/services/arabicContent';

const LEVELS = new Set(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ level: string; slug: string }> },
) {
  const { level, slug } = await params;
  if (!LEVELS.has(level) || !/^[\w-]+$/.test(slug)) {
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

  const dialogue = loadArabicDialogue(level, slug);
  if (!dialogue) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ dialogue }, { headers: { 'Cache-Control': 'no-store, private' } });
}
