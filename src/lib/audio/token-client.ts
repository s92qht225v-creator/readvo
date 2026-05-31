'use client';

/**
 * Client-side cache for the learning-audio access token. The token gates
 * the `/api/audio/...` proxy and is reused for every audio file in the
 * session (refreshed before it expires).
 *
 * Playback happens inside a user-gesture call stack (see useAudioPlayer),
 * which must stay synchronous — so the token is PRIMED ahead of time and
 * read synchronously at play time. If it isn't ready yet, callers fall back
 * to the original public URL, which is safe while the bucket is still
 * public (during the phased rollout). Once the bucket is private, priming
 * on mount guarantees the token is present before any play.
 */
import { protectAudioUrl } from './url';

let cached: { token: string; exp: number } | null = null;
let inflight: Promise<string | null> | null = null;

/** Synchronously return a still-valid cached token, or null. */
export function getCachedAudioToken(): string | null {
  if (cached && cached.exp > Date.now() / 1000 + 60) return cached.token;
  return null;
}

/** Fetch + cache the token (once; de-duped). Call early (on mount). */
export async function primeAudioToken(getAccessToken: () => Promise<string | null>): Promise<string | null> {
  const valid = getCachedAudioToken();
  if (valid) return valid;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const jwt = await getAccessToken();
      if (!jwt) return null;
      const res = await fetch('/api/audio/token', { headers: { Authorization: `Bearer ${jwt}` } });
      if (!res.ok) return null;
      const j = await res.json() as { token: string; expiresIn: number };
      cached = { token: j.token, exp: Math.floor(Date.now() / 1000) + (j.expiresIn ?? 3600) };
      return j.token;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Rewrite a public Storage URL to the proxied form using the cached token.
 * Falls back to the original URL when no token is cached yet (safe while
 * the bucket is public).
 */
export function protectAudioUrlSync(publicUrl: string): string {
  const t = getCachedAudioToken();
  return t ? protectAudioUrl(publicUrl, t) : publicUrl;
}
