'use client';

import { useState, useEffect } from 'react';

/** Read a URL query param on the client only (post-mount).
 *
 *  Unlike next/navigation's `useSearchParams`, this never opts a statically
 *  rendered page out of prerendering: with `useSearchParams`, everything under
 *  the Suspense boundary is deferred to the client on SSG pages, so the
 *  prerendered HTML contains no content at all (which is why crawlers saw
 *  empty shells on the landing/catalog pages). Here the server HTML renders
 *  with `null` and the real value applies right after hydration — deep links
 *  like `?dialhsk=2` still restore, just a frame later.
 */
export function useClientSearchParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after mount; SSR must not read search params
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value;
}
