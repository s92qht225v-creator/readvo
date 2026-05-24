import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Free-tier total test cap. Counts every test the user owns — published
 * OR draft — so a free account is limited to a single test of any state.
 * Existing Blim subscribers bypass the cap.
 */
export const FREE_TEST_LIMIT = 1;

export type FreeQuotaStatus = {
  totalCount: number;
  hasSubscription: boolean;
  isOverLimit: boolean;
};

/**
 * Returns the user's current test count, subscription status, and a
 * derived flag for whether creating one more test would exceed the
 * free-tier cap.
 *
 * Call this in any endpoint that creates a new test row:
 *   - POST /api/tests
 *   - POST /api/tests/[id]/duplicate
 *
 * Return 402 `free_limit_reached` if `isOverLimit` is true.
 */
export async function checkFreeQuota(
  userId: string,
  admin: SupabaseClient,
): Promise<FreeQuotaStatus> {
  const [{ count }, { data: sub }] = await Promise.all([
    admin
      .from('tests')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId),
    admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .gt('ends_at', new Date().toISOString())
      .maybeSingle(),
  ]);
  const totalCount = count ?? 0;
  const hasSubscription = !!sub;
  return {
    totalCount,
    hasSubscription,
    isOverLimit: totalCount >= FREE_TEST_LIMIT && !hasSubscription,
  };
}
