# Arabic Dialogues Catalog + Landing Selector — Implementation Plan (Plan 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
>
> **No unit-test harness in this repo** (no vitest/jest). Do NOT add one. Verify with `npm run build` (routes stay `●` SSG/ISR, never `ƒ`), throwaway `node -e` checks for pure functions, `preview_*` tools, and production `curl`.

**Goal:** Make the Arabic track navigable: a public `/arabic/dialogues` catalog (CEFR A1–C2 pills + a dialogue-card grid linking to the Plan 1 reader), reachable from the landing "I'm learning" selector and the banner menu, with `/arabic` → `/arabic/dialogues` redirect.

**Architecture:** A NEW lean `ArabicDialoguesCatalog` client component (NOT a refactor of the Chinese `DialoguesCatalog` — Chinese stays untouched, and v1 drops the Chinese-only tag/bookmark/pinyin-search machinery). A server catalog page mirrors `/chinese/dialogues/page.tsx`. A file-based catalog-meta loader reads the Arabic dialogue JSONs. Landing/menu get a second learning-target entry. Proxy + sitemap get Arabic entries.

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl.

**Scope (Plan 2):** Dialogues catalog + navigation only. **Deferred:** Stories & Flashcards catalogs (later plans); full reader features (focus/play-all/Words tab); content beyond the single A1 `greetings` dialogue.

**Prereq (from Plan 1, already shipped):** `loadArabicDialogue`/`listArabicDialogues` in `src/services/arabicContent.ts`; reader route `/[locale]/arabic/dialogues/[level]/[slug]`; auth gate on `/arabic/dialogues/[^/]+/.`.

---

### Task 0: Branch

- [ ] `git checkout main && git pull --ff-only origin main && git checkout -b arabic-catalog`
- [ ] `npm run build` (baseline green).

---

### Task 1: CEFR level type + catalog-meta loader

**Files:**
- Modify: `src/components/catalog/types.ts` (additive)
- Modify: `src/services/arabicContent.ts` (add a catalog-meta loader)

- [ ] **Step 1: Add the CEFR type + parser to `src/components/catalog/types.ts`** (append; do not change existing exports)

```ts
export type CefrLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
export const CEFR_LEVELS: CefrLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

export function parseCefrLevel(raw: string | null | undefined): CefrLevel {
  return CEFR_LEVELS.includes(raw as CefrLevel) ? (raw as CefrLevel) : 'a1';
}
```

- [ ] **Step 2: Add a catalog-meta loader to `src/services/arabicContent.ts`** (append below the existing exports; reuses the existing `LEVELS`/`ROOT` and `fs`/`path` already imported there)

```ts
/** Lightweight per-dialogue metadata for the catalog grid. */
export interface ArabicDialogueCardMeta {
  id: string;
  slug: string;
  level: string;
  title: string;
  translit: string;
  titleTranslation_uz: string;
  titleTranslation_ru: string;
  titleTranslation_en: string;
}

/** Load catalog metadata for every Arabic dialogue, grouped by CEFR level. */
export function loadArabicDialogueCatalog(): Record<string, ArabicDialogueCardMeta[]> {
  const out: Record<string, ArabicDialogueCardMeta[]> = { a1: [], a2: [], b1: [], b2: [], c1: [], c2: [] };
  for (const { level, slug } of listArabicDialogues()) {
    const d = loadArabicDialogue(level, slug);
    if (!d) continue;
    out[level].push({
      id: d.id, slug, level,
      title: d.title, translit: d.translit,
      titleTranslation_uz: d.titleTranslation_uz,
      titleTranslation_ru: d.titleTranslation_ru,
      titleTranslation_en: d.titleTranslation_en,
    });
  }
  return out;
}
```

