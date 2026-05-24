import type { SupabaseClient } from '@supabase/supabase-js';
import { generateUniqueSlug } from './slug';
import { normalizeQuestionOptionsMedia } from './media';
import type { QuestionType } from './types';

/**
 * Duplicate a marketplace source test into the buyer's workspace.
 *
 * Mirrors POST /api/tests/[id]/duplicate but:
 *   - The buyer (not the source owner) becomes the new test's owner.
 *   - The copy is always created as a draft (is_published: false).
 *   - The title is preserved verbatim (no " copy" suffix) since the
 *     buyer is acquiring, not duplicating their own.
 *
 * Called from POST /api/admin when an admin approves a payment_request
 * with `kind = 'marketplace_test'`. Returns the new test row or null
 * on failure (caller logs the reason).
 */
export async function copyMarketplaceTestToBuyer(
  admin: SupabaseClient,
  sourceTestId: string,
  buyerId: string,
): Promise<{ id: string; slug: string } | null> {
  const { data: source, error: sourceErr } = await admin
    .from('tests')
    .select('*')
    .eq('id', sourceTestId)
    .maybeSingle();
  if (sourceErr || !source) {
    console.error('marketplace copy: source not found', sourceTestId, sourceErr);
    return null;
  }

  const slug = await generateUniqueSlug(async candidate => {
    const { data } = await admin.from('tests').select('id').eq('slug', candidate).maybeSingle();
    return !!data;
  });

  const { data: copy, error: copyErr } = await admin
    .from('tests')
    .insert({
      owner_id: buyerId,
      slug,
      title: source.title,
      description: source.description ?? '',
      ...('theme' in source ? { theme: source.theme ?? {} } : {}),
      ...('welcome_screen' in source ? { welcome_screen: source.welcome_screen ?? { enabled: false } } : {}),
      ...('end_screen' in source ? { end_screen: source.end_screen ?? { enabled: false } } : {}),
      ...('timer_enabled' in source ? { timer_enabled: !!source.timer_enabled } : {}),
      ...('time_limit_seconds' in source ? { time_limit_seconds: source.time_limit_seconds ?? null } : {}),
      is_graded: !!source.is_graded,
      is_published: false,
      /* The copy is NOT a marketplace listing itself — only the
         source is. Leave is_marketplace at its default false. */
    })
    .select('id, slug')
    .single();
  if (copyErr || !copy) {
    console.error('marketplace copy: insert failed', copyErr);
    return null;
  }

  const { data: questions, error: qErr } = await admin
    .from('test_questions')
    .select('position, type, prompt, options, required')
    .eq('test_id', sourceTestId)
    .order('position', { ascending: true });
  if (qErr) {
    console.error('marketplace copy: questions fetch failed', qErr);
    return null;
  }

  if (questions?.length) {
    const { error: insertErr } = await admin
      .from('test_questions')
      .insert(questions.map(q => ({
        test_id: copy.id,
        position: q.position,
        type: q.type,
        prompt: q.prompt,
        options: normalizeQuestionOptionsMedia(q.type as QuestionType, q.options ?? {}),
        required: q.required,
      })));
    if (insertErr) {
      console.error('marketplace copy: questions insert failed', insertErr);
      return null;
    }
  }

  return copy;
}
