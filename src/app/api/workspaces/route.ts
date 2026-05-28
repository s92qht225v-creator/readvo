import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import { FREE_WORKSPACE_LIMIT } from '@/lib/test/types';

/** GET /api/workspaces — list the current user's workspaces (ordered). */
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('test_workspaces')
    .select('*')
    .eq('owner_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workspaces: data ?? [] });
}

/** POST /api/workspaces — create a workspace.
 *
 * Free tier is capped at FREE_WORKSPACE_LIMIT (3) workspaces; active
 * subscribers are unlimited. The default 'My workspace' bucket is NOT
 * a row (it's workspace_id=null), so it doesn't count against the cap. */
export async function POST(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { name?: string } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
  if (name.length > 60) return NextResponse.json({ error: 'name_too_long' }, { status: 400 });

  const admin = getSupabaseAdmin();

  /* Free-tier cap: count existing workspaces unless the user has an
     active subscription. */
  const [{ count }, { data: sub }] = await Promise.all([
    admin.from('test_workspaces').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    admin.from('subscriptions').select('id').eq('user_id', userId).gt('ends_at', new Date().toISOString()).maybeSingle(),
  ]);
  if (!sub && (count ?? 0) >= FREE_WORKSPACE_LIMIT) {
    return NextResponse.json({ error: 'free_workspace_limit_reached', limit: FREE_WORKSPACE_LIMIT }, { status: 402 });
  }

  /* New workspaces append to the end of the list. */
  const position = count ?? 0;
  const { data, error } = await admin
    .from('test_workspaces')
    .insert({ owner_id: userId, name, position })
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'create_failed' }, { status: 500 });
  return NextResponse.json({ workspace: data }, { status: 201 });
}
