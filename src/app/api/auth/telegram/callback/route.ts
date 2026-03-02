import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function verifyTelegramHash(data: Record<string, string>, botToken: string): boolean {
  const hash = data.hash;
  if (!hash) return false;

  // Build data-check-string: all fields except hash, sorted alphabetically, joined by \n
  const checkArr: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'hash') checkArr.push(`${key}=${value}`);
  }
  checkArr.sort();
  const dataCheckString = checkArr.join('\n');

  // secret_key = SHA256(bot_token)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  // hash = HMAC_SHA256(data_check_string, secret_key)
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return hmac === hash;
}

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const data: Record<string, string> = await request.json();

  // Verify HMAC hash
  if (!verifyTelegramHash(data, botToken)) {
    return NextResponse.json({ error: 'invalid_hash' }, { status: 401 });
  }

  // Check auth_date is not too old (10 minutes)
  const authDate = parseInt(data.auth_date || '0', 10);
  if (Date.now() / 1000 - authDate > 600) {
    return NextResponse.json({ error: 'expired' }, { status: 401 });
  }

  try {
    const telegramId = data.id;
    const firstName = data.first_name || '';
    const lastName = data.last_name || '';
    const username = data.username || '';
    const photoUrl = data.photo_url || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || username || `Telegram User ${telegramId}`;

    // Find or create Supabase user
    const admin = getSupabaseAdmin();
    const syntheticEmail = `tg_${telegramId}@telegram.blim`;
    // Generate a unique session nonce to enforce single-device login
    const sessionNonce = crypto.randomBytes(16).toString('hex');

    const metadata = {
      telegram_id: telegramId,
      full_name: fullName,
      name: fullName,
      preferred_username: username,
      avatar_url: photoUrl,
      picture: photoUrl,
      provider: 'telegram',
    };

    // Try to create user; if already exists, that's fine — we'll update metadata after session creation
    const { error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (createError && !createError.message?.includes('already') && !createError.message?.includes('exists')) {
      console.error('Failed to create user:', createError);
      return NextResponse.json({ error: 'create_user' }, { status: 500 });
    }

    // Generate a Supabase session via magiclink + verifyOtp
    // generateLink resolves the user by email server-side (no listUsers needed)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: syntheticEmail,
    });

    if (linkError || !linkData) {
      console.error('Failed to generate link:', linkError);
      return NextResponse.json({ error: 'generate_link' }, { status: 500 });
    }

    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) {
      console.error('No hashed_token in link data');
      return NextResponse.json({ error: 'no_token' }, { status: 500 });
    }

    const { data: sessionData, error: otpError } = await admin.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    });

    if (otpError || !sessionData.session) {
      console.error('Failed to verify OTP:', otpError);
      return NextResponse.json({ error: 'verify_otp' }, { status: 500 });
    }

    // Get userId from the session (avoids listUsers which doesn't paginate past ~50 users)
    const userId = sessionData.session.user.id;

    // Update metadata for existing users (name/avatar changes)
    await admin.auth.admin.updateUserById(userId, { user_metadata: metadata });

    // Store session nonce in dedicated table (not user_metadata, which has JWT caching issues)
    await admin.from('active_sessions').upsert({
      user_id: userId,
      session_nonce: sessionNonce,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      session_nonce: sessionNonce,
    });
  } catch (err) {
    console.error('Telegram callback error:', err);
    return NextResponse.json({ error: 'callback_failed' }, { status: 500 });
  }
}
