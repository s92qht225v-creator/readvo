'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';

const TRIAL_DAYS = 7;

interface TrialStatus {
  daysLeft: number;
  isTrialActive: boolean;
  isTrialExpired: boolean;
}

export function useTrial(): TrialStatus | null {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return null;

    const createdAt = new Date(user.created_at).getTime();
    const trialEndsAt = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const msLeft = trialEndsAt - now;
    const daysLeft = msLeft > 0 ? Math.ceil(msLeft / (24 * 60 * 60 * 1000)) : 0;

    return {
      daysLeft,
      isTrialActive: daysLeft > 0,
      isTrialExpired: daysLeft <= 0,
    };
  }, [user]);
}
