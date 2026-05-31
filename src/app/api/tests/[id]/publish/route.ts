import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import { FREE_PUBLISHED_LIMIT, checkPublishQuota } from '@/lib/test/quota';

/**
 * POST /api/tests/[id]/publish — body { is_published: boolean }
 *
 * Free-tier rule: 1 published test at a time. Drafts unlimited.
 * Subscribers bypass. Enforced here on false→true transitions only.
 *
 * Also:
 *   - requires ≥1 question on first publish
 *   - sets published_at on first publish (preserved on later toggles)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { is_published?: boolean } | null;
  if (!body || typeof body.is_published !== 'boolean') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: current } = await admin
    .from('tests')
    .select('is_published, owner_id, published_at')
    .eq('id', id).maybeSingle();
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (current.owner_id !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const isPublishing = body.is_published === true && current.is_published === false;

  // Unpublish or no-op: just update.
  if (!isPublishing) {
    const patch: Record<string, unknown> = { is_published: body.is_published };
    const { data, error } = await admin.from('tests').update(patch).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ test: data });
  }

  const { count: questionCount, error: questionCountError } = await admin
    .from('test_questions')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', id);
  if (questionCountError) {
    return NextResponse.json({ error: questionCountError.message }, { status: 500 });
  }
  if ((questionCount ?? 0) === 0) {
    return NextResponse.json(
      { error: 'Add at least one question before publishing.' },
      { status: 400 },
    );
  }

  /* Hard Pro-gate: speaking questions require an active subscription.
     Runs on first publish only (false→true). */
  const { count: speakingCount, error: speakingCountError } = await admin
    .from('test_questions')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', id)
    .eq('type', 'speaking');
  if (speakingCountError) {
    return NextResponse.json({ error: speakingCountError.message }, { status: 500 });
  }
  if ((speakingCount ?? 0) > 0) {
    const { data: sub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', current.owner_id)
      .gt('ends_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (!sub) {
      return NextResponse.json({ error: 'speaking_requires_pro' }, { status: 402 });
    }
  }

  /* Free-tier published cap. Exclude this test from the count so a
     re-publish of the same row never trips it. */
  const quota = await checkPublishQuota(userId, admin, id);
  if (quota.isOverLimit) {
    return NextResponse.json(
      {
        error: 'free_publish_limit_reached',
        limit: FREE_PUBLISHED_LIMIT,
        current: quota.publishedCount,
      },
      { status: 402 },
    );
  }

  const patch: Record<string, unknown> = { is_published: true };
  if (!current.published_at) patch.published_at = new Date().toISOString();

  const { data, error } = await admin.from('tests').update(patch).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ test: data });
}
