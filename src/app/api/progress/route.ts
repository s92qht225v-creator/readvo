import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseWithAuth(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Get the access token from the Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return null;

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  return supabase;
}

/** GET: Fetch user's progress */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseWithAuth(request);
  if (!supabase) {
    return NextResponse.json({ progress: [] });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ progress: [] });
  }

  const { data, error } = await supabase
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
  const supabase = getSupabaseWithAuth(request);
  if (!supabase) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { lesson_id, page_num } = await request.json();
  if (!lesson_id || !page_num) {
    return NextResponse.json({ error: 'Missing lesson_id or page_num' }, { status: 400 });
  }

  const { error } = await supabase
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
