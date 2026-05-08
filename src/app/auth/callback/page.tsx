'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

/**
 * Generic Supabase OAuth callback. Lives outside the locale tree so it can be
 * reached on both blim.uz and test.blim.uz with the same route.
 *
 * - PKCE flow: Supabase redirects here with `?code=...`. We exchange for a
 *   session in the browser, then navigate to `?next=` (default /).
 * - Implicit flow: Supabase redirects with `#access_token=...` which the
 *   browser-side Supabase client auto-detects via `detectSessionInUrl`. We
 *   still navigate to `next` once the session lands.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const errParam = url.searchParams.get('error');
      const next = url.searchParams.get('next') ?? '/';

      if (errParam) {
        window.location.replace(`/auth/error?reason=${encodeURIComponent(errParam)}`);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          window.location.replace(`/auth/error?reason=${encodeURIComponent(error.message)}`);
          return;
        }
        window.location.replace(next);
        return;
      }

      // Implicit flow (hash). Wait briefly for session to land.
      await new Promise(r => setTimeout(r, 200));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        window.location.replace(next);
      } else {
        window.location.replace('/auth/error?reason=no_session');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'system-ui, sans-serif',
      color: '#475569',
    }}>
      <div>Signing you in…</div>
    </div>
  );
}
