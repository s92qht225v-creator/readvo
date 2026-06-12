# Static Rendering (ISR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Content pages serve pre-built cached copies (SSG/ISR) instead of rendering per request — production TTFB drops from ~0.5–0.9 s to near-zero — with zero user-visible change.

**Architecture:** Remove the dynamic-forcing `getLocale()` calls (root layout + 23 pages' `generateMetadata`), then restructure into three root layouts (`[locale]` main site, `test-app`, `auth`) so `<html lang>` comes from params. Analytics scripts extract to a shared component. The objective success signal: the build route table flips content routes from `ƒ` to `●`.

**Tech Stack:** Next.js 16.1.6 App Router, next-intl 4.8.3, TypeScript. No test framework — verification is `tsc`, `npm run build` route-table inspection, dev-server click-throughs, and production TTFB measurement.

**Spec:** `docs/superpowers/specs/2026-06-12-static-rendering-design.md`

**Branch:** create `feat/static-rendering` from `main` before Task 1.

**Critical context for the implementer:**
- `generateMetadata` in the affected pages currently takes **no arguments** — the fix adds the `params` argument AND swaps the locale read.
- The test app's CSS (`.test-preview-shell`, player chrome) lives in `@/styles/reading.css`, which today is imported by the root layout. When `test-app` gets its own root layout it MUST import `@/styles/reading.css` itself or the test player breaks.
- All `auth/*` pages are `'use client'` redirect/completion pages.
- `src/app/not-found.tsx` is a client component reading the path from `window.location` (its `getLocaleFromPath` is NOT next-intl's `getLocale` — don't confuse them). A `[locale]/not-found.tsx` twin already exists. The middleware (`src/proxy.ts`, `localePrefix: 'always'`) redirects every unprefixed path into `/uz/...`, so 404s land inside `[locale]`.

---

## Phase 1 — Mechanical metadata fixes (no behavior change)

### Task 1: `getLocale()` → `params` in 23 pages + drop searchParams from `/chinese` metadata

**Files (modify):** the 23 `[locale]` pages listed in the script below (19 grammar + blog + chinese + login + home + payment).

- [ ] **Step 1: Run the codemod**

Create and run `scripts/fix-metadata-locale.py`:
```python
import re, sys

FILES = [
 "src/app/[locale]/blog/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/bushi-polished/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/de/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/duoda/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/hen/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/hui/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/ji/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/ma-polished/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/ma/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/na/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/ne/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/riqi/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/shei/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/shenme-polished/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/shenme/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/shi-polished/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/shi/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/shuzi/page.tsx",
 "src/app/[locale]/chinese/hsk1/grammar/zenme/page.tsx",
 "src/app/[locale]/chinese/page.tsx",
 "src/app/[locale]/login/page.tsx",
 "src/app/[locale]/page.tsx",
 "src/app/[locale]/payment/page.tsx",
]

SIG_NOARG = "export async function generateMetadata(): Promise<Metadata> {"
SIG_PARAMS = "export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {"

unfixed = []
for path in FILES:
    src = open(path, encoding="utf-8").read()
    orig = src
    # 1. signature: no-arg -> params  (chinese/page.tsx has its own searchParams sig, handled below)
    src = src.replace(SIG_NOARG, SIG_PARAMS)
    # 2. locale read inside generateMetadata
    src = src.replace("const locale = await getLocale();", "const { locale } = await params;")
    # 3. import cleanup: drop getLocale, keep the rest
    def clean_import(m):
        names = [p.strip() for p in m.group(1).split(",") if p.strip() and p.strip() != "getLocale"]
        return "import { " + ", ".join(names) + " } from 'next-intl/server';"
    src = re.sub(r"import \{([^}]*)\} from 'next-intl/server';", clean_import, src, count=1)
    if "getLocale" in src:
        unfixed.append(path)
    open(path, "w", encoding="utf-8").write(src)
    print(("FIXED " if src != orig else "NOOP  ") + path)

if unfixed:
    print("\nSTILL CONTAIN getLocale (fix by hand):")
    for p in unfixed: print(" ", p)
    sys.exit(1)
print("\nall clean")
```
Run: `python3 scripts/fix-metadata-locale.py`
Expected: every file prints `FIXED`; exit 0. Any file listed under "fix by hand" gets the same three changes manually (signature, locale read, import).

NOTE for `src/app/[locale]/chinese/page.tsx`: its signature is
`export async function generateMetadata({ searchParams }: { searchParams: ... })` — the script won't match it. Hand-edit per Step 2.

- [ ] **Step 2: Hand-fix `/chinese` metadata (drop searchParams — the user-approved SEO decision)**

In `src/app/[locale]/chinese/page.tsx`, replace the whole `generateMetadata` with:
```ts
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese`,
      languages: {
        uz: '/uz/chinese',
        ru: '/ru/chinese',
        en: '/en/chinese',
        'x-default': '/uz/chinese',
      },
    },
  };
}
```
Also delete the now-unused `tabMeta` and `indexableTabs` constants, and remove `getLocale` from the next-intl import.

- [ ] **Step 3: Verify + commit**

```bash
grep -rln "getLocale" "src/app/[locale]"   # expect: NO output
npx tsc --noEmit                            # clean
npm run build                               # compiles (routes still ƒ — root layout untouched)
rm scripts/fix-metadata-locale.py
git add -A && git commit -m "perf(metadata): read locale from params, drop searchParams from /chinese meta"
```

---

## Phase 2 — Layout restructure (the core)

### Task 2: Extract `<AnalyticsScripts />`

**Files:** Create `src/components/AnalyticsScripts.tsx`

- [ ] **Step 1: Create the component** — move the three `<Script>` blocks, the `<noscript>` pixels, and the two page-view trackers verbatim from `src/app/layout.tsx`:
```tsx
import Script from 'next/script';
import { YandexPageView } from '@/components/YandexPageView';
import { MetaPageView } from '@/components/MetaPageView';

