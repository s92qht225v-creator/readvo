/**
 * Shared MiMo TTS URL resolver.
 *
 * Hits `/api/tts`, which checks the Supabase cache first and generates +
 * caches via MiMo on a miss. Returns a playable URL — a Supabase public
 * URL when cached/uploaded, or a `blob:` URL built from the base64
 * fallback — or `null` when TTS is unavailable.
 *
 * Results are memoized per text for the session, and concurrent calls for
 * the same text share a single in-flight request (so prefetching N
 * sentences and then tapping one never generates the same audio twice).
 */
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

export async function resolveTtsUrl(text: string): Promise<string | null> {
  const key = (text ?? '').trim();
  if (!key) return null;

  const cached = cache.get(key);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const request = (async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: key }),
      });
      if (!res.ok) return null;

      const data = await res.json();

      // API returns { url } when the audio is cached/uploaded in Supabase.
      if (data.url) {
        cache.set(key, data.url);
        return data.url;
      }

      // Fallback: { audio } base64 (upload failed but generation worked).
      if (data.audio) {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
        cache.set(key, url);
        return url;
      }

      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}
