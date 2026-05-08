import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import type { QuestionType } from '@/lib/test/types';

interface IncomingQuestion {
  id?: string;
  type: QuestionType;
  prompt: string;
  options?: Record<string, unknown>;
  required?: boolean;
}

/**
 * PUT /api/tests/[id]/questions
 * Body: { questions: IncomingQuestion[] } — full ordered list.
 * Preserves existing question IDs so submitted answers keep matching stats.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: test } = await admin.from('tests').select('owner_id').eq('id', id).maybeSingle();
  if (!test) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (test.owner_id !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null) as { questions?: IncomingQuestion[] } | null;
  if (!body || !Array.isArray(body.questions)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const ALLOWED_TYPES: ReadonlySet<QuestionType> = new Set([
    'multiple_choice', 'short_text', 'long_answer', 'number', 'dropdown',
    'checkbox', 'opinion_scale', 'rating', 'picture_choice',
    'true_false', 'match', 'ordering', 'fill_blanks',
  ]);
  // Validate each question minimally before deleting existing rows.
  for (const q of body.questions) {
    if (!ALLOWED_TYPES.has(q.type)) {
      return NextResponse.json(
        { error: `Unsupported question type: ${q.type}` },
        { status: 400 },
      );
    }
    const prompt = (q.prompt ?? '').toString().trim();
    if (!prompt) {
      return NextResponse.json(
        { error: 'Question prompt is required' },
        { status: 400 },
      );
    }
  }

  const { data: existingQuestions, error: existingErr } = await admin
    .from('test_questions')
    .select('id')
    .eq('test_id', id);
  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

  const existingIds = new Set((existingQuestions ?? []).map(q => q.id as string));
  const keptIds = new Set<string>();
  const rows = body.questions.map((q, i) => {
    const prompt = (q.prompt ?? '').toString().trim();
    const existingId = typeof q.id === 'string' && isUuid(q.id) && existingIds.has(q.id)
      ? q.id
      : undefined;
    if (existingId) keptIds.add(existingId);
    return {
      ...(existingId ? { id: existingId } : {}),
      test_id: id,
      position: i,
      type: q.type,
      prompt,
      options: q.options ?? {},
      required: q.required ?? true,
    };
  });

  const idsToDelete = [...existingIds].filter(existingId => !keptIds.has(existingId));
  if (idsToDelete.length > 0) {
    const delResult = await admin.from('test_questions').delete().in('id', idsToDelete);
    if (delResult.error) {
      return NextResponse.json({ error: delResult.error.message }, { status: 500 });
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, questions: [] });
  }

  // Move kept rows out of the way first to avoid the unique (test_id, position)
  // index colliding during reorder updates.
  for (const [offset, existingId] of [...keptIds].entries()) {
    const moveResult = await admin
      .from('test_questions')
      .update({ position: 100000 + offset })
      .eq('id', existingId);
    if (moveResult.error) {
      return NextResponse.json({ error: moveResult.error.message }, { status: 500 });
    }
  }

  const { data, error } = await admin
    .from('test_questions')
    .upsert(rows, { onConflict: 'id' })
    .select('*')
    .order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, questions: data });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
