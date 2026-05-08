'use client';

import Link, { type LinkProps } from 'next/link';
import { type AnchorHTMLAttributes, type ReactNode, useCallback, useSyncExternalStore } from 'react';
import { cleanTestHref, resolveTestHref, shouldUseInternalTestPath } from '@/lib/test/paths';

type TestLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | 'href'> &
  LinkProps & {
    href: string;
    children: ReactNode;
  };

export function TestLink({ href, children, ...props }: TestLinkProps) {
  const { onClick, ...restProps } = props;
  const getSnapshot = useCallback(() => cleanTestHref(href), [href]);
  const getServerSnapshot = useCallback(() => cleanTestHref(href), [href]);
  const resolvedHref = useSyncExternalStore(
    subscribeNoop,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <Link
      href={resolvedHref}
      {...restProps}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0 ||
          !href.startsWith('/')
        ) {
          return;
        }
        if (shouldUseInternalTestPath()) {
          event.preventDefault();
          window.location.assign(resolveTestHref(href));
        }
      }}
    >
      {children}
    </Link>
  );
}

function subscribeNoop() {
  return () => {};
}