- [ ] **Step 3:** verify with a throwaway node check:
```bash
node --import tsx --input-type=module -e "import {loadArabicDialogueCatalog} from './src/services/arabicContent.ts'; const c=loadArabicDialogueCatalog(); console.log('a1:', c.a1.length, c.a1[0]?.slug, '| a2:', c.a2.length);" 2>/dev/null || node --input-type=module -e "import fs from 'fs'; const f='content/arabic/dialogues/a1/greetings.json'; const d=JSON.parse(fs.readFileSync(f,'utf8')); console.log('a1 slug:', d.id, 'title?', !!d.title);"
```
Expected: shows `a1: 1 greetings` (or, via the fallback, `a1 slug: greetings title? true`).

- [ ] **Step 4:** `npm run build` (succeeds; not yet imported). Commit:
```bash
git add src/components/catalog/types.ts src/services/arabicContent.ts
git commit -m "feat(arabic): CEFR level type + dialogue catalog-meta loader"
```

---

### Task 2: `ArabicDialoguesCatalog` component

**Files:**
- Create: `src/components/catalog/ArabicDialoguesCatalog.tsx`

A lean client component: red banner (Arabic glyph watermark + BannerMenu), CEFR pills (A1–C2; disabled when empty), and a dialogue-card grid linking to the reader. No tags/bookmarks/search in v1. Public (NO `useRequireAuth`).

- [ ] **Step 1: Write the component**

```tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { CEFR_LEVELS, parseCefrLevel, type CefrLevel } from './types';
import type { ArabicDialogueCardMeta } from '@/services/arabicContent';

type Catalog = Record<string, ArabicDialogueCardMeta[]>;

export function ArabicDialoguesCatalog({ catalog }: { catalog: Catalog }) {
  const [language] = useLanguage();
  const searchParams = useSearchParams();
  const [level, setLevel] = useState<CefrLevel>(parseCefrLevel(searchParams.get('dialar')));

  const active = catalog[level] ?? [];
  const trOf = (d: ArabicDialogueCardMeta) =>
    language === 'ru' ? d.titleTranslation_ru : language === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;

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
            <h1 className="dr-hero__title" dir="rtl">حِوَار</h1>
            <div className="dr-hero__pinyin" dir="ltr">ḥiwār</div>
          </div>
        </div>
      </header>

      <div className="lp__seg-bar">
        <div className="lp__hsk-pills lp__hsk-pills--grid">
          {CEFR_LEVELS.map((lv) => {
            const hasContent = (catalog[lv]?.length ?? 0) > 0;
            return (
              <button
                key={lv}
                type="button"
                disabled={!hasContent}
                onClick={() => { if (hasContent) setLevel(lv); }}
                className={`lp__hsk-pill ${level === lv ? 'lp__hsk-pill--active' : ''} ${!hasContent ? 'lp__hsk-pill--disabled' : ''}`}
              >
                {lv.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <section className="home__content">
        <div className="dialogues__grid">
          {active.map((d) => (
            <Link key={d.id} href={`/arabic/dialogues/${d.level}/${d.slug}`} prefetch={false} className="dialogue-card">
              <div className="dialogue-card__zh" dir="rtl">{d.title}</div>
              <div className="dialogue-card__py" dir="ltr">{d.translit}</div>
              <div className="dialogue-card__tr">{trOf(d)}</div>
            </Link>
          ))}
          {active.length === 0 && (
            <p className="dialogues__empty">{({ uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' } as Record<string, string>)[language]}</p>
          )}
        </div>
      </section>
      <PageFooter />
    </main>
  );
}
```

- [ ] **Step 2:** Read `src/components/catalog/DialoguesCatalog.tsx` and confirm these class names exist and look right for cards: `dialogues__grid`, `dialogue-card`, `dialogue-card__zh`, `dialogue-card__py`, `dialogue-card__tr`, `dialogues__empty`. If the Chinese catalog uses different class names for the grid/cards, use those same class names (so the existing CSS styles the Arabic cards too). Report which class names you used.

