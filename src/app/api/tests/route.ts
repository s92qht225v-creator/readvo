import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import { generateUniqueSlug } from '@/lib/test/slug';
import { FREE_TEST_LIMIT, checkFreeQuota } from '@/lib/test/quota';

/** GET /api/tests — list current teacher's tests (newest first) */
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('tests')
    .select('*')
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tests: data ?? [] });
}

/** POST /api/tests — create a new test (drafts only; publishing is separate) */
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { title?: string; description?: string; is_graded?: boolean } | null;
  const title = body?.title?.trim();
  if (!title) return NextResponse.json({ error: 'title_required' }, { status: 400 });

  const admin = getSupabaseAdmin();

  const quota = await checkFreeQuota(userId, admin);
  if (quota.isOverLimit) {
    return NextResponse.json(
      { error: 'free_limit_reached', limit: FREE_TEST_LIMIT, current: quota.totalCount },
      { status: 402 },
    );
  }

  const slug = await generateUniqueSlug(async (s) => {
    const { data } = await admin.from('tests').select('id').eq('slug', s).maybeSingle();
    return !!data;
  });

  const { data, error } = await admin
    .from('tests')
    .insert({
      owner_id: userId,
      slug,
      title,
      description: body?.description ?? '',
      is_graded: !!body?.is_graded,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ test: data }, { status: 201 });
}
