'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { primeAudioToken } from '@/lib/audio/token-client';

/**
 * Prime the learning-audio access token on mount so ref-based players can
 * synchronously rewrite Storage URLs to the auth-gated proxy at play time.
 * Use in any component that plays Supabase audio without `useAudioPlayer`.
 */
export function usePrimeAudioToken(): void {
  const { getAccessToken } = useAuth();
  useEffect(() => { void primeAudioToken(getAccessToken); }, [getAccessToken]);
}
