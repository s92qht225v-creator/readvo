'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface StarEntry {
  section_type: string;
  section_id: string;
  stars: number;
  completed_at: string;
}

/**
 * Hook to read/write star progress for a given section type.
 *
 * Usage:
 *   const { stars, getStars, setStars, loading } = useStars('grammar');
 *   const grammarStars = getStars('shi'); // 0-3 or undefined
 *   await setStars('shi', 3);             // saves to server
 */
export function useStars(sectionType: string) {
  const { getAccessToken } = useAuth();
  const [entries, setEntries] = useState<StarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) { setLoading(false); return; }

        const res = await fetch(`/api/stars?type=${encodeURIComponent(sectionType)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) { setLoading(false); return; }

        const data = await res.json();
        if (!cancelled) setEntries(data.stars ?? []);
      } catch {
        // silently fail — stars are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [sectionType, getAccessToken]);

  /** Get star count for a specific section (undefined if not completed) */
  const getStars = useCallback(
    (sectionId: string): number | undefined => {
      const entry = entries.find(
        (e) => e.section_type === sectionType && e.section_id === sectionId
      );
      return entry?.stars;
    },
    [entries, sectionType]
  );

  /** Save star rating — updates local state optimistically + persists to server */
  const saveStars = useCallback(
    async (sectionId: string, stars: number) => {
      // Optimistic update
      setEntries((prev) => {
        const filtered = prev.filter(
          (e) => !(e.section_type === sectionType && e.section_id === sectionId)
        );
        return [
          ...filtered,
          { section_type: sectionType, section_id: sectionId, stars, completed_at: new Date().toISOString() },
        ];
      });

      // Persist
      try {
        const token = await getAccessToken();
        if (!token) return;

        await fetch('/api/stars', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ section_type: sectionType, section_id: sectionId, stars }),
        });
      } catch {
        // silently fail — optimistic state remains
      }
    },
    [sectionType, getAccessToken]
  );

  return { stars: entries, getStars, saveStars, loading };
}
