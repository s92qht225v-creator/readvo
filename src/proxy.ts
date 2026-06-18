import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOCALES = new Set(routing.locales);

// Routes that require authentication (matched after stripping locale prefix)
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.)/;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // Test creator subdomain: rewrite into the /test-app route group so URLs
  // stay clean (e.g. test.blim.uz/dashboard → /test-app/dashboard internally).
  // The locale middleware is skipped entirely for this hostname.
  const isTestHost = host === 'test.blim.uz' || host.startsWith('test.localhost');
  if (isTestHost) {
    if (!pathname.startsWith('/test-app')) {
      const url = request.nextUrl.clone();
      url.pathname = `/test-app${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Allow direct /test-app access on the main host (useful in dev when not
  // editing /etc/hosts). The intl middleware would otherwise redirect this
  // to /en/test-app and 404.
  if (pathname.startsWith('/test-app')) {
    return NextResponse.next();
  }

  // Check if the first path segment looks like a locale prefix but isn't a supported one
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match && !LOCALES.has(match[1] as 'uz' | 'ru' | 'en')) {
    // Replace the invalid locale prefix with the default locale
    const rest = pathname.slice(match[1].length + 1); // e.g. "/fr/chinese" → "/chinese"
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${rest}`;
    return NextResponse.redirect(url);
  }

  // The bare /chinese root is now the Dialogues catalog at /chinese/dialogues.
  // Redirect /chinese (and any legacy ?tab=) to the per-tab route (301 permanent,
  // preserving other query params like ?dialhsk).
  const TAB_ROUTES: Record<string, string> = { dialogues: 'dialogues', writing: 'writing', flashcards: 'flashcards', karaoke: 'karaoke', grammar: 'grammar' };
  const rootMatch = pathname.match(/^\/(uz|ru|en)\/chinese\/?$/);
  if (rootMatch) {
    const dest = request.nextUrl.clone();
    const tab = dest.searchParams.get('tab');
    dest.searchParams.delete('tab');
    const seg = tab && TAB_ROUTES[tab] ? TAB_ROUTES[tab] : 'dialogues';
    dest.pathname = `/${rootMatch[1]}/chinese/${seg}`;
    return NextResponse.redirect(dest, 301);
  }

  // Redirect legacy book-first dialogue URLs to section-first (301 permanent)
  const dlgReader = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk(\d)\/dialogues\/(.+)$/);
  if (dlgReader) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${dlgReader[1]}/chinese/dialogues/hsk${dlgReader[2]}/${dlgReader[3]}`;
    return NextResponse.redirect(dest, 301);
  }
  const dlgList = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk\d\/dialogues\/?$/);
  if (dlgList) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${dlgList[1]}/chinese/dialogues`;
    return NextResponse.redirect(dest, 301);
  }

  // Redirect legacy book-first karaoke URLs to section-first (301 permanent)
  const karaokeMatch = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk1\/karaoke\/(.+)$/);
  if (karaokeMatch) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${karaokeMatch[1]}/chinese/karaoke/${karaokeMatch[2]}`;
    return NextResponse.redirect(dest, 301);
  }

  // Server-side auth check: redirect unauthenticated users on protected routes
  // Skip in development (localhost) for dev mode
  if (process.env.NODE_ENV !== 'development') {
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
    if (localeMatch) {
      const pathWithoutLocale = localeMatch[2] || '/';
      if (PROTECTED_PATTERN.test(pathWithoutLocale)) {
        const hasAuth = request.cookies.get('blim-auth')?.value === '1';
        if (!hasAuth) {
          const locale = localeMatch[1];
          const url = request.nextUrl.clone();
          url.pathname = `/${locale}/login`;
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except: api routes, Next.js internals, auth callbacks, static files
  matcher: ['/((?!api|_next|auth|.*\\..*).*)'],
};
