'use client';

import { usePathname } from 'next/navigation';

const TELEGRAM_USERNAME = 'blim_yordam';
const HREF = `https://t.me/${TELEGRAM_USERNAME}`;

export function TelegramFAB() {
  const pathname = usePathname();

  // The HSK course readers: /{locale}/hsk/{book}/{level}/{lesson}/{text} and
  // .../grammar/{point}. Matched by depth rather than by name so the lesson
  // list one level up — a catalog, with no fixed bar to collide with — keeps
  // the button.
  const seg = pathname?.split('/') ?? [];
  const isHskReader = seg[2] === 'hsk' && seg.length >= 7;

  // Hide on routes where the floating button would conflict with fixed UI
  // (karaoke player, lesson reader bottom bars, etc.)
  if (
    isHskReader ||
    pathname?.includes('/karaoke/') ||
    pathname?.includes('/dialogues/') ||
    pathname?.includes('/story/') ||
    pathname?.includes('/flashcards/') ||
    pathname?.includes('/writing/')
  ) {
    return null;
  }

  const locale = pathname?.split('/')[1];
  const label = locale === 'ru' ? 'Поддержка' : locale === 'en' ? 'Support' : 'Yordam';

  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="telegram-fab"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true" style={{ transform: 'translate(-1px, 1px)', flexShrink: 0 }}>
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
      </svg>
      <span className="telegram-fab__label">{label}</span>
    </a>
  );
}
