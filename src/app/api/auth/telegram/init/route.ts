import { NextResponse } from 'next/server';

export async function GET() {
  const botId = process.env.TELEGRAM_BOT_ID;
  if (!botId) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const returnTo = `${origin}/auth/telegram/complete`;

  const params = new URLSearchParams({
    bot_id: botId,
    origin,
    embed: '0',
    request_access: 'write',
    return_to: returnTo,
  });

  const url = `https://oauth.telegram.org/auth?${params.toString()}`;

  return NextResponse.json({ url });
}
