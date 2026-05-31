'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { primeAudioToken, getCachedAudioToken } from '@/lib/audio/token-client';

/**
 * Prime the learning-audio access token on mount so ref-based players can
 * synchronously rewrite Storage URLs to the auth-gated proxy at play time.
 * Use in any component that plays Supabase audio without `useAudioPlayer`.
 */
export function usePrimeAudioToken(): void {
  const { getAccessToken } = useAuth();
  useEffect(() => { void primeAudioToken(getAccessToken); }, [getAccessToken]);
}

/**
 * Reactive variant: returns the token (null until ready) and re-renders
 * when it arrives. For players that set `audio.src` at MOUNT (before a
 * user gesture), where the synchronous cache isn't populated yet.
 */
export function useAudioToken(): string | null {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(() => getCachedAudioToken());
  useEffect(() => {
    let alive = true;
    void primeAudioToken(getAccessToken).then(t => { if (alive && t) setToken(t); });
    return () => { alive = false; };
  }, [getAccessToken]);
  return token;
}
