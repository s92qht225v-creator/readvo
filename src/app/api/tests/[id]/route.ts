import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import { normalizeTestTheme } from '@/lib/test/theme';

async function authorize(req: NextRequest, id: string) {
  const userId = await getRequestUserId(req);
  if (!userId) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  const { data: test } = await admin
    .from('tests').select('*').eq('id', id).maybeSingle();
  if (!test) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  if (test.owner_id !== userId) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { admin, userId, test };
}

/** GET /api/tests/[id] — full test + ordered questions + ordered sections */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;

  const [{ data: questions }, { data: sections }] = await Promise.all([
    auth.admin.from('test_questions').select('*').eq('test_id', id).order('position', { ascending: true }),
    auth.admin.from('test_sections').select('*').eq('test_id', id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  return NextResponse.json({ test: auth.test, questions: questions ?? [], sections: sections ?? [] });
}

/** PATCH /api/tests/[id] — update metadata, screens, grading */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null) as {
    title?: string;
    description?: string;
    theme?: unknown;
    welcome_screen?: unknown;
    end_screen?: unknown;
    timer_enabled?: boolean;
    time_limit_seconds?: number | null;
    layout?: 'card' | 'scroll';
    listening_audio_url?: string | null;
    strict_sections?: boolean;
    is_graded?: boolean;
    is_marketplace?: boolean;
    marketplace_price?: number | null;
    marketplace_summary?: string | null;
    workspace_id?: string | null;
  } | null;
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string') patch.title = body.title.trim();
  if (typeof body.description === 'string') patch.description = body.description;
  if (body.theme !== undefined) patch.theme = normalizeTestTheme(body.theme);
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

  /* Presentation mode + listening audio (scroll-mode exams). */
  if (body.layout === 'card' || body.layout === 'scroll') patch.layout = body.layout;
  if (body.listening_audio_url === null) {
    patch.listening_audio_url = null;
  } else if (typeof body.listening_audio_url === 'string') {
    patch.listening_audio_url = body.listening_audio_url.slice(0, 1000);
  }
  /* Forward-only / play-once toggle for sectioned listening exams. */
  if (typeof body.strict_sections === 'boolean') patch.strict_sections = body.strict_sections;

  /* Marketplace flag + price + summary. Owner-gated only — any test
     owner can flag their own test for sale. The marketplace tab is
     intended for admin-curated content; if teachers start abusing it,
     add an explicit admin check here. */
  if (typeof body.is_marketplace === 'boolean') patch.is_marketplace = body.is_marketplace;
  if (body.marketplace_price === null) {
    patch.marketplace_price = null;
  } else if (typeof body.marketplace_price === 'number') {
    const price = Math.round(body.marketplace_price);
    if (!Number.isFinite(price) || price < 0 || price > 100_000_000) {
      return NextResponse.json({ error: 'invalid_price' }, { status: 400 });
    }
    patch.marketplace_price = price;
  }
  if (body.marketplace_summary === null) {
    patch.marketplace_summary = null;
  } else if (typeof body.marketplace_summary === 'string') {
    patch.marketplace_summary = body.marketplace_summary.slice(0, 500);
  }

  /* Move test between workspaces. null = default bucket. A non-null
     target must be a workspace owned by the same user. */
  if (body.workspace_id === null) {
    patch.workspace_id = null;
  } else if (typeof body.workspace_id === 'string') {
    const { data: ws } = await auth.admin
      .from('test_workspaces')
      .select('id')
      .eq('id', body.workspace_id)
      .eq('owner_id', auth.userId)
      .maybeSingle();
    if (!ws) return NextResponse.json({ error: 'invalid_workspace' }, { status: 400 });
    patch.workspace_id = body.workspace_id;
  }

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
