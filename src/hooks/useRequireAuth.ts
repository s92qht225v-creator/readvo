'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useRouter } from '@/i18n/navigation';

/**
 * Auth guard: redirects unauthenticated users to /.
 * Returns { user, isLoading } so components can show a loading state.
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && process.env.NODE_ENV !== 'development') {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  return { user, isLoading };
}
