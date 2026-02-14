import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function getUserFromCookie(request: NextRequest) {
  const cookie = request.cookies.get('readvo-user');
  if (!cookie) return null;
  try {
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

/** GET: Fetch user's progress */
export async function GET(request: NextRequest) {
  const user = getUserFromCookie(request);
  if (!user) {
    return NextResponse.json({ progress: [] });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('user_progress')
    .select('lesson_id, page_num, completed, last_visited_at')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

/** POST: Mark a lesson page as visited */
export async function POST(request: NextRequest) {
  const user = getUserFromCookie(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { lesson_id, page_num } = await request.json();
  if (!lesson_id || !page_num) {
    return NextResponse.json({ error: 'Missing lesson_id or page_num' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('user_progress')
    .upsert({
      user_id: user.id,
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
