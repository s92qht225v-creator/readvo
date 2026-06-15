'use client';

import { usePathname } from 'next/navigation';

const TELEGRAM_USERNAME = 'blim_yordam';
const HREF = `https://t.me/${TELEGRAM_USERNAME}`;

export function TelegramFAB() {
  const pathname = usePathname();

  // Hide on routes where the floating button would conflict with fixed UI
  // (karaoke player, lesson reader bottom bars, etc.)
  if (
    pathname?.includes('/karaoke/') ||
    pathname?.includes('/dialogues/') ||
    pathname?.includes('/flashcards/') ||
    pathname?.includes('/writing/')
  ) {
    return null;
  }

  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Telegram orqali bog'lanish"
      className="telegram-fab"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true" style={{ transform: 'translate(-1px, 1px)' }}>
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
      </svg>
    </a>
  );
}
