'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithTelegram: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginWithTelegram: async () => {},
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
  const router = useRouter();
  const loginGrace = useRef(false);

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
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      if (loginGrace.current) return; // skip checks right after login
      const nonce = localStorage.getItem('blim-session-nonce');
      if (!nonce) return; // no nonce = old session before this feature, skip
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        router.push('/');
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
          router.push('/');
        }
      } catch {
        // Network error — don't kick out
      }
    }, 30_000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [user, router]);

  const loginWithTelegram = useCallback(async () => {
    const res = await fetch('/api/auth/telegram/init');
    const data = await res.json();
    if (data.url) {
      // Store PKCE verifier and state for the callback page to use
      sessionStorage.setItem('tg_code_verifier', data.codeVerifier);
      sessionStorage.setItem('tg_state', data.state);
      window.location.href = data.url;
    } else {
      console.error('Telegram init failed:', data);
    }
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
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithTelegram, logout, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
