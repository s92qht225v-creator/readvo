import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// Cache Google JWKS keys
let jwksCache: { keys: GoogleJWK[] } | null = null;
let jwksCacheTime = 0;
const JWKS_TTL = 3600_000; // 1 hour

interface GoogleJWK {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
  use: string;
}

async function getGoogleJWKS(): Promise<{ keys: GoogleJWK[] }> {
  if (jwksCache && Date.now() - jwksCacheTime < JWKS_TTL) return jwksCache;
  const res = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!res.ok) throw new Error('Failed to fetch Google JWKS');
  jwksCache = await res.json();
  jwksCacheTime = Date.now();
  return jwksCache!;
}

function base64urlDecode(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function verifyGoogleJWT(token: string, clientId: string): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(base64urlDecode(headerB64).toString());
  const payload = JSON.parse(base64urlDecode(payloadB64).toString());

  // Validate standard claims
  const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
  if (!validIssuers.includes(payload.iss)) throw new Error('Invalid issuer');
  if (String(payload.aud) !== String(clientId)) throw new Error('Invalid audience');
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');

  // Fetch JWKS and find matching key
  const { keys } = await getGoogleJWKS();
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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const { code, redirectUri } = await request.json();
  if (!code || !redirectUri) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
  }

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Google token exchange failed:', err);
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 401 });
  }

  const tokens = await tokenRes.json();
  const idToken: string = tokens.id_token;
  if (!idToken) {
    console.error('No id_token in Google response:', JSON.stringify(tokens));
    return NextResponse.json({ error: 'no_id_token' }, { status: 401 });
  }

  // Verify and decode the ID token
  let payload: Record<string, unknown>;
  try {
    payload = await verifyGoogleJWT(idToken, clientId);
  } catch (err) {
    console.error('Google JWT verification failed:', err);
    return NextResponse.json({ error: 'invalid_id_token' }, { status: 401 });
  }

  const googleId = String(payload.sub ?? '');
  const email = String(payload.email ?? '');
  const fullName = String(payload.name ?? email);
  const photoUrl = String(payload.picture ?? '');

  if (!googleId || !email) {
    return NextResponse.json({ error: 'no_user_info' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const sessionNonce = crypto.randomBytes(16).toString('hex');

    const metadata = {
      google_id: googleId,
      full_name: fullName,
      name: fullName,
      email,
      avatar_url: photoUrl,
      picture: photoUrl,
      provider: 'google',
    };

    // Create user if not exists
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (createError && !createError.message?.includes('already') && !createError.message?.includes('exists')) {
      console.error('Failed to create Google user:', createError);
      return NextResponse.json({ error: 'create_user' }, { status: 500 });
    }

    // Generate Supabase session via magiclink + verifyOtp
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
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

    const response = NextResponse.json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      session_nonce: sessionNonce,
    });
    response.cookies.set('google_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Google callback error:', err);
    return NextResponse.json({ error: 'callback_failed' }, { status: 500 });
  }
}
