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

  const tests = data ?? [];

  /* Attach completed-response counts. One query against test_responses
     filtered by the teacher's test ids; tallied in JS so we don't need
     a Postgres group-by RPC. Empty for users with no tests. */
  const testIds = tests.map(t => t.id);
  const counts = new Map<string, number>();
  if (testIds.length > 0) {
    const { data: rows } = await admin
      .from('test_responses')
      .select('test_id')
      .in('test_id', testIds)
      .not('completed_at', 'is', null);
    for (const row of rows ?? []) {
      counts.set(row.test_id, (counts.get(row.test_id) ?? 0) + 1);
    }
  }
  const testsWithCounts = tests.map(t => ({ ...t, response_count: counts.get(t.id) ?? 0 }));

  return NextResponse.json({ tests: testsWithCounts });
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
