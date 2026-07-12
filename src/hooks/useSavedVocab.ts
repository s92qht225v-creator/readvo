'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

export interface SavedWord {
  zh: string; py: string; uz: string; ru: string; en: string; hsk?: number | null;
}

const keyOf = (zh: string, py: string) => `${zh}|${py}`;

/**
 * Client-side manager for the user's saved vocabulary ("My Vocabulary").
 * Loads the saved words once on mount (server-authoritative via /api/vocab),
 * and exposes optimistic add/remove. Used by the dialogue Words-tab "+" button
 * (isSaved + add), the catalog Vocabulary button (count), and the review deck
 * (words + remove).
 */
export function useSavedVocab() {
  const { getAccessToken } = useAuth();
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const savedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (!token) { if (!cancelled) setLoading(false); return; }
      try {
        const res = await fetch('/api/vocab', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (cancelled) return;
        const list: SavedWord[] = json.words ?? [];
        savedRef.current = new Set(list.map((w) => keyOf(w.zh, w.py)));
        setWords(list);
      } catch { /* leave empty */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  const isSaved = useCallback((zh: string, py: string) => savedRef.current.has(keyOf(zh, py)), []);

  const add = useCallback(async (w: SavedWord): Promise<boolean> => {
    const token = await getAccessToken();
    if (!token) return false;
    const k = keyOf(w.zh, w.py);
    if (savedRef.current.has(k)) return true;
    savedRef.current.add(k);
    setWords((prev) => [w, ...prev]);
    try {
      await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(w),
      });
      return true;
    } catch {
      return true; // keep optimistic; a refresh will reconcile
    }
  }, [getAccessToken]);

  const remove = useCallback(async (zh: string, py: string) => {
    const token = await getAccessToken();
    if (!token) return;
    savedRef.current.delete(keyOf(zh, py));
    setWords((prev) => prev.filter((w) => !(w.zh === zh && w.py === py)));
    try {
      await fetch('/api/vocab', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ zh, py }),
      });
    } catch { /* optimistic */ }
  }, [getAccessToken]);

  return { words, count: words.length, loading, isSaved, add, remove };
}
