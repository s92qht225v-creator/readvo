import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const clientId = process.env.TELEGRAM_BOT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  const nextPath = request.nextUrl.searchParams.get('next') || '/uz/chinese';
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
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  response.cookies.set('tg_next', nextPath, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
