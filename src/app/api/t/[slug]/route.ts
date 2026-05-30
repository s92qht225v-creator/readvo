import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sanitizeQuestion } from '@/lib/test/sanitize';
import type { TestQuestion, PublicTest } from '@/lib/test/types';

/**
 * GET /api/t/[slug] — public-facing test fetch. NEVER returns answer keys.
 * Only returns published tests.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6}$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  /* Per-respondent shuffle seed: when provided, randomized choices/tiles
     shuffle differently for each test-taker (stable across reloads of
     the same session because the seed is persisted in test_responses
     and replayed by the client from localStorage). Without a seed the
     legacy stable shuffle applies. */
  const seedParam = req.nextUrl.searchParams.get('seed') ?? undefined;
  const seed = seedParam && /^[a-zA-Z0-9_-]{8,64}$/.test(seedParam) ? seedParam : undefined;

  const admin = getSupabaseAdmin();
  const { data: test } = await admin
    .from('tests')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!test || !test.is_published) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const [{ data: questions }, { data: sections }] = await Promise.all([
    admin
      .from('test_questions')
      .select('*')
      .eq('test_id', test.id)
      .order('position', { ascending: true }),
    admin
      .from('test_sections')
      .select('id, position, title, audio_url')
      .eq('test_id', test.id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  /* Branding gate — show "Made with Blim" unless the owner is an
     active subscriber AND has explicitly turned it off in Settings.
     Free users always show it (can't hide); subscribers see it by
     default but get the toggle as a paid perk. */
  let showBranding = true;
  if (test.owner_id) {
    const [{ data: sub }, { data: settings }] = await Promise.all([
      admin.from('subscriptions').select('ends_at').eq('user_id', test.owner_id)
        .gt('ends_at', new Date().toISOString()).maybeSingle(),
      admin.from('user_settings').select('hide_branding').eq('user_id', test.owner_id).maybeSingle(),
    ]);
    if (sub && settings?.hide_branding) showBranding = false;
  }

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
    layout: test.layout === 'scroll' ? 'scroll' : 'card',
    listening_audio_url: test.listening_audio_url ?? null,
    strict_sections: !!test.strict_sections,
    sections: (sections ?? []).map(s => ({
      id: s.id as string,
      position: s.position as number,
      title: (s.title as string) ?? '',
      audio_url: (s.audio_url as string | null) ?? null,
    })),
    is_graded: test.is_graded,
    questions: (questions ?? [])
      .filter((q: TestQuestion) => !q.hidden)
      .map((q: TestQuestion) => {
        const sanitized = sanitizeQuestion(q, seed);
        /* Preserve section_id on the public question so the player
           can group questions by section. sanitizeQuestion only
           sanitizes answer keys; section_id is non-secret metadata. */
        return { ...sanitized, section_id: q.section_id ?? null };
      }),
    show_branding: showBranding,
  };

  return NextResponse.json({ test: publicTest });
}
