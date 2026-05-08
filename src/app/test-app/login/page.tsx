'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { navigateToTestHref } from '@/lib/test/paths';

export default function TestLoginPage() {
  const { user, isLoading, loginWithGoogle, loginWithTelegram } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      navigateToTestHref('/dashboard', true);
    }
  }, [user, isLoading]);

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Sign in</h1>
      <p style={{ color: '#475569', marginBottom: 32 }}>
        Use Google to create and manage your tests.
      </p>

      <button
        type="button"
        onClick={() => loginWithGoogle('/dashboard')}
        style={{
          width: '100%', padding: '12px 18px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: '#fff', color: '#0f172a',
          border: '1px solid #cbd5e1', borderRadius: 10,
          fontWeight: 600, fontSize: 15, cursor: 'pointer',
        }}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div style={{
        textAlign: 'center', margin: '24px 0', fontSize: 13, color: '#94a3b8',
      }}>
        or
      </div>

      <button
        type="button"
        onClick={() => loginWithTelegram('/dashboard')}
        style={{
          width: '100%', padding: '12px 18px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          background: '#229ed9', color: '#fff', border: 'none', borderRadius: 10,
          fontWeight: 600, fontSize: 15, cursor: 'pointer',
        }}
      >
        <TelegramIcon />
        Continue with Telegram
      </button>

      <p style={{ marginTop: 32, fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
        Students don&apos;t need an account. Just share a test link.
      </p>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.7-6 8-11.3 8a12 12 0 1 1 7.9-21.1l5.1-5.1A19.2 19.2 0 1 0 24 43.2c10.6 0 19.2-8.6 19.2-19.2 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3A12 12 0 0 1 24 12c3 0 5.7 1 7.9 2.9l5.1-5.1A19.2 19.2 0 0 0 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.2c5 0 9.6-1.9 13.1-5l-6-5a12 12 0 0 1-18-6.4l-6 4.6A19.2 19.2 0 0 0 24 43.2z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3a12 12 0 0 1-4.2 5.7l6 5c-.4.4 6.5-4.6 6.5-14.5 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}
