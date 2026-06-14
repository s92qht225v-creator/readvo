# Dialogue Content Gating (static shell + authenticated content endpoint) — Design Spec

**Date:** 2026-06-14
**Status:** Approved design → next: implementation plan
**Scope (locked with user):** Pilot on **dialogues only**. Karaoke + non-free
flashcards are a fast follow-up reusing the same helper/pattern, out of scope
here.
**Preview behaviour (locked with user):** **Hard paywall** — a non-entitled
user gets the shell + paywall and **zero paid content** reaches the browser.

## Problem

Dialogue pages are statically rendered (SSG/ISR). The page server-component
loads the full resolved dialogue (`loadDialogue` + `resolveDialogueVocab`) and
passes it as the `dialogue` prop to `DialogueReader`. When the 7-day trial has
expired the reader only adds a CSS blur (`paywall-blur`) plus a `<Paywall/>`
overlay — the Chinese text, pinyin, translations, vocab, and audio URLs are
still in the page HTML / RSC payload for **anyone holding the `blim-auth`
cookie** (every logged-in user, including trial-expired and never-paid). The
content is readable via View Source or by deleting the blur. The gate is
cosmetic, not real.

## Goal

Paid dialogue content is served only to entitled users (active trial **or**
active subscription), enforced **server-side**. The page keeps its static
shell (fast, cached); the paid body is fetched at runtime from an authenticated
endpoint that withholds content from non-entitled users entirely.

## Decisions (locked)

- **Approach A** (client fetches content from an auth endpoint) over Approach B
  (per-user dynamic SSR of the whole page). B would discard the static-rendering
  perf win shipped 2026-06-12 (~0.5 s TTFB returns) for no benefit over A.
- **Entitlement = active subscription OR active trial.** No per-dialogue free
  tier — this preserves today's behaviour (all dialogues are accessible during
  the trial and locked after it; nothing is free-after-trial).
- **Hard paywall**: non-entitled → `402`, no content body returned.

## Architecture

### 1. Server entitlement helper — `src/lib/entitlement.ts`

```ts
export interface Entitlement { entitled: boolean }

/**
 * Server-side source of truth for "can this user access paid content".
 * Mirrors the client useTrial logic but is authoritative (never trusts the
 * client). Subscription is checked first (one indexed DB query); the trial
 * fallback (which needs auth.users.created_at via getUserById, a slower
 * remote call) only runs for users without an active subscription.
 */
export async function resolveEntitlement(userId: string): Promise<Entitlement>;
```

Logic:
1. Query `subscriptions` where `user_id = userId` and `ends_at > now()` (same
   query shape as `/api/subscription`). If a row exists → `{ entitled: true }`.
2. Else fetch the auth user (`admin.auth.admin.getUserById(userId)`), read
   `created_at`; trial is active if `created_at + 7d > now`. Return that.
3. On any error → `{ entitled: false }` (fail closed).

`TRIAL_DAYS = 7` is duplicated from `useTrial` for now (a shared constant is a
trivial later cleanup; not worth a new module for the pilot).

Uses the shared `getSupabaseAdmin()` singleton for the DB + auth-admin reads
(read-only, no session-mutating calls — safe on the singleton).

### 2. Content endpoint — `GET /api/content/dialogue/[book]/[slug]/route.ts`

- Read `Authorization: Bearer <token>` → `getUserIdFromJWT(token)` (local
  decode, like `/api/subscription`). No token / bad token → `401 { locked:
  true }`.
- `resolveEntitlement(userId)` → if not entitled, `402 { locked: true }` with
  **no content**.
- If entitled: `loadDialogue(book, slug)` → if missing, `404`. Else
  `resolveDialogueVocab(raw)` (the exact pipeline the page uses today) and
  return `200 { dialogue }` (the resolved `DialoguePage`).
- `book` is validated against the known set (`hsk1`..`hsk6`); anything else →
  `404`.

This route is dynamic (`ƒ`) by nature (per-user) — that is correct and
expected; it does not affect the static rendering of the page shell.

### 3. Dialogue page (server component) — stays SSG

`src/app/[locale]/chinese/hsk1/dialogues/[dialogueId]/page.tsx` (and the HSK
2–6 siblings when rolled out):

- Still `generateStaticParams` + `generateMetadata` as today (metadata lives in
  `<head>`, behind the login wall — unchanged).
- It still calls `loadDialogue` to build the **shell metadata** for the hero
  and the JSON-LD, but it **no longer resolves vocab and no longer passes the
  body**. It passes a small `meta` object to the reader:
  `{ book, slug, title, pinyin, titleTranslation, titleTranslation_ru,
  titleTranslation_en, level }`.
- The paid body (`sections`, `vocab`, `phrases`, `timeOfDay`, `audio_url`,
  extra-vocab fields) is **not** serialised into the page.