/** GA4 + Meta Pixel + Yandex Metrica — shared by every root layout
 *  (main site, test-app). Scripts load afterInteractive; the noscript
 *  pixels and SPA page-view trackers ride along. */
export function AnalyticsScripts() {
  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-1YH679LNRS" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-1YH679LNRS');`}
      </Script>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2352011961980102');
fbq('track', 'PageView');`}
      </Script>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) { return; }
          }
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],
          k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
        ym(107194604, "init", {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true
        });`}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://mc.yandex.ru/watch/107194604" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=2352011961980102&ev=PageView&noscript=1" alt="" />
        </div>
      </noscript>
      <YandexPageView />
      <MetaPageView />
    </>
  );
}
```
- [ ] **Step 2:** `npx tsc --noEmit` clean → `git add src/components/AnalyticsScripts.tsx && git commit -m "refactor: extract AnalyticsScripts for multi-root-layout setup"`

### Task 3: Make `[locale]/layout.tsx` the main-site root layout

**Files:** Rewrite `src/app/[locale]/layout.tsx`; Delete `src/app/layout.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`.

- [ ] **Step 1: Rewrite `src/app/[locale]/layout.tsx`** — merge today's root-layout content (html/body, Noto Sans, css imports, metadata/viewport, verification metas, analytics) with the existing locale logic (validate, `setRequestLocale`, `getMessages`, providers). Complete file:
```tsx
import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import '@/styles/reading.css';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/hooks/useAuth';
import { TelegramFAB } from '@/components/TelegramFAB';
import { AnalyticsScripts } from '@/components/AnalyticsScripts';

const font = Noto_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '700'], variable: '--font-pinyin', display: 'swap', preload: true });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';

