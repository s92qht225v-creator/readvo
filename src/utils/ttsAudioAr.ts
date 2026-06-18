const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

/** Resolve a playable Arabic TTS URL for `text` (Supabase-cached, memoized). */
export async function resolveTtsUrlAr(text: string): Promise<string | null> {
  const key = (text ?? '').trim();
  if (!key) return null;
  const cached = cache.get(key);
  if (cached) return cached;
  const existing = inflight.get(key);
  if (existing) return existing;

  const request = (async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/tts-ar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: key }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.url) { cache.set(key, data.url); return data.url; }
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
