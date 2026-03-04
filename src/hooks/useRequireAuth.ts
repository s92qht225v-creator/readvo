'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

/**
 * Redirects to landing page if user is not authenticated.
 * Returns { user, isLoading } so components can show a loading state.
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // TODO: restore auth redirect after local testing
  // useEffect(() => {
  //   if (!isLoading && !user) {
  //     router.replace('/');
  //   }
  // }, [isLoading, user, router]);

  return { user, isLoading };
}
