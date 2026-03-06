'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

const loadingStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  fontFamily: 'inherit',
  color: '#666',
} as const;

function TelegramCompleteInner() {
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
          router.replace(`/?error=${error}`);
          return;
        }

        if (!code) {
          router.replace('/?error=no_auth_code');
          return;
        }

        const origin = window.location.origin;
        const redirectUri = `${origin}/auth/telegram/complete`;

        // Callback reads code_verifier + state from httpOnly cookies server-side
        const res = await fetch('/api/auth/telegram/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!res.ok) {
          const err = await res.json();
          router.replace(`/?error=${err.error || 'callback_failed'}`);
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
          router.replace('/?error=set_session');
          return;
        }

        router.replace('/chinese');
      } catch (err) {
        console.error('Telegram complete error:', err);
        router.replace('/?error=complete_failed');
      }
    })();
  }, [router, searchParams]);

  return <div style={loadingStyle}>Kirish...</div>;
}

export default function TelegramCompletePage() {
  return (
    <Suspense fallback={<div style={loadingStyle}>Kirish...</div>}>
      <TelegramCompleteInner />
    </Suspense>
  );
}
