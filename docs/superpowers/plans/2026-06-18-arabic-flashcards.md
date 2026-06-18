# Arabic Flashcards Section — Implementation Plan (Plan 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.
>
> **No unit-test harness in this repo** (no vitest/jest). Do NOT add one. Verify with `npm run build` (routes stay `●` SSG/ISR, never `ƒ`), throwaway `node -e` checks, `preview_*` tools, and production `curl`.

**Goal:** Add an Arabic Flashcards section: a public `/arabic/flashcards` catalog listing one flip-card deck per CEFR level, each opening a login-gated deck reader (vowelized Arabic front with a Harakat toggle + transliteration, translation on flip, know/don't-know scoring), reachable via a small shared Arabic tab bar (Dialogues | Flashcards). Ships one sample A1 deck.

**Architecture:** Mirror the Arabic dialogues flow (catalog → gated content endpoint → client reader). Build a NEW lean `ArabicFlashcardDeck` (Chinese `FlashcardDeck` untouched) reusing `stripHarakat` for the Harakat toggle. One deck JSON per level under `content/flashcards/arabic/`. A shared `ArabicCatalogTabs` makes Dialogues/Flashcards navigable.

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl, Supabase (existing `/api/tts-ar` for optional audio).

**Scope (Plan 3):** Flashcards section + the Arabic tab bar + one A1 deck. **Deferred:** more content (A2+ decks), full reader features (focus/play-all/Words tab), Stories.

**Prereqs (shipped):** `arabicScriptConfig`/`stripHarakat`; `resolveEntitlement`/`getUserIdFromJWT`; `resolveTtsUrlAr`; the dialogues catalog + `/arabic` redirect; auth gate on `/arabic/dialogues/[^/]+/.`.

---

### Task 0: Branch

- [ ] `git checkout main && git pull --ff-only origin main && git checkout -b arabic-flashcards`
- [ ] `npm run build` (baseline green).

---

### Task 1: Arabic flashcard types, loader, sample A1 deck

**Files:**
- Modify: `src/services/arabicContent.ts` (append)
- Create: `content/flashcards/arabic/a1.json`

- [ ] **Step 1: append to `src/services/arabicContent.ts`** (reuses the `fs`/`path` already imported there)

```ts
// ── Flashcards ───────────────────────────────────────────────────────────────

export interface ArabicFlashcard {
  id: string;
  ar: string;        // fully vowelized Arabic
  translit: string;  // Latin transliteration
  uz: string;
  ru: string;
  en: string;
}

export interface ArabicFlashcardDeck {
  id: string;
  level: string;     // 'a1'..'c2'
  title_uz: string;
  title_ru: string;
  title_en: string;
  cards: ArabicFlashcard[];
}

const FLASHCARD_ROOT = path.join(process.cwd(), 'content', 'flashcards', 'arabic');
const CEFR = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

/** Load one Arabic flashcard deck by CEFR level, or null. */
export function loadArabicFlashcardDeck(level: string): ArabicFlashcardDeck | null {
  if (!CEFR.includes(level)) return null;
  const file = path.join(FLASHCARD_ROOT, `${level}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as ArabicFlashcardDeck;
  } catch {
    return null;
  }
}

