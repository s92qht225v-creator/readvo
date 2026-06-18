# Section-First Content URLs for Chinese (Design)

**Date:** 2026-06-18
**Status:** Approved for planning
**Predecessor:** 2026-06-18-chinese-catalog-routes (catalog tabs already section-first; shipped)

## Goal

Migrate all Chinese **content reader** URLs from the legacy "book-first" scheme
(`/chinese/hsk{N}/{section}/{item}`) to a "section-first" scheme
(`/chinese/{section}/…/{item}`) that matches the catalog tabs. Preserve SEO: every
old URL 301-redirects to its new URL; all internal links, breadcrumbs, sitemap entries,
JSON-LD, and hreflang update. Roll out **one content type at a time** to contain risk.

This is a pure URL/structure migration. No content, copy, or reader-behaviour changes.

## Background / current state

Content reader routes today (verified):
- **Dialogues:** `/chinese/hsk{1-6}/dialogues/[dialogueId]` (per-level folders) + a vestigial
  `/chinese/hsk1/dialogues` list page that already redirects to `/chinese`.
- **Flashcards:** `/chinese/hsk{1-3}/flashcards/[lessonId]`, plus `/chinese/hsk1/flashcards/mix`
  and `/chinese/hsk1/flashcards/topic/[topicId]`.
- **Karaoke:** `/chinese/hsk1/karaoke/[songId]` (the `hsk1` is vestigial — songs are not HSK-leveled).
- **Grammar:** 15 static slug pages under `/chinese/hsk1/grammar/[slug]` (`hsk1` vestigial — all grammar is HSK 1).
- **Writing:** `/chinese/hsk1/writing/[setId]` — ALL sets across HSK 2.0 (levels 1-6) and HSK 3.0
  (level 1) live under the single `hsk1` folder, with version+level baked into the source array
  and the setId (e.g. `hsk1-set1`).

Catalog tabs (already section-first, shipped): `/chinese` (Dialogues), `/chinese/writing`,
`/chinese/flashcards`, `/chinese/karaoke`, `/chinese/grammar`.

Routes with `generateStaticParams` (prerender every item — must be preserved after the move):
all dialogue `[dialogueId]`, flashcard `[lessonId]`, karaoke `[songId]`, writing `[setId]`.

**Topics are cross-level:** 28 theme decks (animals, body, business…), no HSK level field in
their JSON, and the catalog shows all of them regardless of the HSK pill. So topics carry NO
level segment (same reasoning as karaoke/grammar). Mix is likewise a cross-level deck.

## Target URL scheme (decided)

| Type | Old | New |
|---|---|---|
| Dialogues | `/chinese/hsk{N}/dialogues/[slug]` | `/chinese/dialogues/hsk{N}/[slug]` |
| Karaoke | `/chinese/hsk1/karaoke/[songId]` | `/chinese/karaoke/[songId]` |
| Grammar | `/chinese/hsk1/grammar/[slug]` | `/chinese/grammar/[slug]` |
| Flashcards — lessons | `/chinese/hsk{N}/flashcards/[lessonId]` | `/chinese/flashcards/hsk{N}/[lessonId]` |
| Flashcards — topics | `/chinese/hsk1/flashcards/topic/[topicId]` | `/chinese/flashcards/topics/[topicId]` |
| Flashcards — mix | `/chinese/hsk1/flashcards/mix` | `/chinese/flashcards/mix` |
| Writing | `/chinese/hsk1/writing/[setId]` | `/chinese/writing/{2.0\|3.0}/hsk{N}/[set]` |

Rule: a level (`hsk{N}`) or version (`2.0`/`3.0`) segment appears **only when it is real**.
Cross-level items (karaoke, grammar, topics, mix) carry no level.

**Next.js routing note:** under `/chinese/flashcards`, the static segments `mix` and `topics`
coexist with the dynamic `[level]` segment — static wins for exact matches, and `[level]`
values (`hsk1`–`hsk3`) never equal `mix`/`topics`, so there is no collision.

### Writing data-layer change (the one non-trivial bit)

Today writing is looked up by a single global `setId`. The new path carries `version`, `level`,
and a per-(version,level) set number, so the writing service gains a resolver:

```
resolveWritingSet(version: '2.0' | '3.0', level: '1'..'6', setNum: string) → WritingSet | null
```

It selects the correct `WRITING_SETS*` array from (version, level) using the SAME mapping the
catalog already uses (version 3.0 → `WRITING_SETS` (level 1 only); version 2.0 → the
`WRITING_SETS_HSK*` arrays by level), then finds the set by its number. The exact array↔(version,
level) mapping is read from `src/services/writing.ts` + the catalog's existing logic during the
writing implementation cycle. The `[set]` path segment is the set's number (e.g. `set1`); the old
global `setId` (e.g. `hsk1-set1`) is mapped to its (version, level, setNum) for the redirect.

## Redirect mechanism

