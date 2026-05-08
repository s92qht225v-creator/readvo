import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getRequestUserId } from '@/lib/test/devAuth';
import { generateUniqueSlug } from '@/lib/test/slug';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getRequestUserId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { data: original, error: originalError } = await admin
    .from('tests')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (originalError) return NextResponse.json({ error: originalError.message }, { status: 500 });
  if (!original) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (original.owner_id !== userId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const slug = await generateUniqueSlug(async (candidate) => {
    const { data } = await admin.from('tests').select('id').eq('slug', candidate).maybeSingle();
    return !!data;
  });

  const { data: copy, error: copyError } = await admin
    .from('tests')
    .insert({
      owner_id: userId,
      slug,
      title: `${original.title} copy`,
      description: original.description ?? '',
      ...('welcome_screen' in original ? { welcome_screen: original.welcome_screen ?? { enabled: false } } : {}),
      ...('end_screen' in original ? { end_screen: original.end_screen ?? { enabled: false } } : {}),
      ...('timer_enabled' in original ? { timer_enabled: !!original.timer_enabled } : {}),
      ...('time_limit_seconds' in original ? { time_limit_seconds: original.time_limit_seconds ?? null } : {}),
      is_graded: !!original.is_graded,
      is_published: false,
    })
    .select('*')
    .single();

  if (copyError) return NextResponse.json({ error: copyError.message }, { status: 500 });

  const { data: questions, error: questionsError } = await admin
    .from('test_questions')
    .select('position, type, prompt, options, required')
    .eq('test_id', id)
    .order('position', { ascending: true });

  if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 500 });

  if (questions?.length) {
    const { error: insertError } = await admin
      .from('test_questions')
      .insert(questions.map(q => ({
        test_id: copy.id,
        position: q.position,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        required: q.required,
      })));

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ test: copy }, { status: 201 });
}
