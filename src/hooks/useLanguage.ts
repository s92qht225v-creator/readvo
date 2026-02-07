'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Language } from '../types/ui-state';

const STORAGE_KEY = 'readvo-language';

/**
 * Persistent language hook.
 * Reads/writes to localStorage so the UZ/RU choice survives navigation.
 * Starts with 'uz' (SSR-safe), then syncs from localStorage on mount.
 */
export function useLanguage(): [Language, () => void] {
  const [language, setLanguage] = useState<Language>('uz');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'uz' || stored === 'ru') {
      setLanguage(stored);
    }
  }, []);

  const toggle = useCallback(() => {
    setLanguage((prev) => {
      const next: Language = prev === 'uz' ? 'ru' : 'uz';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return [language, toggle];
}
