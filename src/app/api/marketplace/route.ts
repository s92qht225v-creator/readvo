import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * GET /api/marketplace
 *
 * Public list of tests flagged `is_marketplace = true`. Returns a
 * trimmed shape — no question content, just enough to render a
 * catalog card (title, summary, price, slug for a preview URL).
 *
 * No auth required: anyone can browse the marketplace. The buy flow
 * (separate endpoint) requires auth.
 */
export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('tests')
    .select('id, slug, title, description, marketplace_summary, marketplace_price, owner_id, created_at')
    .eq('is_marketplace', true)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Per-test question count (one extra round-trip per test is fine here
  // because the marketplace catalog is small; revisit if it grows).
  const ids = (data ?? []).map(t => t.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: counted } = await admin
      .from('test_questions')
      .select('test_id', { count: 'exact', head: false })
      .in('test_id', ids);
    for (const row of counted ?? []) {
      counts.set(row.test_id, (counts.get(row.test_id) ?? 0) + 1);
    }
  }

  const tests = (data ?? []).map(t => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    summary: t.marketplace_summary || t.description || '',
    price: t.marketplace_price ?? 0,
    questionCount: counts.get(t.id) ?? 0,
  }));

  return NextResponse.json({ tests });
}
