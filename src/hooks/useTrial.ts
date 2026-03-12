'use client';

import { useMemo } from 'react';
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
  const { user, subscription, subscriptionChecked } = useAuth();

  return useMemo(() => {
    if (!user || !subscriptionChecked) return null;

    const createdAt = new Date(user.created_at).getTime();
    const trialEndsAt = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const msLeft = trialEndsAt - now;
    const trialDaysLeft = msLeft > 0 ? Math.ceil(msLeft / (24 * 60 * 60 * 1000)) : 0;

    let hasSubscription = false;
    let subscriptionDaysLeft = 0;

    if (subscription?.ends_at) {
      const subEnd = new Date(subscription.ends_at).getTime();
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
  }, [user, subscriptionChecked, subscription]);
}
