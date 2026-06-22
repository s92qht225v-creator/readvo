import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOCALES = new Set(routing.locales);

// Routes that require authentication (matched after stripping locale prefix)
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.|flashcards\/.|writing\/.)|^\/arabic\/dialogues\/[^/]+\/.|^\/arabic\/flashcards\/./;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // Canonical host: fold the www host onto the bare domain so the site has a
  // single canonical domain (no duplicate-content split across www / non-www).
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    // Set hostname (not host) and clear the port explicitly: the WHATWG `host`
    // setter ignores the port when the value has no colon, so behind the proxy
    // it would otherwise leak the internal :3000 into the redirect target.
    url.hostname = host.replace(/^www\./, '');
    url.port = '';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

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

  // /arabic root → the Dialogues catalog (Arabic has one section in v1).
  const arRootMatch = pathname.match(/^\/(uz|ru|en)\/arabic\/?$/);
  if (arRootMatch) {
    const dest = request.nextUrl.clone();
    dest.searchParams.delete('tab');
    dest.pathname = `/${arRootMatch[1]}/arabic/dialogues`;
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

  // Redirect legacy book-first flashcard URLs to section-first (301 permanent).
  // Order matters: the static `mix` and `topic` patterns must precede the
  // generic lessons pattern so they match first.
  const fcMix = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk\d\/flashcards\/mix$/);
  if (fcMix) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${fcMix[1]}/chinese/flashcards/mix`;
    return NextResponse.redirect(dest, 301);
  }
  const fcTopic = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk\d\/flashcards\/topic\/(.+)$/);
  if (fcTopic) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${fcTopic[1]}/chinese/flashcards/topics/${fcTopic[2]}`;
    return NextResponse.redirect(dest, 301);
  }
  const fcLesson = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk(\d)\/flashcards\/(.+)$/);
  if (fcLesson) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${fcLesson[1]}/chinese/flashcards/hsk${fcLesson[2]}/${fcLesson[3]}`;
    return NextResponse.redirect(dest, 301);
  }

  // Redirect legacy book-first writing URLs to section-first (301 permanent).
  // Old: /chinese/hsk1/writing/{setId}. The set id's legacy prefix maps to the
  // user-facing HSK level (HSK 2.0 only): hsk2-set* → hsk1, hsk2-l2-set* → hsk2,
  // hsk{3..6}-set* → hsk{3..6}. The old HSK 3.0 sets (hsk1-set*) are no longer
  // linked from the writing catalog, so they redirect to the catalog itself.
  const wr = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk1\/writing\/(.+)$/);
  if (wr) {
    const [, loc, setId] = wr;
    const dest = request.nextUrl.clone();
    let target = `/${loc}/chinese/writing`;
    let m: RegExpMatchArray | null;
    if ((m = setId.match(/^hsk2-l2-set(\d+)$/))) target = `/${loc}/chinese/writing/hsk2/set${m[1]}`;
    else if ((m = setId.match(/^hsk2-set(\d+)$/))) target = `/${loc}/chinese/writing/hsk1/set${m[1]}`;
    else if ((m = setId.match(/^hsk([3-6])-set(\d+)$/))) target = `/${loc}/chinese/writing/hsk${m[1]}/set${m[2]}`;
    dest.pathname = target;
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
