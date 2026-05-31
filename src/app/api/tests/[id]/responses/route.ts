import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import { summarizeSectionScores } from '@/lib/test/grade';
import type { TestQuestion, AnswerSubmission } from '@/lib/test/types';

/** GET /api/tests/[id]/responses — teacher's response list with answers */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: test } = await admin.from('tests').select('owner_id, is_graded').eq('id', id).maybeSingle();
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

  /* Per-response section breakdown (graded + sectioned tests). Computed
     server-side from the canonical questions/sections so answer keys never
     reach the client; covers historical responses too (nothing persisted). */
  const responsesOut = responses ?? [];
  if (test.is_graded && responsesOut.length > 0) {
    const [{ data: questionRows }, { data: sectionRows }] = await Promise.all([
      admin.from('test_questions').select('*').eq('test_id', id),
      admin.from('test_sections').select('id, title, position').eq('test_id', id),
    ]);
    if (sectionRows && sectionRows.length > 0) {
      const questions = ((questionRows ?? []) as TestQuestion[]).filter(q => !q.hidden);
      const valuesByResponse = new Map<string, Map<string, AnswerSubmission['value']>>();
      for (const a of answers) {
        let m = valuesByResponse.get(a.response_id);
        if (!m) { m = new Map(); valuesByResponse.set(a.response_id, m); }
        m.set(a.question_id, a.value as AnswerSubmission['value']);
      }
      for (const r of responsesOut as Array<Record<string, unknown>>) {
        const valueByQid = valuesByResponse.get(r.id as string) ?? new Map();
        r.section_scores = summarizeSectionScores(questions, valueByQid, sectionRows);
      }
    }
  }

  return NextResponse.json({ responses: responsesOut, answers });
}
