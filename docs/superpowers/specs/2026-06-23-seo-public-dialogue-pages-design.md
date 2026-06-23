# SEO Public Dialogue Pages — Design

**Date:** 2026-06-23
**Goal:** Turn each Chinese dialogue page into a public, crawlable landing page (hero + description + full vocab + a short dialogue teaser) that funnels visitors into the gated full reader — so Google/Bing/Yandex can finally index dialogue content.

## Why

GSC shows ~14 indexed pages vs ~1,412 not indexed. Dialogue readers are gated two ways:
1. `proxy.ts` `PROTECTED_PATTERN` 307-redirects anonymous requests for `/chinese/dialogues/hsk…` to `/login`.
2. The client `DialogueReader` calls `useRequireAuth()` and fetches all content from the **gated** API `/api/content/dialogue/[book]/[slug]` (401 for anon).

Net: crawlers get a login redirect or an empty shell. The page is SSG, but the *content* (sentences, vocab) is never in the HTML. This redesign puts a substantive **public preview** into the server-rendered HTML and keeps the full dialogue gated.

## Scope

- **In:** the existing route `src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx` (all ~50 Chinese dialogues, HSK 1–6). Build once, applies to all.
- **Out (this cycle):** Arabic dialogues, flashcards, karaoke, writing. Same pattern can extend later. No content-writing of descriptions/images in this cycle (placeholders ship; real assets are added per-dialogue afterward, no redeploy needed via ISR).

## User-facing design (approved via mockup)

Image-as-hero layout (no red banner on this page):

- **Hero:** dialogue `image` if present, else a branded Blim-red placeholder block with the title/pinyin overlaid. Used as the `og:image`.
- **Tabs:** `Read` | `Keywords` (Grammar added later). Both panels are server-rendered into the HTML; the tab control only toggles CSS visibility — **never** a fetch-on-tap (or crawlers miss the hidden panel).
- **Read tab (public):** title (localized) + HSK level badge + description + the **first 3 dialogue lines** (hanzi + pinyin + translation) as a teaser, then a `🔒 yana N qator` divider and the red **"Read & Listen"** button.
- **Keywords tab (public):** the **full resolved vocab list** (hanzi + pinyin + localized meaning). This is the primary SEO content — it matches real phrase-lookup demand ("ni duo da meaning", etc.).
- **Gated:** dialogue lines 4→end, audio, and the interactive reader (vocab/grammar/practice tabs of the existing rich reader).

**Auth behavior, same URL for everyone:**
- Anonymous + crawler: see the preview; "Read & Listen" → `/login`.
- Logged-in: the full dialogue renders inline (lines 4→end + audio + existing reader features) — no extra click, no second page.

## Architecture

```
page.tsx (server, SSG, revalidate 3600)
 ├─ resolve full dialogue server-side: getDialogue() + getGlossary() (vocab refs → resolved entries)
 ├─ <DialoguePreview>            ← SERVER component, always in HTML (crawlable)
 │     hero, tabs shell, description, teaser (first 3 lines), full vocab
 │     uses a tiny client <PreviewTabs> island that only toggles panel visibility
 └─ <DialogueFullGate>          ← CLIENT island
        anon  → render nothing extra (preview's CTA links to /login)
        authed→ fetch /api/content/dialogue/[book]/[slug], render lines 4→end + audio
                + existing DialogueReader interactive features inline
```

Key point: the **preview is server-rendered** (SSG HTML, no auth, no fetch). The **full content stays behind the gated API**. The teaser shows the first 3 lines publicly; the authed full view continues from line 4 (no duplication).

### Components / files

- **`content/dialogues/hsk*/diagogueN.json`** — add two optional fields: `image` (URL string), `description_uz` / `description_ru` / `description_en` (string). Pages work without them.
- **`src/services/dialogues.ts`** — extend the dialogue/`DialogueInfo` types with `image?` and `description_*?`; ensure `getDialogue` returns them.
- **`src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx`** — resolve vocab server-side; render `<DialoguePreview>` + `<DialogueFullGate>`; add `openGraph.images` (image or placeholder) to `generateMetadata`.
- **`src/components/DialoguePreview.tsx`** (new, server) — hero, description, teaser (first 3 sentences), full vocab; renders both tab panels.
- **`src/components/PreviewTabs.tsx`** (new, client) — toggles Read/Keywords panel visibility via state/CSS only. Receives pre-rendered panels as children.
- **`src/components/DialogueFullGate.tsx`** (new, client) — auth-aware: anon shows nothing beyond the preview CTA; authed renders the full reader inline. Wraps/reuses existing `DialogueReader` logic; must **not** `useRequireAuth()`-redirect (soft gate, no redirect).
- **`src/proxy.ts`** — remove `dialogues\/hsk` from `PROTECTED_PATTERN` so the page returns 200 to anonymous requests. (Leave the `hsk` book-route gate and other entries untouched.)
- **`src/app/api/content/dialogue/[book]/[slug]/route.ts`** — unchanged: stays gated (401 for anon). Only the authed full-reader island calls it.
- **Hero placeholder** — a small presentational helper (CSS block, Blim red, title overlay) reused by preview + as a fallback og:image.

### Data flow / gating invariants

- Public HTML contains: description, full vocab, first 3 lines. Nothing else.
- Full sentences (4→end) + audio never appear in anonymous HTML or any public endpoint.
- One canonical URL per dialogue; content varies by auth at render time, not by URL.

## SEO requirements (acceptance)

- `curl -sI` of a dialogue URL (no cookie) → **200**, not 307.
- View-source of that URL contains the vocab list and the 3 teaser lines (server-rendered, not JS-injected).
- Unique `<title>`/meta per dialogue (already present) + `og:image` (hero or placeholder).
- Route still builds as `●` SSG with `generateStaticParams` (no regression to `ƒ`).
- Already in `sitemap.ts` (route pre-exists) — verify, no change expected.
- Logged-in user still gets the full dialogue + audio inline (no functional regression).

## Rollout

1. Build the architecture (applies to all dialogues, placeholders for image/description).
2. Deploy; **pilot-verify ~5 dialogues** in GSC (URL Inspection → indexable; watch impressions over 2–4 weeks).
3. If indexing confirmed, write real `image` + `description_*` per dialogue (content task, no redeploy — ISR picks it up).
4. Extend the pattern to flashcards / karaoke / writing in later cycles.

## Risks / mitigations

- **Cloaking risk:** never serve crawlers more than a logged-out human sees. The preview is identical for crawler and anon; only *authed* users (real login) see more. Safe freemium pattern.
- **Thin content:** the full vocab list + 3 teaser lines + description is the substance; placeholder-only pages (no description) still carry vocab + teaser, which is enough to be non-thin. Writing descriptions improves it further.
- **Hidden-tab indexing:** both tab panels must be in the DOM at load (CSS toggle), never lazy-fetched.
- **Auth regression:** the soft gate must not break the logged-in full-reader experience; verify an authed session renders lines 4→end + audio.
