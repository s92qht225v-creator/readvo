import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const clientId = process.env.TELEGRAM_BOT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  /* Build the public origin from the proxy-forwarded headers, NOT
     request.nextUrl.origin — behind the nginx reverse proxy the latter
     resolves to the internal http://localhost:3000, which Telegram
     rejects ("redirect_uri required"). nginx sets `Host $host`
     (blim.uz / test.blim.uz) and `X-Forwarded-Proto $scheme`, so the
     header values are the real public origin. This must also match the
     redirectUri the completion page sends to the callback (it uses
     window.location.origin), or the token exchange fails. */
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin;
  const nextPath = request.nextUrl.searchParams.get('next') || '/uz/chinese/dialogues';
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
