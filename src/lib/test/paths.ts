const TEST_APP_PREFIX = '/test-app';

export function cleanTestHref(href: string): string {
  if (!href.startsWith(TEST_APP_PREFIX)) return href;
  const clean = href.slice(TEST_APP_PREFIX.length);
  return clean || '/';
}

export function shouldUseInternalTestPath(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.host;
  const isTestHost = host === 'test.blim.uz' || host.startsWith('test.localhost');
  return !isTestHost && window.location.pathname.startsWith(TEST_APP_PREFIX);
}

export function resolveTestHref(href: string): string {
  if (!href.startsWith('/')) return href;
  const cleanHref = cleanTestHref(href);
  if (typeof window === 'undefined') return href;

  if (!shouldUseInternalTestPath()) return cleanHref;
  return `${TEST_APP_PREFIX}${cleanHref}`;
}

export function navigateToTestHref(href: string, replace = false) {
  const target = resolveTestHref(href);
  if (replace) window.location.replace(target);
  else window.location.assign(target);
}
