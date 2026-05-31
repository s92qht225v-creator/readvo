/**
 * Client-safe audio URL helpers (no secrets — safe in the browser bundle).
 *
 * Audio is served through the auth-gated proxy `/api/audio/<bucket>/<path>`
 * instead of the raw public Supabase Storage URL, so the real file URL is
 * never exposed and a grabbed link expires quickly. `protectAudioUrl`
 * rewrites a public Storage URL into the proxied form; `<bucket>` is the
 * first path segment after `/object/public/`.
 */

const PUBLIC_MARKER = '/storage/v1/object/public/';

/**
 * Rewrite a public Supabase Storage URL to the proxied `/api/audio/...`
 * form, appending the short-lived access token. Non-storage URLs (e.g. a
 * local `/audio/...` path or an unrelated URL) are returned unchanged.
 */
export function protectAudioUrl(publicUrl: string, token: string): string {
  if (!publicUrl) return publicUrl;
  const i = publicUrl.indexOf(PUBLIC_MARKER);
  if (i === -1) return publicUrl; // not a Supabase public Storage URL — leave as-is
  const rest = publicUrl.slice(i + PUBLIC_MARKER.length); // e.g. "audio/HSK%201/..mp3"
  const sep = rest.includes('?') ? '&' : '?';
  return `/api/audio/${rest}${sep}t=${encodeURIComponent(token)}`;
}

/** Whether a URL points at Supabase public Storage (i.e. is proxy-eligible). */
export function isStorageUrl(url: string | null | undefined): boolean {
  return !!url && url.includes(PUBLIC_MARKER);
}
