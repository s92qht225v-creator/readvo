'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { trackAll } from '@/utils/analytics';

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  fontFamily: 'inherit',
  color: '#666',
} as const;

function GoogleCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          router.replace(`/login?error=${error}`);
          return;
        }

        if (!code) {
          router.replace('/login?error=no_auth_code');
          return;
        }

        const origin = window.location.origin;
        const redirectUri = `${origin}/auth/google/complete`;

        const res = await fetch('/api/auth/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!res.ok) {
          const err = await res.json();
          router.replace(`/login?error=${err.error || 'callback_failed'}`);
          return;
        }

        const { access_token, refresh_token, session_nonce } = await res.json();

        // Store nonce BEFORE setSession (setSession triggers onAuthStateChange)
        localStorage.removeItem('blim-session-nonce');
        if (session_nonce) {
          localStorage.setItem('blim-session-nonce', session_nonce);
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sessionError) {
          console.error('setSession error:', sessionError);
          router.replace('/login?error=set_session');
          return;
        }

        // Analytics: track registration/login
        trackAll('CompleteRegistration', 'registration', 'sign_up', { status: 'success', provider: 'google' });

        router.replace('/chinese');
      } catch (err) {
        console.error('Google complete error:', err);
        router.replace('/login?error=complete_failed');
      }
    })();
  }, [router, searchParams]);

  return <div style={loadingStyle}>Kirish...</div>;
}

export default function GoogleCompletePage() {
  return (
    <Suspense fallback={<div style={loadingStyle}>Kirish...</div>}>
      <GoogleCompleteInner />
    </Suspense>
  );
}
