'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const TRIAL_DAYS = 7;

interface TrialStatus {
  daysLeft: number;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  hasSubscription: boolean;
  subscriptionDaysLeft: number;
}

export function useTrial(): TrialStatus | null {
  const { user, getAccessToken } = useAuth();
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getAccessToken();
      if (!token) { setChecked(true); return; }
      const res = await fetch('/api/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          setSubscriptionEndsAt(data.subscription.ends_at);
        }
      }
    } catch { /* ignore */ }
    setChecked(true);
  }, [user, getAccessToken]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return useMemo(() => {
    if (!user || !checked) return null;

    const createdAt = new Date(user.created_at).getTime();
    const trialEndsAt = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const msLeft = trialEndsAt - now;
    const trialDaysLeft = msLeft > 0 ? Math.ceil(msLeft / (24 * 60 * 60 * 1000)) : 0;

    let hasSubscription = false;
    let subscriptionDaysLeft = 0;

    if (subscriptionEndsAt) {
      const subEnd = new Date(subscriptionEndsAt).getTime();
      const subMsLeft = subEnd - now;
      if (subMsLeft > 0) {
        hasSubscription = true;
        subscriptionDaysLeft = Math.ceil(subMsLeft / (24 * 60 * 60 * 1000));
      }
    }

    return {
      daysLeft: trialDaysLeft,
      isTrialActive: trialDaysLeft > 0 || hasSubscription,
      isTrialExpired: trialDaysLeft <= 0 && !hasSubscription,
      hasSubscription,
      subscriptionDaysLeft,
    };
  }, [user, checked, subscriptionEndsAt]);
}
