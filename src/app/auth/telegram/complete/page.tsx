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
        const res = await fetch('/api/auth/telegram/session');
        if (!res.ok) {
          router.replace('/?error=no_session');
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
