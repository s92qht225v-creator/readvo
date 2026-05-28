import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

type Settings = { hide_branding: boolean; notify_on_response: boolean };

const DEFAULTS: Settings = { hide_branding: false, notify_on_response: false };

/** GET /api/settings — current user's preferences (defaults if no row). */
export async function GET(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('user_settings')
    .select('hide_branding, notify_on_response')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({ settings: { ...DEFAULTS, ...(data ?? {}) } });
}

/** PATCH /api/settings — upsert preferences. Only the provided keys
 *  change; unspecified keys keep their stored value. */
export async function PATCH(req: NextRequest) {
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null) as Partial<Settings> | null;
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const patch: Partial<Settings> = {};
  if (typeof body.hide_branding === 'boolean') patch.hide_branding = body.hide_branding;
  if (typeof body.notify_on_response === 'boolean') patch.notify_on_response = body.notify_on_response;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('user_settings')
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select('hide_branding, notify_on_response')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: { ...DEFAULTS, ...(data ?? {}) } });
}