const meta: Record<string, { title: string; description: string; ogLocale: string }> = {
  uz: {
    title: 'Xitoy tili o\'rganish — HSK darslari | Blim',
    description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul boshlang!',
    ogLocale: 'uz_UZ',
  },
  ru: {
    title: 'Изучайте китайский язык — уроки HSK | Blim',
    description: 'Изучайте китайский онлайн: HSK 1-6 диалоги, флешкарты, караоке и грамматика. Начните бесплатно!',
    ogLocale: 'ru_RU',
  },
  en: {
    title: 'Learn Chinese — HSK Lessons | Blim',
    description: 'Learn Chinese online: HSK 1-6 dialogues, flashcards, karaoke and grammar. Start for free!',
    ogLocale: 'en_US',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.uz;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: m.title, template: '%s | Blim' },
    description: m.description,
    openGraph: { type: 'website', locale: m.ogLocale, siteName: 'Blim' },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      ],
      apple: '/apple-icon.png',
    },
    other: {
      'google-site-verification': 'IOvKyDyZC0mR42xZeSCIVndhzKqnqhM9JVMlQvFiJT0',
      'yandex-verification': 'a66bf653e2117240',
      'msvalidate.01': '1141CE3E734B8166DEA1C869556D38D1',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#dc2626',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${font.className} ${font.variable}`}>
        <AnalyticsScripts />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <TelegramFAB />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```
(Verification `<meta>` tags move into `metadata.other` — same rendered output, but no manual `<head>` needed.)

- [ ] **Step 2: Delete the old root files**
```bash
git rm src/app/layout.tsx src/app/not-found.tsx src/app/error.tsx
```
(`[locale]/not-found.tsx` + `[locale]/error.tsx` already exist; `global-error.tsx` stays — it renders its own `<html>`. The middleware's `localePrefix: 'always'` sends all unprefixed paths into `[locale]`, so no route is left shell-less. If `npm run build` in Task 5 complains about a missing root layout/not-found, restore a MINIMAL `src/app/layout.tsx` that returns `children` only IF the build demands it — empirical check, document the outcome.)

- [ ] **Step 3:** `npx tsc --noEmit` → commit `"feat(perf): [locale] becomes the main-site root layout (static-safe html lang)"`

### Task 4: Standalone shells for `test-app` and `auth`

**Files:** Modify `src/app/test-app/layout.tsx`; Create `src/app/auth/layout.tsx`.

- [ ] **Step 1: Upgrade `src/app/test-app/layout.tsx` to a root layout.** Complete file (NOTE the `reading.css` import — the preview shell/player chrome lives there and previously arrived via the deleted root layout):
```tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/reading.css';
import '@/components/test/test-builder-preview.css';
import { AuthProvider } from '@/hooks/useAuth';
import { AnalyticsScripts } from '@/components/AnalyticsScripts';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Blim Tests', template: '%s | Blim Tests' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * ROOT layout for the standalone test creator (test.blim.uz). English-only;
 * no next-intl. Owns its own <html> since the app has three root layouts
 * ([locale] main site, test-app, auth).
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ minHeight: '100vh', background: '#fff', color: '#1e293b' }}>
        <AnalyticsScripts />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```
(The old inner `<div className={inter.className}>` styling moves onto `<body>`.)

- [ ] **Step 2: Create `src/app/auth/layout.tsx`** (minimal shell for the client-side redirect pages):
```tsx
import { Noto_Sans } from 'next/font/google';
import '@/styles/reading.css';

const font = Noto_Sans({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '700'], display: 'swap' });

