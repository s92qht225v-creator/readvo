import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import { generateUniqueSlug } from '@/lib/test/slug';
import { enforceFreePublishLimit } from '@/lib/test/quota';

/** GET /api/tests — list current teacher's tests (newest first).
 *
 * Side-effect: enforces the free-tier published cap before returning.
 * If a former subscriber lands on the dashboard and has multiple
 * published tests, all but the most-recently-published are quietly
 * unpublished (drafts kept, nothing deleted). Idempotent + no-op for
 * subscribers. */
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();

  await enforceFreePublishLimit(userId, admin);

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

  /* Drafts are unlimited on free tier — the cap is on published tests
     and lives in POST /api/tests/[id]/publish. */

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
