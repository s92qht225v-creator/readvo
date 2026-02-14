'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TelegramLoginButtonProps {
  botName: string;
  size?: 'large' | 'medium' | 'small';
  radius?: number;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export function TelegramLoginButton({
  botName,
  size = 'large',
  radius = 12,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();

  useEffect(() => {
    // Set up global callback
    window.onTelegramAuth = (user: Record<string, unknown>) => {
      login(user);
    };

    // Create and inject the Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', String(radius));
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botName, size, radius, login]);

  return <div ref={containerRef} />;
}
