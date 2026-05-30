import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

/* Ownership guard mirrors `tests/[id]/route.ts` — the requester must own
   the parent test. Returns the admin client + the test row on success. */
async function authorize(req: NextRequest, testId: string) {
  const userId = await getRequestUserId(req);
  if (!userId) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  const { data: test } = await admin.from('tests').select('id, owner_id').eq('id', testId).maybeSingle();
  if (!test) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  if (test.owner_id !== userId) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  return { admin, userId, test };
}

/** GET /api/tests/[id]/sections — list this test's sections (ordered).
 *  Owner-only; the public player gets sections via /api/t/[slug]. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;

  const { data, error } = await auth.admin
    .from('test_sections')
    .select('*')
    .eq('test_id', id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sections: data ?? [] });
}

/** POST /api/tests/[id]/sections — create a section.
 *  Body: { title?: string; audio_url?: string | null; position?: number }
 *  New section appends to the end by default. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorize(req, id);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null) as {
    title?: string;
    audio_url?: string | null;
    position?: number;
  } | null;

  const title = (body?.title ?? '').toString().slice(0, 200);
  const audioUrl = typeof body?.audio_url === 'string' ? body.audio_url.slice(0, 1000) : null;

  /* Append: position = current max + 1. */
  let position: number;
  if (typeof body?.position === 'number' && Number.isFinite(body.position)) {
    position = Math.max(0, Math.floor(body.position));
  } else {
    const { data: existing } = await auth.admin
      .from('test_sections')
      .select('position')
      .eq('test_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    position = ((existing?.position as number | undefined) ?? -1) + 1;
  }

  const { data, error } = await auth.admin
    .from('test_sections')
    .insert({ test_id: id, title, audio_url: audioUrl, position })
    .select('*')
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'create_failed' }, { status: 500 });
  return NextResponse.json({ section: data }, { status: 201 });
}
