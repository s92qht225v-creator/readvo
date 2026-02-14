'use client';

import { useEffect, useRef } from 'react';

interface TelegramLoginButtonProps {
  botName: string;
  size?: 'large' | 'medium' | 'small';
  radius?: number;
}

export function TelegramLoginButton({
  botName,
  size = 'large',
  radius = 12,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create and inject the Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', size);
    script.setAttribute('data-radius', String(radius));
    script.setAttribute('data-auth-url', '/api/auth/telegram/callback');
    script.setAttribute('data-request-access', 'write');

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }
  }, [botName, size, radius]);

  return <div ref={containerRef} />;
}
