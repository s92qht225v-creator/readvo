import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function verifyTelegramHash(params: URLSearchParams, botToken: string): boolean {
  const hash = params.get('hash');
  if (!hash) return false;

  // Build data-check-string: all params except hash, sorted alphabetically, joined by \n
  const checkArr: string[] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') checkArr.push(`${key}=${value}`);
  });
  checkArr.sort();
  const dataCheckString = checkArr.join('\n');

  // secret_key = SHA256(bot_token)
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  // hash = HMAC_SHA256(data_check_string, secret_key)
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return hmac === hash;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = new URL(request.url).origin;

  const botToken = process.env.TELEGRAM_PAYMENT_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.redirect(`${origin}/?error=not_configured`);
  }

  // Verify HMAC hash
  if (!verifyTelegramHash(searchParams, botToken)) {
    return NextResponse.redirect(`${origin}/?error=invalid_hash`);
  }

  // Check auth_date is not too old (10 minutes)
  const authDate = parseInt(searchParams.get('auth_date') || '0', 10);
  if (Date.now() / 1000 - authDate > 600) {
    return NextResponse.redirect(`${origin}/?error=expired`);
  }

  try {
    const telegramId = searchParams.get('id')!;
    const firstName = searchParams.get('first_name') || '';
    const lastName = searchParams.get('last_name') || '';
    const username = searchParams.get('username') || '';
    const photoUrl = searchParams.get('photo_url') || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || username || `Telegram User ${telegramId}`;

    // Find or create Supabase user
    const admin = getSupabaseAdmin();
    const syntheticEmail = `tg_${telegramId}@telegram.blim`;

    // Try to create user; if already exists, update metadata
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramId,
        full_name: fullName,
        name: fullName,
        preferred_username: username,
        avatar_url: photoUrl,
        picture: photoUrl,
        provider: 'telegram',
      },
    });

    if (createError) {
      if (createError.message?.includes('already') || createError.message?.includes('exists')) {
        // User exists — update metadata
        const { data: { users } } = await admin.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === syntheticEmail);

        if (!existingUser) {
          return NextResponse.redirect(`${origin}/?error=user_not_found`);
        }

        await admin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            telegram_id: telegramId,
            full_name: fullName,
            name: fullName,
            preferred_username: username,
            avatar_url: photoUrl,
            picture: photoUrl,
            provider: 'telegram',
          },
        });
      } else {
        console.error('Failed to create user:', createError);
        return NextResponse.redirect(`${origin}/?error=create_user`);
      }
    }

    // Generate a Supabase session via magiclink + verifyOtp
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: syntheticEmail,
    });

    if (linkError || !linkData) {
      console.error('Failed to generate link:', linkError);
      return NextResponse.redirect(`${origin}/?error=generate_link`);
    }

    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) {
      console.error('No hashed_token in link data');
      return NextResponse.redirect(`${origin}/?error=no_token`);
    }

    const { data: sessionData, error: otpError } = await admin.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'email',
    });

    if (otpError || !sessionData.session) {
      console.error('Failed to verify OTP:', otpError);
      return NextResponse.redirect(`${origin}/?error=verify_otp`);
    }

    // Set session tokens in httpOnly cookies for the client page to pick up
    const response = NextResponse.redirect(`${origin}/auth/telegram/complete`);

    response.cookies.set('tg_access_token', sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
      path: '/',
    });

    response.cookies.set('tg_refresh_token', sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Telegram callback error:', err);
    return NextResponse.redirect(`${origin}/?error=callback_failed`);
  }
}