The title/pinyin/translation in the hero are non-sensitive labels (also in the
page `<title>`); keeping them in the shell is fine and needed for the loading
and paywall states. The learning content (sentences + vocab glosses) is what
moves behind the endpoint.

### 4. Reader change — `meta` prop + fetched body (single component)

`DialogueReader` is changed to receive `{ meta, book, slug, bookPath, listPath }`
instead of `dialogue`. It holds the fetched `dialogue` in state (nullable) plus a
`status` (`loading | loaded | locked | error`). On mount it `GET`s the content
endpoint with the access token.

- The **hero** (level / title / pinyin / translation) renders immediately from
  `meta` — instant, from the static shell.
- The **body** (tab bar + the four tab panels) renders only when `status ===
  'loaded'`:
  - **loading** → existing `loading-spinner` in the body area.
  - **locked** (401/402) → hard `<Paywall/>`; the body is never rendered. The
    `paywall-blur` cosmetic path is removed.
  - **error** (network/5xx) → inline message + Retry (reuse the existing
    `.page__audio-error` toast styling).

All hooks that read the dialogue become null-safe (`dialogue?.sections ?? []`),
which preserves hook order (hooks still run unconditionally). Kept as **one
component** rather than a separate shell/body because `fontSize`, `language`, and
the floating font controls are shared across the hero and the body; threading
them through a split would be more churn for no behavioural gain.

`getAccessToken()` from `useAuth()` supplies the Bearer token (same as
`SpeakingMashq` / `DialogueRolePlay`). All six HSK dialogue `[dialogueId]/
page.tsx` files (hsk1–hsk6) share this reader, so all six switch to passing
`meta` + `book` + `slug` together.

## Data flow

```
static shell (SSG, hero only)
  → client mounts → fetch /api/content/dialogue/hsk1/{slug}  (Bearer token)
      → server: getUserIdFromJWT → resolveEntitlement
          → entitled: loadDialogue + resolveDialogueVocab → 200 { dialogue }
          → not:      402 { locked: true }   (no body)
  → client: 200 → render body | 401/402 → <Paywall/> | error → retry
```

## Side effects (positive)

- **Glossary edits are fully live.** Vocab is resolved per-request in the
  endpoint, so the `revalidateTag('glossary')` propagation to static dialogue
  pages is no longer needed for the dialogue body (the admin glossary write +
  tag stay; they simply stop being load-bearing for dialogues). Other glossary
  consumers are unaffected.
- **Smaller static HTML**; the shell stays cached and fast.
- **SEO unchanged** — dialogue pages are already behind the login-wall
  middleware and already excluded from the sitemap (2026-06-14 cleanup).

## Error handling

| Case | Endpoint | Reader |
|---|---|---|
| No/invalid token | `401 { locked: true }` | Paywall (middleware should have required login already) |
| Not entitled | `402 { locked: true }` | Paywall, no content |
| Unknown book / missing slug | `404` | "Not found" message (shouldn't happen — slug came from a built page) |
| Server/network error | `5xx` / fetch reject | Inline error + Retry button |
| Loading | — | `loading-spinner` |

Fail closed everywhere: any ambiguity → treated as locked, never as entitled.

## Verification gates

1. `npx tsc --noEmit` + `npm run build` clean; dialogue pages still `●` SSG.
2. **Content not in HTML:** `curl` a built dialogue page → the response HTML
   contains the hero title but **no sentence `text_original` / vocab gloss**.
3. **Entitled path:** a user with an active trial or subscription opens a
   dialogue → endpoint returns `200`, content renders, all four reader tabs work
   (Dialog / Words / Dictation / Practice).
4. **Locked path:** simulate a non-entitled user (expired trial, no sub) →
   endpoint returns `402`; the Network panel shows no dialogue body; the page
   shows the hero + Paywall only.
5. **Glossary live-edit:** edit a word in admin → reopen the dialogue (entitled)
   → gloss updated with no deploy.
6. Manual entitlement-helper check: a subscriber skips the `getUserById` call
   (subscription branch); a trial user hits it and is entitled until day 7.

## Risks & rollback

- **Latency:** one extra round-trip per dialogue open (spinner shown) + a
  `getUserById` call for non-subscribers. Acceptable for a per-open action;
  noted as a future optimisation (cache created_at / store in a profile row).
- **Reader refactor risk:** the shell/body split is the largest change. Mitigated
  by keeping the body internals intact (only the hero and the prop source move)
  and verifying all four tabs in gate 3.
- **Rollback:** branch + revert. Because the page change and the reader change
  ship together, reverting the merge restores the embedded-content behaviour.

## Out of scope (explicit)

- Karaoke and flashcard gating (same pattern, fast follow-up).
- Writing practice (currently has no paywall at all — separate decision).
- Any change to the login wall, sitemap, or trial length.
- Optimising the `getUserById` trial lookup.
