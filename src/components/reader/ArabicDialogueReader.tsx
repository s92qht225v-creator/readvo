'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { Paywall } from '@/components/Paywall';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { ReaderCore } from './ReaderCore';
import { arabicScriptConfig, type ReaderSentence } from '@/lib/reader/scriptConfig';
import { resolveTtsUrlAr } from '@/utils/ttsAudioAr';
import type { Language } from '@/types/ui-state';

export interface ArabicDialogueMeta {
  level: string;
  slug: string;
  title: string;
  translit: string;
  titleTranslation_uz: string;
  titleTranslation_ru: string;
  titleTranslation_en: string;
}

interface ApiSentence {
  id: string; ar: string; translit: string;
  text_translation_uz: string; text_translation_ru: string; text_translation_en: string;
  speaker?: 'A' | 'B'; audio_url?: string;
}
interface ApiDialogue { id: string; sentences: ApiSentence[]; }

function trOf(s: ApiSentence, lang: Language): string {
  return lang === 'ru' ? s.text_translation_ru : lang === 'en' ? s.text_translation_en : s.text_translation_uz;
}

export function ArabicDialogueReader({ meta }: { meta: ArabicDialogueMeta }) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language] = useLanguage();
  const [dialogue, setDialogue] = useState<ApiDialogue | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/arabic/dialogue/${meta.level}/${meta.slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        setDialogue(data.dialogue as ApiDialogue);
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [meta.level, meta.slug, getAccessToken, authLoading]);

  const sentences: ReaderSentence[] = (dialogue?.sentences ?? []).map((s) => ({
    id: s.id,
    text: s.ar,
    translit: s.translit,
    translation: trOf(s, language),
    speaker: s.speaker,
    audioText: s.ar,
    audioUrl: s.audio_url,
  }));

  const resolveAudio = useCallback((s: ReaderSentence) => resolveTtsUrlAr(s.audioText), []);

  const titleTr = language === 'ru' ? meta.titleTranslation_ru : language === 'en' ? meta.titleTranslation_en : meta.titleTranslation_uz;

  if (authLoading) return <div className="loading-spinner" />;

  return (
    <>
      {status === 'locked' && <Paywall />}
      <div className="dialogue-reader theme-ar">
        <div className="dr-hero">
          <div className="dr-hero__watermark" aria-hidden="true">عربي</div>
          <div className="dr-hero__top-row">
            <Link href="/arabic/dialogues" className="dr-back-btn" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{meta.level.toUpperCase()} · Arabic</div>
            <h1 className="dr-hero__title" dir="rtl">{meta.title}</h1>
            <div className="dr-hero__pinyin" dir="ltr">{meta.translit}</div>
            <div className="dr-hero__translation">— {titleTr} —</div>
          </div>
        </div>

        {status === 'loading' && <div className="loading-spinner" />}
        {status === 'error' && <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>Could not load.</div>}
        {status === 'loaded' && dialogue && (
          <ReaderCore
            config={arabicScriptConfig}
            sentences={sentences}
            resolveAudio={resolveAudio}
            labels={{ translation: ({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language] }}
          />
        )}
      </div>
      <PageFooter />
    </>
  );
}
