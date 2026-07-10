'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Save & restore the window scroll position across a client-side navigation
 * such as: catalog → reader → browser Back.
 *
 * Next's native scroll restoration doesn't work reliably for these catalogs —
 * they're client components (filtered by tab/search/bookmark) wrapped in a
 * Suspense boundary with lazy-loading image banners, so on Back the list
 * renders *after* Next has already tried (and failed) to restore, landing the
 * user at the top.
 *
 * Usage: call `save()` right before navigating away (on the card's onClick).
 * On mount, once `ready` is true and the saved `sub` matches the current
 * `subKey` (so switching tabs/levels never jumps), the saved position is
 * restored once and then cleared.
 *
 * @param key      sessionStorage key unique to this catalog (e.g. 'dlg-scroll')
 * @param subKey   sub-list identifier — restore only when it matches what was
 *                 saved (e.g. the active HSK level). Prevents jumping when the
 *                 user returns to a different tab.
 * @param ready    only attempt the restore once the list has content laid out
 *                 (e.g. `filtered.length > 0`), so the page is tall enough.
 */
export function useScrollRestore(key: string, subKey: string, ready = true): () => void {
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current || !ready) return;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) { restored.current = true; return; }
      const saved = JSON.parse(raw) as { y: number; sub: string };
      // Wait for the right tab to become active (the sub-list sync may still
      // be pending after mount); if the user returned to a different tab we
      // simply never restore for this one.
      if (saved.sub !== subKey) return;
      restored.current = true;
      sessionStorage.removeItem(key);
      // Restore after two frames so the list (with reserved image space) has
      // painted and the page is at full height — mirrors HanziWriterPractice.
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved.y)));
    } catch {
      restored.current = true;
    }
  }, [key, subKey, ready]);

  return useCallback(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ y: window.scrollY, sub: subKey }));
    } catch {}
  }, [key, subKey]);
}
