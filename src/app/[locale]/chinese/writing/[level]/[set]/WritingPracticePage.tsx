'use client';

import React, { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { HanziWriterPractice } from '@/components/HanziWriterPractice';
import { RubyText } from '@/components/RubyText';
import { WritingTest } from '@/components/WritingTest';
import type { HanziWord } from '@/services/writing';
import { trackAll } from '@/utils/analytics';

interface Props {
  setId: string;
  /** URL level segment ('hsk1'..'hsk6') — the user-facing HSK level. The
   *  setId prefix is NOT this (legacy naming: 'hsk2-*' = HSK 2.0 standard,
   *  level 1), so the displayed label must come from the URL. */
  level: string;
  title: string;
  title_ru: string;
  words: HanziWord[];
}

export function WritingPracticePage({ setId, level, title, title_ru, words }: Props) {
  // Mirrors the dialogue-reader pattern: everyone (logged-in or not) first
  // sees a public, crawlable preview — the set's characters with pinyin,
  // meaning, stroke count and example sentences. The floating CTA reveals
  // the interactive practice in place for signed-in users and sends
  // anonymous visitors to /login. During SSR the preview is what gets
  // prerendered, so the static HTML carries real content for crawlers.
  // (Most sets are additionally gated server-side by src/proxy.ts; only the
  // PUBLIC_PREVIEW_PATHS pilot is reachable anonymously.)
  const { user } = useAuth();
  const [language] = useLanguage();
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [subtab, setSubtab] = useState<'writing' | 'chars' | 'test'>('writing');
  const isHsk2L2 = setId.startsWith('hsk2-l2-');
  const isHsk2 = setId.startsWith('hsk2-') && !isHsk2L2;
  const isHsk3 = setId.startsWith('hsk3-');
  const isHsk4 = setId.startsWith('hsk4-');
  const isHsk5 = setId.startsWith('hsk5-');
  const isHsk6 = setId.startsWith('hsk6-');
  const backUrl = isHsk6 ? '/chinese/writing?version=2.0&hsk=6' : isHsk5 ? '/chinese/writing?version=2.0&hsk=5' : isHsk4 ? '/chinese/writing?version=2.0&hsk=4' : isHsk2L2 ? '/chinese/writing?version=2.0&hsk=2' : isHsk3 ? '/chinese/writing?version=2.0&hsk=3' : isHsk2 ? '/chinese/writing?version=2.0' : '/chinese/writing?version=3.0';
  const hskLabel = /^hsk[1-6]$/.test(level) ? `HSK ${level.slice(3)}` : 'HSK 1';

  const T = (uz: string, ru: string, en: string) => (({ uz, ru, en } as Record<string, string>)[language] ?? uz);
  const meaningOf = (w: HanziWord) => (language === 'ru' ? w.ru : language === 'en' ? (w.en || w.uz) : w.uz);
  const exMeaningOf = (w: HanziWord) => (language === 'ru' ? w.exru : language === 'en' ? (w.exen || w.exuz) : w.exuz);
  const setTitle = language === 'ru' ? title_ru : language === 'en' ? title_ru.replace('Набор', 'Set') : title;

  // Analytics: track writing practice view
  useEffect(() => {
    trackAll('ViewContent', 'writing_view', 'writing_view', {
      content_name: `Writing: ${title}`,
      content_category: 'Writing',
      content_type: 'product',
    });
  }, [title]);

  const ctaLabel = T('Yozishni mashq qilish', 'Практиковать написание', 'Practice writing');

  return (
    <main className="home">
      <div className="dr-hero">
        <div className="dr-hero__watermark">写</div>
        <div className="dr-hero__top-row">
          <button
            className="dr-back-btn"
            type="button"
            onClick={() => router.push(backUrl)}
            aria-label="Orqaga"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <BannerMenu />
        </div>
        <div className="dr-hero__body">
          <div className="dr-hero__level">{hskLabel} · {T('Yozish', 'Письмо', 'Writing')}</div>
          <h1 className="dr-hero__title">写字</h1>
          <div className="dr-hero__pinyin">xiězì</div>
          <div className="dr-hero__translation">— {setTitle} —</div>
        </div>
      </div>
      {revealed && (
        <nav className="lp__tabs">
          <div className="lp__tabs-inner">
            <button
              className={`lp__tab ${subtab === 'writing' ? 'lp__tab--active' : ''}`}
              onClick={() => setSubtab('writing')}
              type="button"
            >
              {T('Yozish', 'Письмо', 'Writing')}
            </button>
            <button
              className={`lp__tab ${subtab === 'test' ? 'lp__tab--active' : ''}`}
              onClick={() => setSubtab('test')}
              type="button"
            >
              {T('Diktant', 'Диктант', 'Dictation')}
            </button>
          </div>
        </nav>
      )}
      <section className="home__content">
        {!revealed ? (
          <>
            {/* ── Public, crawlable preview (shown to everyone until reveal) ── */}
            <div className="dlg-preview">
              <div className="dlg-intro">
                <div className="dlg-category">{hskLabel} · {T('Yozish', 'Письмо', 'Writing')}</div>
                <h2 className="dlg-intro__title">{setTitle} — {T('10 ta ieroglif', '10 иероглифов', '10 characters')}</h2>
                <p className="dlg-desc">
                  {(() => {
                    // Include the set's own characters so every set page's
                    // intro text is unique (duplicated intros across ~40 set
                    // pages would look templated to search engines).
                    const charList = words.map((w) => w.char).join('、');
                    return T(
                      `Ushbu to'plamda ${hskLabel} darajasidagi ${words.length} ta ieroglif bor: ${charList} — har biri pinyin, ma'nosi, chiziqlar soni va misol gap bilan. Har bir belgini interaktiv tarzda, chiziqma-chiziq yozishni mashq qilish uchun kiring.`,
                      `В этом наборе ${words.length} иероглифов уровня ${hskLabel}: ${charList} — каждый с пиньинь, значением, числом черт и примером. Войдите, чтобы тренировать написание каждого знака черта за чертой.`,
                      `This set covers ${words.length} ${hskLabel} characters: ${charList} — each with pinyin, meaning, stroke count and an example sentence. Sign in to practice writing each character stroke by stroke.`,
                    );
                  })()}
                </p>
              </div>

              {/* One mini dictionary entry per character — heading + strokes/
                  radical facts + example sentence. All plain, crawlable text. */}
              {words.map((w) => {
                const radicalName = language === 'ru' ? w.radicalRu : language === 'en' ? (w.radicalEn || w.radicalUz) : w.radicalUz;
                return (
                  <div className="dlg-intro" key={w.char}>
                    <h3 className="dlg-intro__title" style={{ marginBottom: 6 }}>
                      <span lang="zh-Hans">{w.char}</span> ({w.pinyin}) — {meaningOf(w)}
                    </h3>
                    <div className="dlg-desc">
                      <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                        {w.strokes} {T('chiziq', 'черт', 'strokes')}
                        {w.radical && <> · {T('kalit', 'ключ', 'radical')}: <span lang="zh-Hans">{w.radical}</span>{radicalName ? ` (${radicalName})` : ''}</>}
                      </p>
                      {w.ex && w.expy && (
                        <p style={{ margin: '10px 0 0', fontSize: 15 }}>
                          <span lang="zh-Hans" style={{ fontSize: 26, lineHeight: 2 }}>
                            <RubyText text={w.ex} pinyin={w.expy} showPinyin />
                          </span>
                          {' — '}{exMeaningOf(w)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating CTA: signed-in users reveal the practice in place,
                anonymous visitors go to login (same as dialogue previews). */}
            {user ? (
              <button type="button" className="dlg-read-cta dlg-read-cta--float" onClick={() => setRevealed(true)}>
                {ctaLabel}
              </button>
            ) : (
              <Link href="/login" className="dlg-read-cta dlg-read-cta--float">
                {ctaLabel}
              </Link>
            )}
          </>
        ) : subtab === 'test' ? (
          <WritingTest
            words={words}
            lang={language}
            setId={setId}
            onDone={() => router.push(backUrl)}
          />
        ) : (
          <HanziWriterPractice
            lang={language}
            words={words}
            onBack={() => router.push(backUrl)}
            autoStart
            hideSubtabs
            subtab={subtab}
            onSubtabChange={(t) => setSubtab(t as 'writing' | 'chars' | 'test')}
          />
        )}
      </section>
      <PageFooter />
    </main>
  );
}
