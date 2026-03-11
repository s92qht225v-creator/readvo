import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOCALES = new Set(routing.locales);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the first path segment looks like a locale prefix but isn't a supported one
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match && !LOCALES.has(match[1] as 'uz' | 'ru' | 'en')) {
    // Replace the invalid locale prefix with the default locale
    const rest = pathname.slice(match[1].length + 1); // e.g. "/fr/chinese" → "/chinese"
    const url = request.nextUrl.clone();
    url.pathname = `/${routing.defaultLocale}${rest}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except: api routes, Next.js internals, auth callbacks, static files
  matcher: ['/((?!api|_next|auth|.*\\..*).*)'],
};
