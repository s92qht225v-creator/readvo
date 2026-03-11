'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import type { Language } from '../types/ui-state';

const CYCLE: Language[] = ['uz', 'ru', 'en'];

/**
 * Locale-aware language hook.
 * Reads locale from the URL (via next-intl routing).
 * Switching language navigates to the same path under the new locale prefix.
 * Same return signature as before: [language, toggle, set]
 */
export function useLanguage(): [Language, () => void, (lang: Language) => void] {
  const locale = useLocale() as Language;
  const router = useRouter();
  const pathname = usePathname();

  const set = useCallback((lang: Language) => {
    router.replace(pathname, { locale: lang });
  }, [router, pathname]);

  const toggle = useCallback(() => {
    const idx = CYCLE.indexOf(locale);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    set(next);
  }, [locale, set]);

  return [locale, toggle, set];
}
