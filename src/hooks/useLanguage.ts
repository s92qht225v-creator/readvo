'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Language } from '../types/ui-state';

const STORAGE_KEY = 'readvo-language';
const LANGUAGE_CHANGE_EVENT = 'readvo-language-change';

/**
 * Persistent language hook.
 * Reads/writes to localStorage so the UZ/RU choice survives navigation.
 * Syncs across all hook instances on the same page via a custom event.
 * Starts with 'uz' (SSR-safe), then syncs from localStorage on mount.
 */
export function useLanguage(): [Language, () => void, (lang: Language) => void] {
  const [language, setLanguage] = useState<Language>('uz');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'uz' || stored === 'ru') {
      setLanguage(stored);
    } else if (navigator.language?.startsWith('ru')) {
      setLanguage('ru');
    }

    const handleChange = (e: Event) => {
      const lang = (e as CustomEvent<Language>).detail;
      if (lang === 'uz' || lang === 'ru') setLanguage(lang);
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
  }, []);

  const applyLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: lang }));
  }, []);

  const toggle = useCallback(() => {
    const next: Language = language === 'uz' ? 'ru' : 'uz';
    applyLanguage(next);
  }, [language, applyLanguage]);

  const set = useCallback((lang: Language) => {
    applyLanguage(lang);
  }, [applyLanguage]);

  return [language, toggle, set];
}