/** ROOT layout for /auth/* (Telegram completion + Supabase callback pages —
 *  all client components that redirect). Minimal shell, no analytics. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={font.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3:** `npx tsc --noEmit` → commit `"feat(perf): standalone root layouts for test-app and auth"`

### Task 5: THE GATE — build flips to static + full click-through

- [ ] **Step 1: Build and inspect the route table**
```bash
npm run build 2>&1 | tee /tmp/build-routes.txt
grep -E "●|ƒ|○" /tmp/build-routes.txt | head -60
```
Expected: `/[locale]/chinese/hsk*/dialogues/[dialogueId]`, `/[locale]`, `/[locale]/chinese`, grammar, blog, flashcards, writing, karaoke routes show `●` (SSG) — NOT `ƒ`. `/[locale]/payment` may show `●` too (its subscription logic is client-side; confirm the page component has no server-side user reads — if it does, it stays `ƒ`, also fine). `/api/*`, `/test-app/*` stay `ƒ`. If the build ERRORS about a missing root layout → apply the Task 3 Step 2 fallback and re-run. If content routes still show `ƒ` → run `npm run build 2>&1 | grep -B2 "uses headers\|uses cookies\|couldn't be rendered statically"` to find the remaining dynamic API and fix it before proceeding. DO NOT continue with a `ƒ` route table.

- [ ] **Step 2: Dev click-through** (`npm run dev`, check each in a browser/preview):
home `/uz` + `/ru` + `/en`; `/uz/chinese` all 6 tabs; one dialogue per HSK level (Dialog/Words/Dictation/Practice tabs); a grammar page; blog list + one post; `/uz/payment`; `/uz/login`; admin `/uz?admin=true`; test-app: `/test-app/dashboard` (login redirect ok), `/test-app/t/{slug}` player renders WITH styling (reading.css check). View source on `/ru/...`: `<html lang="ru">`, RU title, hreflang alternates present.

- [ ] **Step 3:** commit `"feat(perf): verify static route table + click-through"` (any fixes found in Step 2 are separate small commits first).

---

## Phase 3 — Revalidation + freshness verification

### Task 6: ISR windows + glossary live-edit proof

**Files:** Modify the 6 dialogue reader pages (`src/app/[locale]/chinese/hsk{1..6}/dialogues/[dialogueId]/page.tsx`).

- [ ] **Step 1:** Add to each of the 6 dialogue reader pages, right after the imports:
```ts
export const revalidate = 3600; // hourly ISR refresh (glossary edits also revalidate via tag)
```
The 4 existing `revalidate = 3600` exports (home, /chinese, blog ×2) stay. Other content pages are plain SSG (their data only changes on deploy, which rebuilds them anyway).

- [ ] **Step 2: Glossary propagation test (dev):** `npm run build && npm run start` (ISR needs a production server, not `next dev`). Load `/uz/chinese/hsk5/dialogues/should-i-change-jobs` → note 心事's translation. Edit 心事's UZ translation via the admin Glossary tab (or `curl -X POST /api/admin/glossary` with the admin password). Reload the dialogue page (twice — first hit may serve stale-while-revalidate): translation MUST update without a rebuild. Revert the edit. If it does NOT propagate: the page isn't consuming the tagged cache — debug `getGlossary`'s `unstable_cache` tags before continuing.

- [ ] **Step 3:** `npx tsc --noEmit && npm run build` → commit `"perf: hourly ISR on dialogue readers + verified glossary tag propagation"`

---

## Phase 4 — Deploy + measure

### Task 7: Ship and prove the win

- [ ] **Step 1: Baseline (before merging):**
```bash
for u in uz uz/chinese uz/chinese/hsk5/dialogues/should-i-change-jobs; do
  curl -sL -o /dev/null -w "/$u  TTFB %{time_starttransfer}s\n" "https://www.blim.uz/$u"; done
```
- [ ] **Step 2: Merge + deploy:** `git checkout main && git merge --ff-only feat/static-rendering && git push origin main && ssh deploy@178.105.107.198 './deploy.sh'`
- [ ] **Step 3: After-measurement** (same curl loop, run twice — second run is the cached hit). Expected: warm TTFB well under 200 ms (vs 0.5–0.9 s).
- [ ] **Step 4: Production spot-checks:** logged-out home renders; `<html lang="ru">` on `/ru`; a dialogue Words tab shows translations; admin glossary edit propagates (edit → reload dialogue → revert); test-app player styled correctly.
- [ ] **Step 5: Docs:** update `CLAUDE.md` (Caching & ISR section: all content routes static; root-layout restructure; AnalyticsScripts) + memory. Commit `"docs: static rendering rollout"`.

## Final review

Dispatch a code reviewer over the full branch diff; confirm spec gates 1–6 all passed; note the nginx HTTP/2 follow-up remains with the user.
