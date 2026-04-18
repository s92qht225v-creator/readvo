'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

const TRIAL_DAYS = 7;
const MS_PER_DAY = 86_400_000; // 24 * 60 * 60 * 1000

interface TrialStatus {
  daysLeft: number;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  hasSubscription: boolean;
  subscriptionDaysLeft: number;
}

export function useTrial(): TrialStatus | null {
  const { user, subscription, subscriptionChecked } = useAuth();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!user || !subscriptionChecked) return null;

    const createdAt = new Date(user.created_at).getTime();
    const trialEndsAt = createdAt + TRIAL_DAYS * MS_PER_DAY;
    const msLeft = trialEndsAt - now;
    const trialDaysLeft = msLeft > 0 ? Math.ceil(msLeft / MS_PER_DAY) : 0;

    let hasSubscription = false;
    let subscriptionDaysLeft = 0;

    if (subscription?.ends_at) {
      const subEnd = new Date(subscription.ends_at).getTime();
      const subMsLeft = subEnd - now;
      if (subMsLeft > 0) {
        hasSubscription = true;
        subscriptionDaysLeft = Math.ceil(subMsLeft / MS_PER_DAY);
      }
    }

    return {
      daysLeft: trialDaysLeft,
      isTrialActive: trialDaysLeft > 0 || hasSubscription,
      isTrialExpired: trialDaysLeft <= 0 && !hasSubscription,
      hasSubscription,
      subscriptionDaysLeft,
    };
  }, [now, user, subscriptionChecked, subscription]);
}
