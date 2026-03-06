import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// Cache JWKS keys (in-memory, refreshed on cold start)
let jwksCache: { keys: JWK[] } | null = null;
let jwksCacheTime = 0;
const JWKS_TTL = 3600_000; // 1 hour

interface JWK {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
  use: string;
}

async function getJWKS(): Promise<{ keys: JWK[] }> {
  if (jwksCache && Date.now() - jwksCacheTime < JWKS_TTL) return jwksCache;
  const res = await fetch('https://oauth.telegram.org/.well-known/jwks.json');
  if (!res.ok) throw new Error('Failed to fetch JWKS');
  jwksCache = await res.json();
  jwksCacheTime = Date.now();
  return jwksCache!;
}

function base64urlDecode(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function verifyJWT(token: string, clientId: string): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64urlDecode(headerB64).toString());
  const payload = JSON.parse(base64urlDecode(payloadB64).toString());

  // Validate standard claims
  if (payload.iss !== 'https://oauth.telegram.org') throw new Error('Invalid issuer');
  if (String(payload.aud) !== String(clientId)) throw new Error('Invalid audience');
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');

  // Fetch JWKS and find matching key
  const { keys } = await getJWKS();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('No matching JWK found');

  // Import public key from JWK
  const publicKey = crypto.createPublicKey({
    key: { kty: jwk.kty, n: jwk.n, e: jwk.e } as crypto.JsonWebKey,
    format: 'jwk',
  });

  // Verify signature
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = base64urlDecode(signatureB64);
  const valid = crypto.verify('sha256', Buffer.from(signingInput), publicKey, signature);
  if (!valid) throw new Error('Invalid signature');

  return payload;
}

export async function POST(request: NextRequest) {
  const clientId = process.env.TELEGRAM_BOT_ID;
  const clientSecret = process.env.TELEGRAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const { code, codeVerifier, redirectUri } = await request.json();
  if (!code || !codeVerifier || !redirectUri) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
  }

  // Exchange authorization code for tokens
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://oauth.telegram.org/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Token exchange failed:', err);
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 401 });
  }

  const tokens = await tokenRes.json();
  const idToken: string = tokens.id_token;
  if (!idToken) {
    return NextResponse.json({ error: 'no_id_token' }, { status: 401 });
  }

  // Verify and decode the ID token
  let payload: Record<string, unknown>;
  try {
    payload = await verifyJWT(idToken, clientId);
  } catch (err) {
    console.error('JWT verification failed:', err);
    return NextResponse.json({ error: 'invalid_id_token' }, { status: 401 });
  }

  // Extract user info from ID token payload
  const telegramId = String(payload.id ?? payload.sub ?? '');
  const fullName = String(payload.name ?? payload.preferred_username ?? `Telegram User ${telegramId}`);
  const username = String(payload.preferred_username ?? '');
  const photoUrl = String(payload.picture ?? '');

  if (!telegramId) {
    return NextResponse.json({ error: 'no_user_id' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const syntheticEmail = `tg_${telegramId}@telegram.blim`;
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

    // Create user if not exists
    const { error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (createError && !createError.message?.includes('already') && !createError.message?.includes('exists')) {
      console.error('Failed to create user:', createError);
      return NextResponse.json({ error: 'create_user' }, { status: 500 });
    }

    // Generate Supabase session
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

    const userId = sessionData.session.user.id;
    await admin.auth.admin.updateUserById(userId, { user_metadata: metadata });
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
