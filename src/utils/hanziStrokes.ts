/**
 * Shared hanzi stroke-data loader.
 *
 * Stroke data is fetched once per character from the hanzi-writer-data CDN and
 * kept in a module-level cache for the rest of the session. Keeping this in a
 * tiny standalone module (rather than inside HanziCanvas) lets list pages call
 * `prefetchHanzi()` to warm the cache without pulling the whole canvas engine
 * into their bundle.
 */

export interface StrokeData {
  path: string;
  median: Array<[number, number]>;
}

// Module-level cache: avoids re-fetching character data on revisit.
export const strokeCache = new Map<string, StrokeData[]>();

// In-flight requests, so a prefetch and the canvas mount (or two canvases)
// never fire duplicate fetches for the same character.
const strokePromises = new Map<string, Promise<StrokeData[]>>();

/**
 * Fetch a character's stroke data, sharing one request across all callers.
 * Resolves instantly from `strokeCache` on a repeat hit.
 */
export function loadStrokes(char: string): Promise<StrokeData[]> {
  const cached = strokeCache.get(char);
  if (cached) return Promise.resolve(cached);
  const existing = strokePromises.get(char);
  if (existing) return existing;

  const promise = fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    })
    .then((data) => {
      const strokes: StrokeData[] = (data.strokes || []).map(
        (path: string, idx: number) => ({ path, median: data.medians?.[idx] || [] })
      );
      strokeCache.set(char, strokes);
      return strokes;
    })
    .finally(() => { strokePromises.delete(char); });

  strokePromises.set(char, promise);
  return promise;
}

/**
 * Warm the cache for a batch of characters ahead of time, so the canvas
 * renders instantly when the user reaches them. Skips non-CJK input,
 * already-cached, and in-flight characters. Fire-and-forget.
 */
export function prefetchHanzi(chars: Iterable<string>): void {
  for (const c of chars) {
    if (c && /[㐀-鿿]/.test(c)) loadStrokes(c).catch(() => {});
  }
}
