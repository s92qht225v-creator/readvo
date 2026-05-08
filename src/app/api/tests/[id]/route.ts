import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

async function authorize(req: NextRequest, id: string) {
  const userId = getRequestUserId(req);
  if (!userId) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  const { data: test } = await admin
    .from('tests').select('*').eq('id', id).maybeSingle();
  if (!test) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  if (test.owner_id !== userId) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { admin, userId, test };
}

/** GET /api/tests/[id] — full test + ordered questions */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;

  const { data: questions } = await auth.admin
    .from('test_questions').select('*').eq('test_id', id).order('position', { ascending: true });

  return NextResponse.json({ test: auth.test, questions: questions ?? [] });
}

/** PATCH /api/tests/[id] — update metadata, screens, grading */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null) as {
    title?: string;
    description?: string;
    welcome_screen?: unknown;
    end_screen?: unknown;
    timer_enabled?: boolean;
    time_limit_seconds?: number | null;
    is_graded?: boolean;
  } | null;
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string') patch.title = body.title.trim();
  if (typeof body.description === 'string') patch.description = body.description;
  if (body.welcome_screen !== undefined) patch.welcome_screen = body.welcome_screen;
  if (body.end_screen !== undefined) patch.end_screen = body.end_screen;
  if (typeof body.timer_enabled === 'boolean') patch.timer_enabled = body.timer_enabled;
  if (body.time_limit_seconds === null) {
    patch.time_limit_seconds = null;
  } else if (typeof body.time_limit_seconds === 'number') {
    const seconds = Math.round(body.time_limit_seconds);
    if (!Number.isFinite(seconds) || seconds < 60 || seconds > 24 * 60 * 60) {
      return NextResponse.json({ error: 'invalid_time_limit' }, { status: 400 });
    }
    patch.time_limit_seconds = seconds;
  }
  if (typeof body.is_graded === 'boolean') patch.is_graded = body.is_graded;

  const { data, error } = await auth.admin
    .from('tests').update(patch).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ test: data });
}

/** DELETE /api/tests/[id] — also cascades questions/responses/answers */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;

  const { error } = await auth.admin.from('tests').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
