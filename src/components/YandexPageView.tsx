'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    ym?: (id: number, action: string, url?: string) => void;
  }
}

export function YandexPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.ym) {
      window.ym(107194604, 'hit', pathname);
    }
  }, [pathname]);

  return null;
}