- [ ] **Step 3:** `npm run build` (succeeds; not yet routed). Commit:
```bash
git add src/components/catalog/ArabicDialoguesCatalog.tsx
git commit -m "feat(arabic): ArabicDialoguesCatalog (CEFR pills + dialogue grid)"
```

---

### Task 3: `/arabic/dialogues` catalog page

**Files:**
- Create: `src/app/[locale]/arabic/dialogues/page.tsx`

Mirror `src/app/[locale]/chinese/dialogues/page.tsx` (SSG + trilingual metadata + breadcrumb/Course JSON-LD), but Arabic.

- [ ] **Step 1: Write the page**

```tsx
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { ArabicDialoguesCatalog } from '@/components/catalog/ArabicDialoguesCatalog';
import { loadArabicDialogueCatalog } from '@/services/arabicContent';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Arab tili dialoglari — A1-C2', description: 'Arab tili dialoglari: harakat, transliteratsiya, audio va tarjima. Bepul boshlang!' },
  ru: { title: 'Диалоги на арабском — A1-C2', description: 'Диалоги на арабском: огласовки, транслитерация, аудио и перевод. Начните бесплатно!' },
  en: { title: 'Arabic Dialogues — A1-C2', description: 'Arabic dialogues with harakat, transliteration, audio and translation. Start free!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title, description: m.description,
    alternates: { canonical: `/${locale}/arabic/dialogues`, languages: { uz: '/uz/arabic/dialogues', ru: '/ru/arabic/dialogues', en: '/en/arabic/dialogues', 'x-default': '/uz/arabic/dialogues' } },
  };
}

export default async function ArabicDialoguesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const catalog = loadArabicDialogueCatalog();
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const dialoguesLabel = ({ uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' } as Record<string, string>)[locale] || 'Dialogues';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: homeLabel, path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/dialogues` },
      { name: dialoguesLabel, path: `/${locale}/arabic/dialogues` },
    ]),
    { '@type': 'Course', name: 'Arabic (MSA)', description: (pageMeta[locale] || pageMeta.uz).description, provider: { '@type': 'Organization', name: 'Blim' }, inLanguage: 'ar', educationalLevel: 'Beginner' },
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense>
        <ArabicDialoguesCatalog catalog={catalog} />
      </Suspense>
    </>
  );
}
```

- [ ] **Step 2:** `npm run build` — expect `● /[locale]/arabic/dialogues` (SSG, NOT `ƒ`). Commit:
```bash
git add "src/app/[locale]/arabic/dialogues/page.tsx"
git commit -m "feat(arabic): /arabic/dialogues catalog page"
```

---

### Task 4: `/arabic` → `/arabic/dialogues` redirect

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1:** In `src/proxy.ts`, immediately AFTER the existing Chinese `rootMatch` redirect block (the one matching `/^\/(uz|ru|en)\/chinese\/?$/`), add the Arabic equivalent:

```ts
  // /arabic root → the Dialogues catalog (Arabic has one section in v1).
  const arRootMatch = pathname.match(/^\/(uz|ru|en)\/arabic\/?$/);
  if (arRootMatch) {
    const dest = request.nextUrl.clone();
    dest.searchParams.delete('tab');
    dest.pathname = `/${arRootMatch[1]}/arabic/dialogues`;
    return NextResponse.redirect(dest, 301);
  }
