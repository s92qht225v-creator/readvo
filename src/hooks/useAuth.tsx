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
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    // Listen for auth changes (including token from URL hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ? mapUser(session.user) : null;
      setUser(newUser);
      setIsLoading(false);
      if (newUser) wasLoggedIn.current = true;
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
      if (newUser) wasLoggedIn.current = true;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Periodically verify the session is still valid (detects server-side sign-out)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setUser(null);
        wasLoggedIn.current = false;
        router.push('/');
      }
    }, 30_000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [user, router]);

  const loginWithTelegram = useCallback(async () => {
    const res = await fetch('/api/auth/telegram/init');
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('Telegram init failed:', data);
    }
  }, []);

  const logout = useCallback(async () => {
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
