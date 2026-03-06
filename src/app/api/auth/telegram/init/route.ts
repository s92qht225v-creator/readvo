import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const clientId = process.env.TELEGRAM_BOT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectUri = `${origin}/auth/telegram/complete`;

  // PKCE: generate code_verifier and code_challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  // CSRF state
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const url = `https://oauth.telegram.org/auth?${params.toString()}`;

  // Return url + PKCE verifier + state so the client can store them for the callback
  return NextResponse.json({ url, codeVerifier, state });
}
