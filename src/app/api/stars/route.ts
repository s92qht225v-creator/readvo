import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';

/**
 * Star progress API — stores per-section star ratings (0-3).
 *
 * Table: `star_progress`
 *   user_id      UUID  (FK → auth.users)
 *   section_type TEXT  (e.g. 'grammar', 'speaking', 'writing')
 *   section_id   TEXT  (e.g. 'shi', 'hsk1-set1', 'lesson3-page2')
 *   stars        INT   (0-3)
 *   completed_at TIMESTAMPTZ
 *   PRIMARY KEY (user_id, section_type, section_id)
 */

/** GET: Fetch all star progress for the user (optionally filter by section_type) */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ stars: [] });
  }

  const userId = getUserIdFromJWT(token);
  if (!userId) {
    return NextResponse.json({ stars: [] });
  }

  const admin = getSupabaseAdmin();
  const sectionType = request.nextUrl.searchParams.get('type');

  let query = admin
    .from('star_progress')
    .select('section_type, section_id, stars, completed_at')
    .eq('user_id', userId);

  if (sectionType) {
    query = query.eq('section_type', sectionType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ stars: data });
}

/** POST: Save star rating for a section */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = getUserIdFromJWT(token);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { section_type, section_id, stars } = await request.json();

  if (!section_type || !section_id || stars == null) {
    return NextResponse.json({ error: 'Missing section_type, section_id, or stars' }, { status: 400 });
  }

  if (typeof stars !== 'number' || stars < 0 || stars > 3) {
    return NextResponse.json({ error: 'Stars must be 0-3' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('star_progress')
    .upsert({
      user_id: userId,
      section_type,
      section_id,
      stars,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,section_type,section_id' });

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
