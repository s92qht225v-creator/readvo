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
import { ArabicDialogueVocab, type ArabicVocabItem } from './ArabicDialogueVocab';
import { arabicScriptConfig, type ReaderSentence } from '@/lib/reader/scriptConfig';
import { resolveTtsUrlAr } from '@/utils/ttsAudioAr';
import type { Language } from '@/types/ui-state';

export interface ArabicDialogueMeta {
  /** Content type: 'dialogue' (default) or 'story' — selects the gated content API. */
  kind?: 'dialogue' | 'story';
  level: string;
  slug: string;
  title: string;
  translit: string;
  titleTranslation_uz: string;
  titleTranslation_ru: string;
  titleTranslation_en: string;
}

interface ApiSentence {
  id: string;
  speaker?: 'A' | 'B';
  ar_m?: string; translit_m?: string;
  ar_f?: string; translit_f?: string;
  ar?: string; translit?: string;
  text_translation_uz: string; text_translation_ru: string; text_translation_en: string;
  // Optional female-version translations (e.g. a line that names the speaker —
  // the gloss flips with the 👨/👩 toggle). Fall back to the base when absent.
  text_translation_uz_f?: string; text_translation_ru_f?: string; text_translation_en_f?: string;
  audio_url?: string;    // curated recording for the male (ar_m) wording
  audio_url_f?: string;  // curated recording for the female (ar_f) wording
}
interface ApiDialogue { id: string; sentences: ApiSentence[]; vocab?: ArabicVocabItem[]; }

function trOf(s: ApiSentence, lang: Language, mode: 'm' | 'f' = 'm'): string {
  if (mode === 'f') {
    const f = lang === 'ru' ? s.text_translation_ru_f : lang === 'en' ? s.text_translation_en_f : s.text_translation_uz_f;
    if (f) return f;
  }
  return lang === 'ru' ? s.text_translation_ru : lang === 'en' ? s.text_translation_en : s.text_translation_uz;
}

export function ArabicDialogueReader({ meta }: { meta: ArabicDialogueMeta }) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language] = useLanguage();
  const [dialogue, setDialogue] = useState<ApiDialogue | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  const [genderMode, setGenderMode] = useState<'m' | 'f'>('m');
  const [tab, setTab] = useState<'dialog' | 'words'>('dialog');

  const vocab = dialogue?.vocab ?? [];
  const hasVocab = vocab.length > 0;
  const isStory = meta.kind === 'story';

  // A dialogue is gendered iff any sentence carries both gender wordings.
  const isGendered = (dialogue?.sentences ?? []).some((s) => s.ar_m && s.ar_f);
  // A story has no gendered wording, but can still offer a male/female narrator
  // when both recordings exist — the FAB then only swaps the voice, not the text.
  const hasFemaleAudio = (dialogue?.sentences ?? []).some((s) => s.audio_url_f);
  const showGenderFab = isGendered || hasFemaleAudio;
  // Stories always show the tab bar (Story | Words); dialogues only when they
  // carry vocabulary. The Words tab shows a placeholder until vocab is authored.
  const showTabs = hasVocab || isStory;

  // Google ar-XA Chirp 3 HD voice per (mode, speaker): two distinct voices each.
  const voiceFor = (speaker: 'A' | 'B' | undefined): string =>
    genderMode === 'm'
      ? (speaker === 'B' ? 'ar-XA-Chirp3-HD-Fenrir' : 'ar-XA-Chirp3-HD-Charon')
      : (speaker === 'B' ? 'ar-XA-Chirp3-HD-Kore' : 'ar-XA-Chirp3-HD-Aoede');

  const arOf = (s: ApiSentence): string =>
    genderMode === 'm' ? (s.ar_m ?? s.ar ?? '') : (s.ar_f ?? s.ar ?? '');
  const translitOf = (s: ApiSentence): string =>
    genderMode === 'm' ? (s.translit_m ?? s.translit ?? '') : (s.translit_f ?? s.translit ?? '');

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/arabic/${meta.kind === 'story' ? 'story' : 'dialogue'}/${meta.level}/${meta.slug}`, {
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
    text: arOf(s),
    translit: translitOf(s),
    translation: trOf(s, language, genderMode),
    speaker: s.speaker,
    audioText: arOf(s),
    // Curated recordings per gender wording: Omar for male (ar_m), the female
    // voice for female (ar_f). Falls back to TTS if a side has no recording.
    audioUrl: genderMode === 'm' ? s.audio_url : s.audio_url_f,
    voice: isGendered ? voiceFor(s.speaker) : undefined,
  }));

  const resolveAudio = useCallback(
    (s: ReaderSentence) => resolveTtsUrlAr(s.audioText, s.voice),
    [],
  );

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
        {status === 'loaded' && dialogue && showTabs && (
          <div className="dr-tabs">
            <div className="dr-tabs__inner">
              <button type="button" className={`dr-tabs__tab ${tab === 'dialog' ? 'dr-tabs__tab--active' : ''}`} onClick={() => setTab('dialog')} aria-pressed={tab === 'dialog'}>
                {(isStory
                  ? { uz: 'Hikoya', ru: 'История', en: 'Story' }
                  : { uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' } as Record<string, string>)[language]}
              </button>
              <button type="button" className={`dr-tabs__tab ${tab === 'words' ? 'dr-tabs__tab--active' : ''}`} onClick={() => setTab('words')} aria-pressed={tab === 'words'}>
                {({ uz: "So'zlar", ru: 'Слова', en: 'Words' } as Record<string, string>)[language]}
              </button>
            </div>
          </div>
        )}

        {status === 'loaded' && dialogue && tab === 'words' && hasVocab && (
          <ArabicDialogueVocab words={vocab} language={language} />
        )}
        {status === 'loaded' && dialogue && tab === 'words' && !hasVocab && (
          <p className="dialogues__empty">
            {({ uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' } as Record<string, string>)[language]}
          </p>
        )}

        {status === 'loaded' && dialogue && (tab === 'dialog' || !showTabs) && (
          <ReaderCore
            config={arabicScriptConfig}
            sentences={sentences}
            resolveAudio={resolveAudio}
            labels={{ translation: ({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language] }}
            fabExtra={showGenderFab ? (
              <button
                type="button"
                className="ar-gender-fab"
                onClick={() => setGenderMode((g) => (g === 'm' ? 'f' : 'm'))}
                aria-label={genderMode === 'm' ? 'Switch to female version' : 'Switch to male version'}
              >
                {genderMode === 'm' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="15" r="5" />
                    <line x1="12.5" y1="11.5" x2="20" y2="4" />
                    <polyline points="14 4 20 4 20 10" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="9" r="5" />
                    <line x1="12" y1="14" x2="12" y2="21" />
                    <line x1="9" y1="18" x2="15" y2="18" />
                  </svg>
                )}
              </button>
            ) : undefined}
          />
        )}
      </div>
      <PageFooter />
    </>
  );
}
