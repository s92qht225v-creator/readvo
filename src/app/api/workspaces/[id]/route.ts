import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** PATCH /api/workspaces/[id] — rename and/or reorder a workspace. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as { name?: string; position?: number } | null;
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const patch: { name?: string; position?: number } = {};
  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 });
    if (name.length > 60) return NextResponse.json({ error: 'name_too_long' }, { status: 400 });
    patch.name = name;
  }
  if (typeof body.position === 'number' && Number.isFinite(body.position)) {
    patch.position = Math.max(0, Math.round(body.position));
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('test_workspaces')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', userId)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ workspace: data });
}

/** DELETE /api/workspaces/[id] — delete a workspace.
 *
 * Tests in it are NOT deleted: the FK is `on delete set null`, so they
 * fall back to the default (null) workspace bucket. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('test_workspaces')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
