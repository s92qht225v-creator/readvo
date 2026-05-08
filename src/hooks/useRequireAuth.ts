'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRouter } from 'next/navigation';
import { navigateToTestHref } from '@/lib/test/paths';

interface Options {
  /**
   * Where to send unauthenticated users. If provided, uses
   * `window.location.replace` (works on any hostname / no locale prefix).
   * If omitted, defaults to `/`, which the main proxy redirects to the
   * default locale and the test host rewrites to the test landing page.
   */
  redirectTo?: string;
}

/**
 * Auth guard: redirects unauthenticated users.
 * Returns { user, isLoading } so components can show a loading state.
 */
export function useRequireAuth(options?: Options) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || user) return;
    if (process.env.NODE_ENV === 'development') return;
    if (options?.redirectTo) {
      navigateToTestHref(options.redirectTo, true);
    } else router.replace('/');
  }, [user, isLoading, router, options?.redirectTo]);

  return { user, isLoading };
}
