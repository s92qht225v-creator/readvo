'use client';

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * useState that survives navigation, backed by localStorage.
 *
 * For reader preferences — pinyin, translation, font size — which are a
 * property of the reader rather than of the thing being read. Re-toggling them
 * on every dialogue is the whole reason this exists.
 *
 * The stored value is applied in an effect rather than in a lazy initialiser:
 * an initialiser that reads localStorage renders something different on the
 * server than on the client, which is a hydration mismatch. The reader fetches
 * its content client-side, so this effect has long since run by the time there
 * is any text to show — the default is never visibly on screen.
 *
 * `accept` rejects corrupt or out-of-range stored values, falling back to the
 * default. Nothing but this hook writes these keys, but a bad number reaching
 * `fontSize` would render the reader unusable and it costs one line to prevent.
 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  accept?: (v: unknown) => v is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  // State, not a ref: the write effect below must re-run once reading is done.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (!accept || accept(parsed)) setValue(parsed as T);
      }
    } catch {
      // Private mode, disabled storage, or a corrupt value — keep the default.
    }
    setHydrated(true);
    // `accept` is a stable predicate at every call site; re-reading storage on
    // an identity change would clobber whatever the user has since toggled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // Skip the first pass: writing before the read completes would persist the
    // default over the value we are about to load.
    if (!hydrated) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota or private mode — the preference just doesn't outlive the tab.
    }
  }, [key, value, hydrated]);

  return [value, setValue];
}
