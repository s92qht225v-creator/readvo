import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const clientId = process.env.TELEGRAM_BOT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectUri = `${origin}/auth/telegram/complete`;

  // CSRF state
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile',
    state,
  });

  const url = `https://oauth.telegram.org/auth?${params.toString()}`;

  // Store state in cookie for CSRF validation on callback
  const response = NextResponse.json({ url });
  response.cookies.set('tg_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
