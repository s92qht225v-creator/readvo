import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';

/** GET /api/tests/[id]/responses — teacher's response list with answers */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: test } = await admin.from('tests').select('owner_id').eq('id', id).maybeSingle();
  if (!test) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (test.owner_id !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: responses, error } = await admin
    .from('test_responses')
    .select('*')
    .eq('test_id', id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const responseIds = (responses ?? []).map(r => r.id);
  let answers: Array<{ response_id: string; question_id: string; value: unknown; is_correct: boolean | null }> = [];
  if (responseIds.length > 0) {
    const res = await admin
      .from('test_answers')
      .select('response_id, question_id, value, is_correct')
      .in('response_id', responseIds);
    answers = res.data ?? [];
  }

  return NextResponse.json({ responses: responses ?? [], answers });
}
