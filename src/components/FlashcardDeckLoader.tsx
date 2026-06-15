'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useLanguage } from '../hooks/useLanguage';
import { FlashcardDeck } from './FlashcardDeck';
import { Paywall } from './Paywall';
import type { FlashcardDeckData } from '@/types';

interface Props {
  book: string;
  deckId: string;
  bookPath: string;
  backHref?: string;
  lessonTitle?: string;
  lessonPinyin?: string;
  lessonTitleTranslation?: string;
  lessonTitleTranslation_ru?: string;
}

export function FlashcardDeckLoader({ book, deckId, ...rest }: Props) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language] = useLanguage();
  const [deck, setDeck] = useState<FlashcardDeckData | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      setDeck(null);
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/flashcards/${book}/${deckId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        if (cancelled) return;
        setDeck(data.deck as FlashcardDeckData);
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [book, deckId, getAccessToken, reloadKey, authLoading]);

  if (authLoading || status === 'loading') return <div className="loading-spinner" />;
  if (status === 'locked') return <Paywall />;
  if (status === 'error') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7177', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <span>{({ uz: 'Yuklab boʻlmadi.', ru: 'Не удалось загрузить.', en: 'Could not load.' } as Record<string, string>)[language]}</span>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {({ uz: 'Qayta urinish', ru: 'Повторить', en: 'Retry' } as Record<string, string>)[language]}
        </button>
      </div>
    );
  }
  return <FlashcardDeck deck={deck!} {...rest} />;
}
