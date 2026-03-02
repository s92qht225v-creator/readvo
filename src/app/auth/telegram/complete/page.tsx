'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

export default function TelegramCompletePage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        // Extract tgAuthResult from URL fragment
        const hash = window.location.hash;
        const match = hash.match(/tgAuthResult=([^&]+)/);
        if (!match) {
          router.replace('/?error=no_auth_result');
          return;
        }

        // Decode base64url → JSON
        const base64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(base64);
        const authData = JSON.parse(decoded);

        if (!authData || authData === false || !authData.id) {
          router.replace('/?error=auth_denied');
          return;
        }

        // Send auth data to server for verification + session creation
        const res = await fetch('/api/auth/telegram/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authData),
        });

        if (!res.ok) {
          const err = await res.json();
          router.replace(`/?error=${err.error || 'callback_failed'}`);
          return;
        }

        const { access_token, refresh_token } = await res.json();

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('setSession error:', error);
          router.replace('/?error=set_session');
          return;
        }

        router.replace('/chinese');
      } catch (err) {
        console.error('Telegram complete error:', err);
        router.replace('/?error=complete_failed');
      }
    })();
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontFamily: 'inherit',
      color: '#666',
    }}>
      Kirish...
    </div>
  );
}