Every old URL → **301 Permanent Redirect** to the new URL, implemented as regex patterns in the
existing `src/proxy.ts` middleware (so dynamic `[slug]`/`[id]`/`[setId]` are handled without
enumerating items). 301 (permanent) is the correct SEO signal — Google transfers ranking and
updates its index; the catalog split used 308 for tab-state links, but for content-page moves 301
is standard. Patterns are kept indefinitely (cheap; bookmarks + backlinks keep working).

The old `page.tsx` files MOVE to the new paths (no stub pages left behind). The middleware
inserts these redirects alongside the existing `?tab=` redirect, before the auth gate.

Redirect patterns (one per type, added in that type's cycle):
- `/{locale}/chinese/hsk(\d)/dialogues/(.+)` → `/{locale}/chinese/dialogues/hsk$1/$2`
- `/{locale}/chinese/hsk1/karaoke/(.+)` → `/{locale}/chinese/karaoke/$1`
- `/{locale}/chinese/hsk1/grammar/(.+)` → `/{locale}/chinese/grammar/$1`
- `/{locale}/chinese/hsk(\d)/flashcards/mix` → `/{locale}/chinese/flashcards/mix`
- `/{locale}/chinese/hsk(\d)/flashcards/topic/(.+)` → `/{locale}/chinese/flashcards/topics/$2`
- `/{locale}/chinese/hsk(\d)/flashcards/(.+)` → `/{locale}/chinese/flashcards/hsk$1/$2` (after mix/topic patterns, so they match first)
- `/{locale}/chinese/hsk1/writing/([^/]+)` → resolve old setId to `/{locale}/chinese/writing/{version}/hsk{level}/set{N}`

The auth gate currently protects `/chinese/hsk*`. After the migration, content paths no longer
start with `hsk`, so the gate's protected-path pattern MUST be updated per cycle to gate the new
paths instead (e.g. `/chinese/dialogues/hsk{N}/…`, `/chinese/writing/…`) — otherwise paid content
would become ungated. This is a critical per-cycle step.

## Rollout — one content type per cycle

Each type is its own implement→verify→ship loop, in this order (proves the pattern on the largest
type first, defers the data-layer change to last):

1. **Dialogues** — move 6 level folders into `dialogues/[level]/[slug]`; redirect; update the
   dialogue reader pages' breadcrumb/`listPath`, the catalog cards' hrefs, sitemap, auth gate.
2. **Karaoke** — drop the level; tiny.
3. **Grammar** — drop the level on all 15 slug pages + the catalog grammar cards.
4. **Flashcards** — lessons under `[level]`, topics + mix level-less; update catalog hrefs,
   back-links, auth gate.
5. **Writing** — add the `resolveWritingSet` resolver; new `version/level/set` route; map old
   setIds in the redirect; update catalog set hrefs + back-URL ladder.

Per cycle, in order:
1. Move the route folder(s) to the new path; preserve `generateStaticParams`, metadata,
   JSON-LD, and reader behaviour exactly.
2. Add the 301 redirect pattern(s) to `src/proxy.ts`.
3. Update the auth gate's protected pattern to cover the new paths for that type.
4. Repoint internal links for that type: catalog card hrefs, reader breadcrumbs (`path:`),
   `listPath`/`backHref` props, footer/nav, `jsonLd.ts`.
5. Update `sitemap.ts` for that type (new URLs; the catalog tab URLs already exist).
6. Build (routes must stay `●`/ISR, not `ƒ`), then deploy.
7. Verify in production (curl): new URLs 200; old URLs 301→new (params preserved); auth gate still
   blocks paid content at the new paths.
8. Watch Search Console before starting the next type.

## Out of scope

- The catalog tab URLs (`/chinese`, `/chinese/{writing,flashcards,karaoke,grammar}`) — already done.
- Any content/copy/reader-UX change.
- Renaming the underlying setIds/lessonIds in data files (only the URL path shape changes; the
  identifiers stay, mapped by the resolver/redirects).
- Arabic (separate future project).

## Risks & mitigations

- **SEO equity loss on indexed content URLs.** → 301 (permanent) redirects, kept indefinitely;
  per-type rollout with Search Console observation between cycles.
- **Auth gate gap.** → Updating the protected-path pattern is a mandatory per-cycle step; verify in
  production that the new paid paths still redirect logged-out users.
- **Static-rendering regression.** → After each move, confirm the moved routes still build as
  `●`/ISR (not `ƒ`); `generateStaticParams` preserved.
- **Redirect-order bugs (flashcards).** → The `mix` and `topics` patterns must precede the generic
  `flashcards/(.+)` pattern; verify all three with curl.
- **Writing array mapping.** → The `resolveWritingSet` (version,level)→array mapping is derived from
  the existing catalog logic and unit-traced against every old setId in the writing cycle.

## Verification (per cycle)

- `npm run build` — moved routes render `●`/ISR; no `ƒ` leak; `generateStaticParams` intact.
- `grep` — no internal link still points at the old `/chinese/hsk{N}/{thistype}/…` path.
- Production curl — new URL 200 with correct `<title>`; old URL `301 → new`; a paid item at the new
  path 307→login when logged out.
- Sitemap includes the new URLs for that type.