/** Levels that have a flashcard deck, with card counts (for the catalog). */
export function loadArabicFlashcardCatalog(): { level: string; count: number }[] {
  const out: { level: string; count: number }[] = [];
  for (const level of CEFR) {
    const d = loadArabicFlashcardDeck(level);
    if (d && d.cards.length > 0) out.push({ level, count: d.cards.length });
  }
  return out;
}
```

- [ ] **Step 2: author `content/flashcards/arabic/a1.json`** — the implementer writes the vowelized Arabic (do NOT paste Arabic through prompts; author it). Shape, with ~8 common A1 words (greeting/book/house/water/etc.), each fully vowelized:

```json
{
  "id": "arabic-a1",
  "level": "a1",
  "title_uz": "A1 so'zlar",
  "title_ru": "A1 слова",
  "title_en": "A1 words",
  "cards": [
    { "id": "1", "ar": "<vowelized>", "translit": "marḥaban", "uz": "salom", "ru": "привет", "en": "hello" }
    /* …~7 more A1 words, all `ar` fully vowelized with harakat… */
  ]
}
```

- [ ] **Step 3: verify** (parse + count + every `ar` vowelized: stripping harakat must shorten it):
```bash
node --input-type=module -e "
import fs from 'fs';
const d=JSON.parse(fs.readFileSync('content/flashcards/arabic/a1.json','utf8'));
const T=/[ً-ْٰ]/g;
const ok=d.cards.every(c=>c.ar&&c.translit&&c.uz&&c.ru&&c.en);
const vow=d.cards.every(c=>c.ar.replace(T,'').length < c.ar.length);
console.log('cards:', d.cards.length, 'fields:', ok, 'vowelized:', vow);
"
```
Expected: `cards: 8 fields: true vowelized: true` (count may differ; `fields` + `vowelized` MUST be true).

- [ ] **Step 4: build + commit**
```bash
npm run build
git add src/services/arabicContent.ts content/flashcards/arabic/
git commit -m "feat(arabic): flashcard types, loader, sample A1 deck"
```

---

### Task 2: Gated flashcard content endpoint

**Files:**
- Create: `src/app/api/content/arabic/flashcards/[level]/route.ts`

- [ ] **Step 1:** mirror the dialogue endpoint (JWT + entitlement):

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { loadArabicFlashcardDeck } from '@/services/arabicContent';

const LEVELS = new Set(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ level: string }> },
) {
  const { level } = await params;
  if (!LEVELS.has(level)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) {
    return NextResponse.json({ locked: true }, { status: 401 });
  }

  const { entitled } = await resolveEntitlement(userId);
  if (!entitled) {
    return NextResponse.json({ locked: true }, { status: 402 });
  }

  const deck = loadArabicFlashcardDeck(level);
  if (!deck) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ deck }, { headers: { 'Cache-Control': 'no-store, private' } });
}
```

- [ ] **Step 2:** `npm run build` (expect `ƒ /api/content/arabic/flashcards/[level]`). Commit:
```bash
git add src/app/api/content/arabic/flashcards/
git commit -m "feat(arabic): gated flashcard content endpoint"
```

---

### Task 3: `ArabicFlashcardDeck` component (flip-card deck)

**Files:**
- Create: `src/components/reader/ArabicFlashcardDeck.tsx`

A lean client deck: fetch the gated deck, show one flip card at a time (front: vowelized Arabic + Harakat toggle + transliteration; back: translation), Know/Don't-know buttons advance + score, a progress bar, and a completion screen with restart. Optional tap-to-hear via `resolveTtsUrlAr`.

- [ ] **Step 1: write the component**

```tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { Paywall } from '@/components/Paywall';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { stripHarakat } from '@/lib/reader/harakat';
import { resolveTtsUrlAr } from '@/utils/ttsAudioAr';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import '@/styles/arabic.css';
import type { Language } from '@/types/ui-state';

interface Card { id: string; ar: string; translit: string; uz: string; ru: string; en: string; }
interface Deck { id: string; level: string; title_uz: string; title_ru: string; title_en: string; cards: Card[]; }

const tr = (c: Card, l: Language) => (l === 'ru' ? c.ru : l === 'en' ? c.en : c.uz);

export function ArabicFlashcardDeck({ level }: { level: string }) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language] = useLanguage();
  const { play } = useAudioPlayer();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHarakat, setShowHarakat] = useState(true);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/arabic/flashcards/${level}`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        setDeck(data.deck as Deck);
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [level, getAccessToken, authLoading]);

  const cards = deck?.cards ?? [];
  const card = cards[idx];

  const advance = useCallback((wasKnown: boolean) => {
    if (wasKnown) setKnown((k) => k + 1);
    setFlipped(false);
    if (idx + 1 >= cards.length) setDone(true);
    else setIdx((i) => i + 1);
  }, [idx, cards.length]);

  const restart = useCallback(() => { setIdx(0); setFlipped(false); setKnown(0); setDone(false); }, []);

  const speak = useCallback(async (text: string) => {
    const url = await resolveTtsUrlAr(text);
    if (url) play(text, url);
  }, [play]);

  if (authLoading) return <div className="loading-spinner" />;

  return (
    <>
      {status === 'locked' && <Paywall />}
      <main className="home">
        <div className="dr-hero">
          <div className="dr-hero__top-row">
            <Link href="/arabic/flashcards" className="dr-back-btn" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{level.toUpperCase()} · {({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[language]}</div>
          </div>
        </div>

        {status === 'loading' && <div className="loading-spinner" />}
        {status === 'error' && <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>Could not load.</div>}

        {status === 'loaded' && deck && !done && card && (
          <section className="home__content ar-fc">
            <div className="ar-fc__progress"><div className="ar-fc__progress-bar" style={{ width: `${(idx / cards.length) * 100}%` }} /></div>
            <div className="ar-fc__count">{idx + 1} / {cards.length}</div>

            <div className="ar-fc__card-wrap" onClick={() => setFlipped((f) => !f)}>
              <div className={`ar-fc__card ${flipped ? 'ar-fc__card--flipped' : ''}`}>
                <div className="ar-fc__face ar-fc__face--front reader-core--arabic" dir="rtl">
                  <div className="ar-text">{showHarakat ? card.ar : stripHarakat(card.ar)}</div>
                  <div className="ar-translit" dir="ltr">{card.translit}</div>
                  <button type="button" className="ar-fc__audio" onClick={(e) => { e.stopPropagation(); void speak(card.ar); }} aria-label="Play">🔊</button>
                </div>
                <div className="ar-fc__face ar-fc__face--back">
                  <div className="ar-fc__answer">{tr(card, language)}</div>
                </div>
              </div>
            </div>

            <div className="ar-fc__actions">
              <button type="button" className="ar-fc__btn ar-fc__btn--no" onClick={() => advance(false)}>{({ uz: 'Bilmayman', ru: 'Не знаю', en: "Don't know" } as Record<string, string>)[language]}</button>
              <button type="button" className="ar-fc__btn ar-fc__btn--yes" onClick={() => advance(true)}>{({ uz: 'Bilaman', ru: 'Знаю', en: 'Know' } as Record<string, string>)[language]}</button>
            </div>

            <nav className="story__bottom-bar">
              <div className="story__bottom-bar-inner">
                <button className={`reader__nav-toggle ${showHarakat ? 'reader__nav-toggle--active' : ''}`} onClick={() => setShowHarakat((v) => !v)} type="button" aria-pressed={showHarakat}>Harakat</button>
              </div>
            </nav>
          </section>
        )}

        {status === 'loaded' && done && (
          <section className="home__content ar-fc__done">
            <div className="ar-fc__done-title">{({ uz: 'Tugadi!', ru: 'Готово!', en: 'Done!' } as Record<string, string>)[language]}</div>
            <div className="ar-fc__done-stats">{known} / {cards.length} {({ uz: 'bilingan', ru: 'известно', en: 'known' } as Record<string, string>)[language]}</div>
            <button type="button" className="ar-fc__btn ar-fc__btn--yes" onClick={restart}>{({ uz: 'Qaytadan', ru: 'Заново', en: 'Restart' } as Record<string, string>)[language]}</button>
          </section>
        )}
        <PageFooter />
      </main>
    </>
  );
}
```

- [ ] **Step 2: append flashcard styles to `src/styles/arabic.css`**

```css
/* Arabic flashcards */
.ar-fc { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.ar-fc__progress { width: 100%; max-width: 420px; height: 4px; background: #eee; border-radius: 2px; overflow: hidden; }
.ar-fc__progress-bar { height: 100%; background: var(--color-accent, #dc2626); transition: width 0.3s; }
.ar-fc__count { color: #999; font-size: 0.9em; }
.ar-fc__card-wrap { width: 100%; max-width: 420px; height: 260px; perspective: 1000px; cursor: pointer; }
.ar-fc__card { position: relative; width: 100%; height: 100%; transition: transform 0.45s; transform-style: preserve-3d; }
.ar-fc__card--flipped { transform: rotateY(180deg); }
.ar-fc__face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 20px; }
.ar-fc__face--front { background: #fff; }
.ar-fc__face--front .ar-text { font-size: 2.4em; }
.ar-fc__face--back { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; transform: rotateY(180deg); }
.ar-fc__answer { font-size: 1.8em; text-align: center; }
.ar-fc__audio { position: absolute; bottom: 12px; inset-inline-end: 12px; background: none; border: none; font-size: 1.3em; cursor: pointer; }
.ar-fc__actions { display: flex; gap: 12px; width: 100%; max-width: 420px; }
.ar-fc__btn { flex: 1; padding: 14px; border: none; border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; }
.ar-fc__btn--no { background: #fee2e2; color: #b91c1c; }
.ar-fc__btn--yes { background: #16a34a; color: #fff; }
.ar-fc__done { display: flex; flex-direction: column; align-items: center; gap: 14px; padding-block: 40px; }
.ar-fc__done-title { font-size: 1.6em; font-weight: 700; }
.ar-fc__done-stats { color: #666; }
```

- [ ] **Step 3: verify imports** — read `src/hooks/useAudioPlayer.ts` to confirm `play(id, url)`, and `src/types/ui-state.ts` for `Language`. Adapt if signatures differ; report. `npm run build` (not yet routed). Commit:
```bash
git add src/components/reader/ArabicFlashcardDeck.tsx src/styles/arabic.css
git commit -m "feat(arabic): ArabicFlashcardDeck (flip card + harakat toggle + scoring)"
```

---

### Task 4: Flashcard deck route page

**Files:**
- Create: `src/app/[locale]/arabic/flashcards/[level]/page.tsx`

- [ ] **Step 1: write the SSG shell**

```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadArabicFlashcardDeck, loadArabicFlashcardCatalog } from '@/services/arabicContent';
import { ArabicFlashcardDeck } from '@/components/reader/ArabicFlashcardDeck';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

interface PageParams { params: Promise<{ locale: string; level: string }>; }

export async function generateStaticParams() {
  return loadArabicFlashcardCatalog().map((d) => ({ level: d.level }));
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, level } = await params;
  const deck = loadArabicFlashcardDeck(level);
  if (!deck) return {};
  const title = ({ uz: deck.title_uz, ru: deck.title_ru, en: deck.title_en } as Record<string, string>)[locale] || deck.title_uz;
  return {
    title: `${title} — ${({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale]}`,
    description: ({
      uz: `Arab tili ${level.toUpperCase()} so'zlarini fleshkartalar bilan yodlang. Harakat va transliteratsiya bilan.`,
      ru: `Учите арабские слова ${level.toUpperCase()} с флешкартами. С огласовками и транслитерацией.`,
      en: `Learn Arabic ${level.toUpperCase()} words with flashcards. With harakat and transliteration.`,
    } as Record<string, string>)[locale],
    alternates: {
      canonical: `/${locale}/arabic/flashcards/${level}`,
      languages: { uz: `/uz/arabic/flashcards/${level}`, ru: `/ru/arabic/flashcards/${level}`, en: `/en/arabic/flashcards/${level}`, 'x-default': `/uz/arabic/flashcards/${level}` },
    },
  };
}

export default async function ArabicFlashcardDeckPage({ params }: PageParams) {
  const { locale, level } = await params;
  setRequestLocale(locale);
  const deck = loadArabicFlashcardDeck(level);
  if (!deck) notFound();
  const flashLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/dialogues` },
      { name: flashLabel, path: `/${locale}/arabic/flashcards` },
      { name: level.toUpperCase(), path: `/${locale}/arabic/flashcards/${level}` },
    ]),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ArabicFlashcardDeck level={level} />
    </>
  );
}
```

- [ ] **Step 2:** `npm run build` — expect `● /[locale]/arabic/flashcards/[level]` (SSG, prerenders `…/a1`). Commit:
```bash
git add "src/app/[locale]/arabic/flashcards/[level]/page.tsx"
git commit -m "feat(arabic): flashcard deck route page"
```

---

### Task 5: Shared tab bar + Flashcards catalog component + page

**Files:**
- Create: `src/components/catalog/ArabicCatalogTabs.tsx`
- Create: `src/components/catalog/ArabicFlashcardsCatalog.tsx`
- Create: `src/app/[locale]/arabic/flashcards/page.tsx`

- [ ] **Step 1: shared Arabic tab bar** — `src/components/catalog/ArabicCatalogTabs.tsx`

```tsx
'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';

const TABS = [
  { id: 'dialogues', href: '/arabic/dialogues', uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' },
  { id: 'flashcards', href: '/arabic/flashcards', uz: 'Fleshkarta', ru: 'Флешкарты', en: 'Flashcards' },
] as const;

export function ArabicCatalogTabs({ current }: { current: 'dialogues' | 'flashcards' }) {
  const [language] = useLanguage();
  return (
    <nav className="lp__tabs">
      <div className="lp__tabs-inner">
        {TABS.map((t) => (
          <Link key={t.id} href={t.href} className={`lp__tab ${current === t.id ? 'lp__tab--active' : ''}`} prefetch={false}>
            {(t as Record<string, string>)[language] ?? t.uz}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```
Confirm the `lp__tabs`/`lp__tab`/`lp__tab--active` classes exist in `reading.css` (the Chinese catalog tab styles); if a class name differs, use the real one.

- [ ] **Step 2: catalog component** (lists available level-decks as cards; public — no auth)

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { ArabicCatalogTabs } from './ArabicCatalogTabs';

export function ArabicFlashcardsCatalog({ decks }: { decks: { level: string; count: number }[] }) {
  const [language] = useLanguage();
  const wordsLabel = ({ uz: "so'z", ru: 'слов', en: 'words' } as Record<string, string>)[language];
  return (
    <main className="home">
      <header className="home__hero" dir="ltr">
        <div className="home__hero-inner">
          <div className="home__hero-top-row">
            <Link href="/" className="home__hero-logo" aria-label="Blim">
              <Image src="/logo.svg" alt="Blim" width={64} height={28} className="home__hero-logo-img" />
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{({ uz: 'Arab tili', ru: 'Арабский', en: 'Arabic' } as Record<string, string>)[language]}</div>
            <h1 className="dr-hero__title" dir="rtl">بِطَاقَات</h1>
            <div className="dr-hero__pinyin" dir="ltr">biṭāqāt</div>
          </div>
        </div>
      </header>

      <ArabicCatalogTabs current="flashcards" />

      <section className="home__content">
        <div className="home__lessons">
          {decks.map((d) => (
            <Link key={d.level} href={`/arabic/flashcards/${d.level}`} prefetch={false} className="dialogue-card">
              <div className="dialogue-card__content">
                <div className="dialogue-card__text">
                  <h3 className="dialogue-card__title">{d.level.toUpperCase()}</h3>
                  <p className="dialogue-card__translation">{d.count} {wordsLabel}</p>
                </div>
              </div>
            </Link>
          ))}
          {decks.length === 0 && (
            <p className="dialogues__empty">{({ uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' } as Record<string, string>)[language]}</p>
          )}
        </div>
      </section>
      <PageFooter />
    </main>
  );
}
```

- [ ] **Step 3: catalog page**

```tsx
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ArabicFlashcardsCatalog } from '@/components/catalog/ArabicFlashcardsCatalog';
import { loadArabicFlashcardCatalog } from '@/services/arabicContent';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Arab tili fleshkartalar — A1-C2', description: 'Arab tili so\'zlarini fleshkartalar bilan yodlang. Harakat va transliteratsiya bilan. Bepul!' },
  ru: { title: 'Арабские флешкарты — A1-C2', description: 'Учите арабские слова с флешкартами. С огласовками и транслитерацией. Бесплатно!' },
  en: { title: 'Arabic Flashcards — A1-C2', description: 'Learn Arabic words with flashcards. With harakat and transliteration. Free!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title, description: m.description,
    alternates: { canonical: `/${locale}/arabic/flashcards`, languages: { uz: '/uz/arabic/flashcards', ru: '/ru/arabic/flashcards', en: '/en/arabic/flashcards', 'x-default': '/uz/arabic/flashcards' } },
  };
}

export default async function ArabicFlashcardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const decks = loadArabicFlashcardCatalog();
  const flashLabel = ({ uz: 'Fleshkartalar', ru: 'Флешкарты', en: 'Flashcards' } as Record<string, string>)[locale] || 'Flashcards';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/dialogues` },
      { name: flashLabel, path: `/${locale}/arabic/flashcards` },
    ]),
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ArabicFlashcardsCatalog decks={decks} />
    </>
  );
}
```

- [ ] **Step 4:** `npm run build` — expect `● /[locale]/arabic/flashcards` (SSG). Commit:
```bash
git add src/components/catalog/ArabicCatalogTabs.tsx src/components/catalog/ArabicFlashcardsCatalog.tsx "src/app/[locale]/arabic/flashcards/page.tsx"
git commit -m "feat(arabic): tab bar + flashcards catalog component + page"
```

---

### Task 6: Wire the tab bar into the Dialogues catalog

**Files:**
- Modify: `src/components/catalog/ArabicDialoguesCatalog.tsx` (add the tab bar)

The `ArabicCatalogTabs` component was created in Task 5. This task just renders it in the existing Dialogues catalog so both sections are navigable from either page.

- [ ] **Step 1:** in `src/components/catalog/ArabicDialoguesCatalog.tsx`, import `ArabicCatalogTabs` (`import { ArabicCatalogTabs } from './ArabicCatalogTabs';`) and render `<ArabicCatalogTabs current="dialogues" />` immediately after the `</header>` (before the `lp__seg-bar` CEFR pills). Read the file first; add the import + the one line only.

- [ ] **Step 2:** `npm run build` — expect both `● /[locale]/arabic/dialogues` and `● /[locale]/arabic/flashcards` build clean. Commit:
```bash
git add src/components/catalog/ArabicDialoguesCatalog.tsx
git commit -m "feat(arabic): wire tab bar into Arabic dialogues catalog"
```

---

### Task 7: Auth gate + sitemap

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1:** extend `PROTECTED_PATTERN` (line 10) to gate flashcard decks (catalog stays public). Add the `|^\/arabic\/flashcards\/.` alternative:

```ts
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.|flashcards\/.|writing\/.)|^\/arabic\/dialogues\/[^/]+\/.|^\/arabic\/flashcards\/./;
```

- [ ] **Step 2:** verify with a node check:
```bash
node --input-type=module -e "const P=/^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.|flashcards\/.|writing\/.)|^\/arabic\/dialogues\/[^/]+\/.|^\/arabic\/flashcards\/./; ['/arabic/flashcards','/arabic/flashcards/a1','/arabic/dialogues','/arabic/dialogues/a1/greetings'].forEach(p=>console.log(P.test(p),p));"
```
Expected: `false /arabic/flashcards` (catalog public), `true /arabic/flashcards/a1` (deck gated), `false /arabic/dialogues`, `true /arabic/dialogues/a1/greetings`.

- [ ] **Step 3:** in `src/app/sitemap.ts`, after the `/arabic/dialogues` entry add:
```ts
  entries.push(...localeEntries('/arabic/flashcards', { changeFrequency: 'weekly', priority: 0.8 }));
```

- [ ] **Step 4:** `npm run build`. Commit:
```bash
git add src/proxy.ts src/app/sitemap.ts
git commit -m "feat(arabic): gate flashcard decks + sitemap entry"
```

---

### Task 8: Verify + ship (controller)

- [ ] **Step 1: Preview (catalog public; deck gated).** `preview_start`; navigate to `/uz/arabic/flashcards`. `preview_snapshot`: red banner, tab bar (Dialogues | Flashcards, Flashcards active), one `A1 — N words` card. Click the tab over to Dialogues and back to confirm the tab bar works. `preview_screenshot`. (The deck itself shows the Paywall without login — that's correct; logged-in deck verification is the user's spot-check.)
- [ ] **Step 2: Build gate.** `npm run build`: `● /[locale]/arabic/flashcards`, `● /[locale]/arabic/flashcards/[level]`, `ƒ /api/content/arabic/flashcards/[level]`; Chinese routes unchanged; no `ƒ` leak on the page routes.
- [ ] **Step 3: Merge + deploy.**
```bash
git checkout main && git merge --ff-only arabic-flashcards && git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```
- [ ] **Step 4: Production curl.**
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://blim.uz/uz/arabic/flashcards"               # 200 public
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/arabic/flashcards/a1"  # 307 -> /login (gated)
curl -s -o /dev/null -w "%{http_code}\n" "https://blim.uz/api/content/arabic/flashcards/a1"     # 401 (no JWT)
```

---

## Deferred to later
- A2+ flashcard decks + more dialogue content (so the catalogs fill out).
- Full reader features (focus/play-all/Words tab — needs `arabic_lexicon`).
- Stories section.
- Recorded audio (TTS covers v1).
