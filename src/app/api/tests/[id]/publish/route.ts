import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

const FREE_PUBLISH_LIMIT = 3;

/**
 * POST /api/tests/[id]/publish — body { is_published: boolean }
 * - Free-tier limit only enforced on false→true transitions
 * - Excludes the current test from the published count
 * - Sets published_at on first publish only
 * - Existing Blim subscribers bypass the limit
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

  // No paywall check on unpublish or no-op
  if (!isPublishing) {
    const patch: Record<string, unknown> = { is_published: body.is_published };
    const { data, error } = await admin.from('tests').update(patch).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ test: data });
  }

  // Free-tier check (transition false → true)
  const [{ count }, { data: sub }] = await Promise.all([
    admin
      .from('tests')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('is_published', true)
      .neq('id', id),
    admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .gt('ends_at', new Date().toISOString())
      .maybeSingle(),
  ]);

  if ((count ?? 0) >= FREE_PUBLISH_LIMIT && !sub) {
    return NextResponse.json(
      { error: 'free_limit_reached', limit: FREE_PUBLISH_LIMIT },
      { status: 402 },
    );
  }

  const patch: Record<string, unknown> = { is_published: true };
  if (!current.published_at) patch.published_at = new Date().toISOString();

  const { data, error } = await admin.from('tests').update(patch).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ test: data });
}
