import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

/* Joint ownership guard: the requester must own the parent test AND
   the section must belong to that test. Returns the section row so
   callers don't refetch. */
async function authorize(req: NextRequest, testId: string, sectionId: string) {
  const userId = await getRequestUserId(req);
  if (!userId) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  const { data: test } = await admin.from('tests').select('id, owner_id').eq('id', testId).maybeSingle();
  if (!test) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  if (test.owner_id !== userId) return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  const { data: section } = await admin
    .from('test_sections')
    .select('*')
    .eq('id', sectionId)
    .eq('test_id', testId)
    .maybeSingle();
  if (!section) return { error: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  return { admin, userId, test, section };
}

/** PATCH /api/tests/[id]/sections/[sectionId] — update title, audio_url
 *  and/or position. Send only the fields you want to change. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const { id, sectionId } = await params;
  const auth = await authorize(req, id, sectionId);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null) as {
    title?: string;
    audio_url?: string | null;
    position?: number;
  } | null;
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string') patch.title = body.title.slice(0, 200);
  if (body.audio_url === null) {
    patch.audio_url = null;
  } else if (typeof body.audio_url === 'string') {
    patch.audio_url = body.audio_url.slice(0, 1000);
  }
  if (typeof body.position === 'number' && Number.isFinite(body.position)) {
    patch.position = Math.max(0, Math.floor(body.position));
  }

  const { data, error } = await auth.admin
    .from('test_sections')
    .update(patch)
    .eq('id', sectionId)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section: data });
}

/** DELETE /api/tests/[id]/sections/[sectionId] — remove the section.
 *  `on delete set null` on `test_questions.section_id` moves the
 *  section's questions back to unsectioned (preserved, not destroyed). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; sectionId: string }> }) {
  const { id, sectionId } = await params;
  const auth = await authorize(req, id, sectionId);
  if (auth.error) return auth.error;

  const { error } = await auth.admin.from('test_sections').delete().eq('id', sectionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
