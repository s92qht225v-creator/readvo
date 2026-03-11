'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

const labels = {
  uz: {
    google: 'Google orqali kirish',
    telegram: 'Telegram orqali kirish',
    or: 'yoki',
  },
  ru: {
    google: 'Войти через Google',
    telegram: 'Войти через Telegram',
    or: 'или',
  },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.53 8.16l-1.8 8.48c-.13.6-.5.74-.99.46l-2.74-2.02-1.32 1.27c-.15.15-.27.27-.55.27l.2-2.78 5.07-4.58c.22-.2-.05-.3-.34-.12l-6.27 3.95-2.7-.84c-.59-.18-.6-.59.12-.87l10.55-4.07c.49-.18.92.12.76.85z" fill="currentColor"/>
    </svg>
  );
}

export function LoginPage() {
  const { user, isLoading, loginWithTelegram, loginWithGoogle } = useAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const s = labels[language];

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/chinese');
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p style={{ color: '#6b7280', textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Image src="/logo-red.svg" alt="Blim" width={100} height={34} className="login-logo" priority />

        <button className="login-btn login-btn--google" onClick={loginWithGoogle} type="button">
          <GoogleIcon />
          {s.google}
        </button>

        <div className="login-divider">
          <span>{s.or}</span>
        </div>

        <button className="login-btn login-btn--telegram" onClick={loginWithTelegram} type="button">
          <TelegramIcon />
          {s.telegram}
        </button>
      </div>
    </div>
  );
}