```

- [ ] **Step 2:** verify with a node check that the regex matches the root but not the catalog/reader:
```bash
node --input-type=module -e "const R=/^\/(uz|ru|en)\/arabic\/?\$/; ['/uz/arabic','/uz/arabic/','/uz/arabic/dialogues','/uz/arabic/dialogues/a1/greetings'].forEach(p=>console.log(R.test(p),p));"
```
Expected: `true /uz/arabic`, `true /uz/arabic/`, `false /uz/arabic/dialogues`, `false …/a1/greetings`.

- [ ] **Step 3:** `npm run build`. Commit:
```bash
git add src/proxy.ts
git commit -m "feat(arabic): redirect /arabic -> /arabic/dialogues"
```

---

### Task 5: Landing "I'm learning" selector (landing + banner menu)

**Files:**
- Modify: `src/components/HomePage.tsx`
- Modify: `src/components/BannerMenu.tsx`

- [ ] **Step 1: HomePage `languageList`** — add the Arabic entry (find the const `languageList = [{ id: 'chinese', nameOriginal: '中文', flag: '🇨🇳' }]`):

```tsx
const languageList = [
  { id: 'chinese', nameOriginal: '中文', flag: '🇨🇳' },
  { id: 'arabic', nameOriginal: 'العربية', flag: '🇸🇦' },
];
```

- [ ] **Step 2: HomePage label** — the cards render `{s[lang.id as keyof typeof s]}` for the display name. Find the strings object(s) `s` (per-locale, the one that already has a `chinese` key) and add an `arabic` key beside each `chinese` key: `uz: 'Arab tili'`, `ru: 'Арабский'`, `en: 'Arabic'`. Read the file to locate the exact object(s) and add the key in each locale variant. The card link is `href={`/${lang.id}`}` → `/arabic`, which Task 4's redirect sends to `/arabic/dialogues`. Report exactly where you added the `arabic` label.

- [ ] **Step 3: BannerMenu "I'm learning" row** — add a second button after the `中文` one (find the `home__menu-lang-row` containing the `中文` Link to `/chinese/dialogues`):

```tsx
          <Link
            href="/arabic/dialogues"
            className="home__menu-lang-btn"
            onClick={() => setMenuOpen(false)}
          >
            العربية
          </Link>
```
(Note: the existing `中文` button keeps `home__menu-lang-btn--active`; the Arabic one is NOT `--active` — there's no per-page "current target" state, so leave Chinese marked active as before, OR drop `--active` from both. Keep it minimal: just add the Arabic button without `--active`.)

- [ ] **Step 4:** `npm run build`. Commit:
```bash
git add src/components/HomePage.tsx src/components/BannerMenu.tsx
git commit -m "feat(arabic): landing + banner-menu 'I'm learning' Arabic selector"
```

---

### Task 6: Sitemap

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1:** After the `/chinese/grammar` `localeEntries` push, add:
```ts
  entries.push(...localeEntries('/arabic/dialogues', { changeFrequency: 'weekly', priority: 0.9 }));
```

- [ ] **Step 2:** `npm run build`. Commit:
```bash
git add src/app/sitemap.ts
git commit -m "feat(arabic): sitemap entry for /arabic/dialogues"
```

---

### Task 7: Verify + ship (controller)

- [ ] **Step 1: Preview (public — no auth needed for the catalog).** `preview_start`; navigate to `/uz/arabic/dialogues`. `preview_snapshot`: confirm the red banner, the A1 pill active (A2–C2 disabled), and the `greetings` dialogue card (Arabic title RTL + transliteration + translation). `preview_click` the card → confirm it navigates to the reader route. `preview_screenshot`.
- [ ] **Step 2: Build gate.** `npm run build`: `● /[locale]/arabic/dialogues` AND `● /[locale]/arabic/dialogues/[level]/[slug]` both SSG; Chinese routes unchanged; no `ƒ` leak.
- [ ] **Step 3: Merge + deploy.**
```bash
git checkout main && git merge --ff-only arabic-catalog && git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```
- [ ] **Step 4: Production curl.**
```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/arabic"            # 301 -> /uz/arabic/dialogues
curl -s -o /dev/null -w "%{http_code}\n" "https://blim.uz/uz/arabic/dialogues"                      # 200 (public)
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/arabic/dialogues/a1/greetings"  # 307 -> /login (reader still gated)
```

---

## Deferred to later plans
- Stories & Flashcards Arabic catalogs (+ a shared Arabic tab bar once there's >1 section).
- Full reader features: focus mode, play-all FAB, Words tab (needs `arabic_lexicon` table).
- Content backfill beyond the A1 `greetings` sample.
