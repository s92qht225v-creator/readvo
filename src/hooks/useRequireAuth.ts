'use client';

import { useAuth } from './useAuth';

/**
 * Returns { user, isLoading } so components can show a loading state.
 * Auth redirect is handled by HomePage (redirects logged-in users to /chinese).
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
