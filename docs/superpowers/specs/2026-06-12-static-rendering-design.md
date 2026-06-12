# Static Rendering (ISR) for Content Pages — Design Spec

**Date:** 2026-06-12
**Status:** Approved design → next: implementation plan
**Author:** Blim team

## Problem

Every route renders **per request** (`ƒ Dynamic` in the build output). Measured TTFB on
production is ~0.5–0.9 s for all pages, including pure-content pages (dialogues, grammar,
catalog, blog). The root cause chain:

1. `src/app/layout.tsx` (root layout) and its `generateMetadata` call **`getLocale()`**,
   which reads request headers → the *entire* route tree opts out of static rendering.
2. **23 pages** also call `getLocale()` inside their own `generateMetadata` instead of
   reading the locale from `params`.
3. `/[locale]/chinese`'s `generateMetadata` reads **`searchParams`** (per-tab SEO titles)
   — `searchParams` always forces dynamic rendering for that route.
4. `export const revalidate = 3600` exists on 4 routes but is inert while the layout
   forces dynamic.

Secondary first-load costs measured (out of scope here, tracked separately): HTTP/1.1-only
nginx (user runs the one-line `http2` change), ~290 KB gzipped JS, ~156 KB serialized
props on `/chinese`. KaTeX CSS was already unshipped from the global bundle.

## Goal

Content pages serve a **pre-built cached copy instantly** (SSG/ISR with 1-hour background
revalidation), with **zero user-visible change** — same design, content, login behavior,
admin-edit propagation. Per-user pages stay dynamic.

## Decisions (locked with user)

- `/chinese` gives up per-tab (`?tab=…`) SEO titles; all tab URLs share the canonical
  `/chinese` metadata. hreflang, JSON-LD, and sitemap entries are unchanged.
- Approach A below (multiple root layouts) over hardcoding `<html lang>` (B) or nginx
  page caching (C — rejected: auth cookies + invalidation risk).

## Architecture — Approach A: multiple root layouts

Delete the top-level `src/app/layout.tsx`. Each top-level segment owns its `<html>` shell:

| Segment | New root layout | Contents |
|---|---|---|
| `src/app/[locale]/layout.tsx` | main site | `<html lang={locale}>` from **params** (static-safe), Noto Sans font, `<AnalyticsScripts/>`, verification `<meta>` tags, `NextIntlClientProvider` + `AuthProvider` + `TelegramFAB`, site-default `generateMetadata` (locale from params) + `viewport` |
| `src/app/test-app/layout.tsx` | test app (standalone, English-only) | upgraded to render its own `<html lang="en">` + body, keeps its Inter font + `AuthProvider`, gains `<AnalyticsScripts/>` |
| `src/app/auth/layout.tsx` | NEW, minimal | `<html lang="uz">` + body + system font — these are redirect/completion pages |

Shared pieces extracted so nothing is duplicated:

- `src/components/AnalyticsScripts.tsx` — the gtag/Meta-Pixel/Yandex `<Script>` blocks,
  noscript pixels, and the `YandexPageView`/`MetaPageView` trackers (moved verbatim from
  the current root layout).
- Root-level `not-found.tsx` moves into `[locale]/` (a root not-found cannot exist
  without a root layout). `global-error.tsx` stays at root — it already renders its own
  `<html>`. `error.tsx` at root is removed if redundant with `[locale]/error.tsx`
  (verify during implementation; keep whichever the build requires).

`src/proxy.ts` (next-intl middleware) is untouched — it still handles locale redirects;
static pages are served from cache after it runs.

## Metadata fixes (mechanical)

- 23 pages: in `generateMetadata`, replace `const locale = await getLocale()` with
  `const { locale } = await params` (params is already in every signature or trivially
  added). Page bodies already use `params` + `setRequestLocale`.
- `/chinese/page.tsx`: `generateMetadata` drops the `searchParams` argument and the
  `tabMeta`/`indexableTabs` branches; returns the canonical `pageMeta` + alternates only.

## Static/ISR matrix

| Routes | Mode |
|---|---|
| home `/[locale]`, `/chinese`, dialogues (hsk1–6 list + readers), grammar (all), writing, flashcards (incl. topic/mix), karaoke, blog list + posts | **SSG/ISR, `revalidate = 3600`** (add where missing; `generateStaticParams` already exists on dialogues + locale layout; missing ones may fill on demand — first hit renders, then cached) |
| `/[locale]/payment` | dynamic (per-user) — unchanged |
| `/api/*`, `test-app/*`, `auth/*` | dynamic — unchanged |

## Freshness guarantees

- **Hourly:** ISR background revalidation (existing 3600 s convention).
- **Glossary edits (instant):** the admin API already calls `revalidateTag('glossary',
  'max')`. Tag revalidation marks dependent ISR pages stale, so the next request
  re-renders with fresh data. **Explicit verification step:** edit a word in admin →
  reload its dialogue page → translation updated without deploy.
- **Content JSON edits:** go live on deploy (the build re-renders), same as today.

## Why static is safe for logged-in users

All per-user UI (auth state, trial banner, paywall, subscription menu) is **client-side**
(`useAuth`/`useTrial` fetch after hydration). No content page reads cookies/headers on
the server, so the served HTML is identical for every visitor today — caching it changes
nothing. Paywall enforcement is unchanged (client-side early-return, content JSON not
fetched client-side — same model as today).

## Verification gates (each phase)

1. `npx tsc --noEmit` + `npm run build` clean.
2. **Build route table flips:** content routes show `●`/ISR instead of `ƒ`. This is the
   single objective success signal.
3. Click-through: home, catalog (all 6 tabs), one dialogue per HSK level (all 4 reader
   tabs), grammar page, blog, payment, login flow; test-app smoke (dashboard, builder,
   player at `/test-app/t/[slug]`).
4. Metadata spot-checks per locale: `<html lang>`, title, description, hreflang
   alternates on home, a dialogue, a blog post.
5. Glossary live-edit propagation test (above).
6. TTFB measured before/after on production (expect ~0.5–0.9 s → <100 ms for cached hits).

## Phases

1. **P1 — metadata fixes (deployable, no behavior change):** the 23 `getLocale()` →
   `params` swaps + `/chinese` searchParams removal. Build still shows `ƒ` (root layout
   still dynamic) but all page-level blockers are gone.
2. **P2 — layout restructure (the core):** Approach A. Build must flip to `●` for the
   content matrix. Full click-through + metadata checks.
3. **P3 — revalidate audit + freshness verification:** add missing `revalidate`
   exports, confirm payment/test-app/auth stayed dynamic, run the glossary-edit test.
4. **P4 — deploy + measure:** production TTFB before/after; confirm admin edit
   propagation on production.

## Risks & rollback

- Branch + phased commits; rollback = revert the merge commit.
- Biggest risk: a corner page (root not-found, auth completion, test-app player) loses
  its shell or font in the restructure — covered by gate 3.
- next-intl 4.8.3 + Next 16.1.6: `[locale]`-as-root-layout is the documented next-intl
  setup; if Next rejects multiple root layouts in this arrangement (empirical check at
  P2 start), fall back to Approach B (hardcoded `lang` + client patch) and re-spec.

## Success criteria

- Content routes serve cached copies (`●` in build; production TTFB <100 ms warm).
- Zero visual/functional change on every page in gate 3.
- Admin glossary edits visible on the site without deploy.
- Payment, auth, test-app behavior byte-identical.
