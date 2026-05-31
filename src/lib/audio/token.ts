/**
 * SERVER-ONLY audio access tokens. Short-lived, bucket-scoped HMAC tokens
 * that gate the `/api/audio/...` proxy. A token signed for one scope
 * (bucket) won't verify for another, so a token minted for public test
 * audio can't unlock the private learning-audio bucket.
 *
 * Do NOT import this from client components — it reads a server secret.
 */
import crypto from 'crypto';

/* Derive the HMAC key from an existing server secret so no new env var
   has to be provisioned on the box. Server-role key is server-only. */
function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

const DEFAULT_TTL_SEC = 60 * 60; // 1 hour — long enough for any single playback

/** Sign a token valid for `scope` (the bucket name) for `ttlSec` seconds. */
export function signAudioToken(scope: string, ttlSec = DEFAULT_TTL_SEC): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = crypto.createHmac('sha256', secret()).update(`${scope}.${exp}`).digest('base64url');
  return `${exp}.${sig}`;
}

/** Verify a token for a given scope (bucket). Checks expiry + HMAC. */
export function verifyAudioToken(token: string | null | undefined, scope: string): boolean {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const exp = parseInt(token.slice(0, dot), 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret()).update(`${scope}.${exp}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Buckets the audio proxy is allowed to serve. */
export const AUDIO_BUCKETS = new Set(['audio', 'test-audio']);

export const AUDIO_TOKEN_TTL_SEC = DEFAULT_TTL_SEC;
