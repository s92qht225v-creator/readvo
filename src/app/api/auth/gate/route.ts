import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';

/**
 * Manages the `blim-auth` gate cookie that `src/proxy.ts` checks before
 * serving protected `/chinese/hsk*` pages.
 *
 * The cookie is HttpOnly and set server-side only — client JS can no longer
 * forge it via `document.cookie`. It is a lightweight render gate, not the
 * security boundary (real data is still protected by Supabase RLS + the
 * session JWT); HttpOnly is defense-in-depth hygiene.
 *
 * POST  (Bearer token) — a valid session sets blim-auth=1.
 * DELETE                — clears it (logout).
 */
const COOKIE = 'blim-auth';
const ONE_YEAR = 31536000;

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    path: '/',
    maxAge,
    sameSite: 'lax' as const,
    // Behind the nginx TLS terminator the browser connection is https; only
    // gate Secure on production so local http dev can still set the cookie.
    secure: process.env.NODE_ENV === 'production',
  };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  // Local decode (~0ms); skip expiration so a backgrounded tab with a stale
  // access token still refreshes the gate rather than getting bounced.
  const userId = token ? getUserIdFromJWT(token, { skipExpiration: true }) : null;
  if (!userId) {
    // Don't clear the cookie here — a transient/malformed token must never
    // log a real user out. Only DELETE clears.
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '1', cookieOpts(ONE_YEAR));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', cookieOpts(0));
  return res;
}
