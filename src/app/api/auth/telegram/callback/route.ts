import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function verifyTelegramAuth(params: Record<string, string>, botToken: string): boolean {
  const hash = params.hash;
  const checkString = Object.keys(params)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return hmac === hash;
}

export async function GET(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.redirect(new URL('/?error=config', request.url));
  }

  // Get all query params from Telegram redirect
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Verify the auth data
  if (!params.hash || !verifyTelegramAuth(params, botToken)) {
    return NextResponse.redirect(new URL('/?error=auth', request.url));
  }

  // Check auth_date is not too old (allow 1 day)
  const now = Math.floor(Date.now() / 1000);
  if (now - Number(params.auth_date) > 86400) {
    return NextResponse.redirect(new URL('/?error=expired', request.url));
  }

  // Upsert user in Supabase
  await getSupabaseAdmin()
    .from('users')
    .upsert({
      id: Number(params.id),
      first_name: params.first_name,
      last_name: params.last_name || null,
      username: params.username || null,
      photo_url: params.photo_url || null,
    }, { onConflict: 'id' });

  // Set session cookie and redirect to home
  const user = {
    id: Number(params.id),
    first_name: params.first_name,
    last_name: params.last_name,
    username: params.username,
    photo_url: params.photo_url,
  };

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set('readvo-user', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}
