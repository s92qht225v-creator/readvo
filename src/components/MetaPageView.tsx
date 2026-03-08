'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/utils/analytics';

function MetaPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip the very first render — layout.tsx already fires PageView on load
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    trackEvent('PageView');
  }, [pathname, searchParams]);

  return null;
}

export function MetaPageView() {
  return (
    <Suspense fallback={null}>
      <MetaPageViewInner />
    </Suspense>
  );
}
