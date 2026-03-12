import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getUserIdFromJWT } from '@/lib/jwt';

/** GET: Fetch user's progress */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ progress: [] });
  }

  const userId = getUserIdFromJWT(token);
  if (!userId) {
    return NextResponse.json({ progress: [] });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_progress')
    .select('lesson_id, page_num, completed, last_visited_at')
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

/** POST: Mark a lesson page as visited */
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

  const { lesson_id, page_num } = await request.json();
  if (!lesson_id || !page_num) {
    return NextResponse.json({ error: 'Missing lesson_id or page_num' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id,
      page_num,
      completed: true,
      last_visited_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id,page_num' });

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
