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
/* ─────────────────────────────────────────────────────────────────────
   ⏸ PAUSED — audio protection is on hold until the audio content is final.
   These are intentionally no-ops so audio plays DIRECTLY from the public
   URL (no proxy hop, no token request, original fast behaviour). The proxy
   plumbing (/api/audio routes, url.ts, token.ts, the consumer wiring) is
   left in place, dormant. To RE-ENABLE, restore the real implementations
   below (see git history: "Phase 1/2: audio proxy") and decide the bucket
   strategy (private `audio` bucket vs a separate private bucket for just
   dialogue + karaoke + test audio).
   ───────────────────────────────────────────────────────────────────── */

/** PAUSED: always null (no token in use). */
export function getCachedAudioToken(): string | null {
  return null;
}

/** PAUSED: no-op (no token fetch). */
export async function primeAudioToken(_getAccessToken: () => Promise<string | null>): Promise<string | null> {
  return null;
}

/** PAUSED: returns the public URL unchanged (no proxy). */
export function protectAudioUrlSync(publicUrl: string): string {
  return publicUrl;
}
