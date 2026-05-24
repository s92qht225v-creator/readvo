import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Free-tier rule: **1 published test at a time**, unlimited drafts.
 *
 * Why this model:
 *   - Cheap, friendly UX — users keep their full library as drafts,
 *     no data-loss anxiety.
 *   - Conversion gate sits on simultaneous published URLs (multiple
 *     parallel classes), not on raw test count.
 *   - Users can rotate manually (unpublish current, publish another)
 *     without paying — but the convenience itself is the upsell.
 *
 * Enforcement points:
 *   - POST /api/tests/[id]/publish: blocks false→true if user is at
 *     the cap with no active subscription.
 *   - GET /api/tests: calls `enforceFreePublishLimit` which
 *     auto-unpublishes extras when a former subscriber drops back to
 *     free tier with multiple published tests. The most recently
 *     published one stays live; the rest become drafts (nothing
 *     deleted).
 *
 * Subscribers bypass everything.
 */
export const FREE_PUBLISHED_LIMIT = 1;

export type PublishQuotaStatus = {
  publishedCount: number;
  hasSubscription: boolean;
  isOverLimit: boolean;
};

/**
 * Count user's currently-published tests + check for active sub.
 * Use to decide whether to allow a new publish.
 */
export async function checkPublishQuota(
  userId: string,
  admin: SupabaseClient,
  excludeTestId?: string,
): Promise<PublishQuotaStatus> {
  const publishedQuery = admin
    .from('tests')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('is_published', true);
  if (excludeTestId) publishedQuery.neq('id', excludeTestId);

  const [{ count }, { data: sub }] = await Promise.all([
    publishedQuery,
    admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .gt('ends_at', new Date().toISOString())
      .maybeSingle(),
  ]);

  const publishedCount = count ?? 0;
  const hasSubscription = !!sub;
  return {
    publishedCount,
    hasSubscription,
    isOverLimit: publishedCount >= FREE_PUBLISHED_LIMIT && !hasSubscription,
  };
}

/**
 * If user is over the free-tier published cap AND has no subscription
 * (typical scenario: ex-subscriber whose sub just expired),
 * auto-unpublish all but the most-recently-published test. Idempotent
 * and a no-op for subscribers.
 *
 * Called from GET /api/tests so the dashboard always shows a
 * consistent state when a teacher lands on it.
 */
export async function enforceFreePublishLimit(
  userId: string,
  admin: SupabaseClient,
): Promise<void> {
  // Bail early for subscribers.
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .gt('ends_at', new Date().toISOString())
    .maybeSingle();
  if (sub) return;

  const { data: published } = await admin
    .from('tests')
    .select('id, published_at')
    .eq('owner_id', userId)
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false });
  if (!published || published.length <= FREE_PUBLISHED_LIMIT) return;

  // Keep the most-recently-published FREE_PUBLISHED_LIMIT tests live;
  // unpublish the rest. Don't touch published_at — preserves the
  // "first published on" record for analytics / republish ordering.
  const toUnpublish = published.slice(FREE_PUBLISHED_LIMIT).map(t => t.id);
  await admin
    .from('tests')
    .update({ is_published: false })
    .in('id', toUnpublish);
}
