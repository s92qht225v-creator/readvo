import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sanitizeQuestion } from '@/lib/test/sanitize';
import type { TestQuestion, PublicTest } from '@/lib/test/types';

/**
 * GET /api/t/[slug] — public-facing test fetch. NEVER returns answer keys.
 * Only returns published tests.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6}$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const admin = getSupabaseAdmin();
  const { data: test } = await admin
    .from('tests')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!test || !test.is_published) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { data: questions } = await admin
    .from('test_questions')
    .select('*')
    .eq('test_id', test.id)
    .order('position', { ascending: true });

  const publicTest: PublicTest = {
    id: test.id,
    slug: test.slug,
    title: test.title,
    description: test.description,
    theme: test.theme,
    welcome_screen: test.welcome_screen,
    end_screen: test.end_screen,
    timer_enabled: !!test.timer_enabled,
    time_limit_seconds: test.time_limit_seconds,
    is_graded: test.is_graded,
    questions: (questions ?? []).map((q: TestQuestion) => sanitizeQuestion(q)),
  };

  return NextResponse.json({ test: publicTest });
}
