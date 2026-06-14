// src/lib/entitlement.ts
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const TRIAL_DAYS = 7;
const MS_PER_DAY = 86_400_000;

/** Pure: is the 7-day trial still active given signup time and "now" (ms)? */
export function isWithinTrialWindow(createdAtMs: number, nowMs: number): boolean {
  if (!Number.isFinite(createdAtMs)) return false;
  return createdAtMs + TRIAL_DAYS * MS_PER_DAY > nowMs;
}

export interface Entitlement {
  entitled: boolean;
}

/**
 * Server-side source of truth for "can this user access paid content".
 * Authoritative — never trusts the client. Subscription is checked first
 * (one indexed query); the trial fallback (needs auth.users.created_at via a
 * remote getUserById) runs only when there is no active subscription. Any
 * error fails closed (entitled: false).
 */
export async function resolveEntitlement(userId: string): Promise<Entitlement> {
  if (!userId) return { entitled: false };

  try {
    const admin = getSupabaseAdmin();
    const now = new Date();

    // 1. Active subscription?
    const { data: sub, error: subError } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .gt('ends_at', now.toISOString())
      .limit(1)
      .maybeSingle();
    if (subError) return { entitled: false };
    if (sub) return { entitled: true };

    // 2. Trial still active? (needs signup time from the auth user)
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.created_at) return { entitled: false };
    const createdAtMs = new Date(data.user.created_at).getTime();
    return { entitled: isWithinTrialWindow(createdAtMs, now.getTime()) };
  } catch {
    return { entitled: false };
  }
}
