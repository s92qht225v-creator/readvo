import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/** Verify Telegram login data using HMAC-SHA256 */
function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...rest } = data;

  // Sort fields alphabetically and create check string
  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join('\n');

  // Secret key = SHA256(bot_token)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // Verify HMAC
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return hmac === hash;
}

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  const data: TelegramAuthData = await request.json();

  // Verify the auth data
  if (!verifyTelegramAuth(data, botToken)) {
    return NextResponse.json({ error: 'Invalid auth data' }, { status: 401 });
  }

  // Check auth_date is not too old (allow 1 day)
  const now = Math.floor(Date.now() / 1000);
  if (now - data.auth_date > 86400) {
    return NextResponse.json({ error: 'Auth data expired' }, { status: 401 });
  }

  // Upsert user in Supabase
  const { error: dbError } = await getSupabaseAdmin()
    .from('users')
    .upsert({
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name || null,
      username: data.username || null,
      photo_url: data.photo_url || null,
    }, { onConflict: 'id' });

  if (dbError) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  // Set session cookie
  const user = {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    username: data.username,
    photo_url: data.photo_url,
  };

  const response = NextResponse.json({ user });
  response.cookies.set('readvo-user', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return response;
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('readvo-user');
  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = JSON.parse(cookie.value);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('readvo-user');
  return response;
}
