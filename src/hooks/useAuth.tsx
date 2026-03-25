'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { supabase } from '@/lib/supabase-client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

interface SubscriptionInfo {
  ends_at: string;
  plan?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  subscription: SubscriptionInfo | null;
  subscriptionChecked: boolean;
  loginWithTelegram: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  subscription: null,
  subscriptionChecked: false,
  loginWithTelegram: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
});

function mapUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email || '',
    avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
    created_at: supabaseUser.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const router = useRouter();
  const loginGrace = useRef(false);
  const subFetchRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // Listen for auth changes (including token from URL hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ? mapUser(session.user) : null;
      setUser(newUser);
      setIsLoading(false);
      // Skip session checks for 60s after login to avoid race conditions
      if (_event === 'SIGNED_IN') {
        loginGrace.current = true;
        setTimeout(() => { loginGrace.current = false; }, 60_000);
        // Set auth cookie for server-side middleware protection
        document.cookie = 'blim-auth=1; path=/; max-age=31536000; SameSite=Lax';

        // Register nonce for OAuth providers (Google) that don't have a custom callback
        // Telegram sets nonce BEFORE setSession, so it already has one by now
        const existingNonce = localStorage.getItem('blim-session-nonce');
        if (!existingNonce && session?.access_token) {
          fetch('/api/auth/register-nonce', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
            .then(res => res.json())
            .then(data => {
              if (data.session_nonce) {
                localStorage.setItem('blim-session-nonce', data.session_nonce);
              }
            })
            .catch(() => {}); // non-critical
        }
      }
      // Clean up hash from URL after login
      if (_event === 'SIGNED_IN' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // Check current session (for page refreshes)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUser = session?.user ? mapUser(session.user) : null;
      setUser(newUser);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodically verify single-device session via nonce check
  const routerRef = useRef(router);
  routerRef.current = router;
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      if (loginGrace.current) return; // skip checks right after login
      const nonce = localStorage.getItem('blim-session-nonce');
      if (!nonce) return; // no nonce = old session before this feature, skip
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        routerRef.current.push('/');
        return;
      }
      try {
        const res = await fetch('/api/auth/session-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ nonce }),
        });
        const { valid } = await res.json();
        if (!valid) {
          localStorage.removeItem('blim-session-nonce');
          await supabase.auth.signOut({ scope: 'local' });
          setUser(null);
          routerRef.current.push('/');
        }
      } catch {
        // Network error — don't kick out
      }
    }, 120_000); // check every 2 minutes
    return () => clearInterval(interval);
  }, [user]);

  // Fetch subscription ONCE when user is available — shared via context
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setSubscriptionChecked(false);
      return;
    }
    // Deduplicate: if a fetch is already in flight, skip
    if (subFetchRef.current) return;
    subFetchRef.current = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { setSubscriptionChecked(true); return; }
        const res = await fetch('/api/subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            setSubscription({ ends_at: data.subscription.ends_at, plan: data.subscription.plan });
          }
        }
      } catch { /* ignore */ }
      setSubscriptionChecked(true);
      subFetchRef.current = null;
    })();
  }, [user]);

  const loginWithTelegram = useCallback(async () => {
    const res = await fetch('/api/auth/telegram/init');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('Telegram init failed:', data);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/chinese` },
    });
  }, []);

  const logout = useCallback(async () => {
    // Clean up active_sessions row server-side
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetch('/api/auth/session-check', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      }).catch(() => {}); // fire-and-forget
    }
    localStorage.removeItem('blim-session-nonce');
    document.cookie = 'blim-auth=; path=/; max-age=0';
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, subscription, subscriptionChecked, loginWithTelegram, loginWithGoogle, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
