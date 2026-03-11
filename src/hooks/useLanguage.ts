'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Language } from '../types/ui-state';

const STORAGE_KEY = 'readvo-language';
const COOKIE_KEY = 'blim-language';
const LANGUAGE_CHANGE_EVENT = 'readvo-language-change';
const VALID_LANGUAGES: Language[] = ['uz', 'ru', 'en'];

function setCookie(lang: Language) {
  document.cookie = `${COOKIE_KEY}=${lang}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

/**
 * Persistent language hook.
 * Reads/writes to localStorage + cookie so the language choice survives navigation.
 * Cookie is read server-side by next-intl for SSR.
 * Syncs across all hook instances on the same page via a custom event.
 * Starts with 'uz' (SSR-safe), then syncs from localStorage on mount.
 */
export function useLanguage(): [Language, () => void, (lang: Language) => void] {
  const [language, setLanguage] = useState<Language>('uz');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_LANGUAGES.includes(stored as Language)) {
      setLanguage(stored as Language);
      setCookie(stored as Language);
    } else if (navigator.language?.startsWith('ru')) {
      setLanguage('ru');
      setCookie('ru');
    } else if (navigator.language?.startsWith('uz')) {
      setLanguage('uz');
      setCookie('uz');
    } else {
      setLanguage('en');
      setCookie('en');
    }

    const handleChange = (e: Event) => {
      const lang = (e as CustomEvent<Language>).detail;
      if (VALID_LANGUAGES.includes(lang)) setLanguage(lang);
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
  }, []);

  const applyLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setCookie(lang);
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: lang }));
  }, []);

  const toggle = useCallback(() => {
    const cycle: Language[] = ['uz', 'ru', 'en'];
    const idx = cycle.indexOf(language);
    const next = cycle[(idx + 1) % cycle.length];
    applyLanguage(next);
  }, [language, applyLanguage]);

  const set = useCallback((lang: Language) => {
    applyLanguage(lang);
  }, [applyLanguage]);

  return [language, toggle, set];
}
