# Chinese Catalog → Per-Tab Routes (Design)

**Date:** 2026-06-18
**Status:** Approved for planning

## Goal

Split the Chinese catalog's five in-page tabs into real, individually-addressable
routes so each content section is independently shareable, bookmarkable, back-button
friendly, and — most importantly — independently indexable by search engines. Today all
five tabs live at a single URL (`/{locale}/chinese`) and switch via React state only;
the address bar never changes, so Google sees one page instead of five.

This is a **pure structural refactor** ("Way 2" — clean extraction). No feature, content,
or visual changes. Everything stays under `blim.uz/chinese` (subdirectory, **not** a
subdomain — subdirectories keep all ranking signals pooled on the main domain).

## Background / current state

- **Single monolith:** `src/components/LanguagePage.tsx` (1,028 lines, client component)
  renders the red hero banner, the tab bar, the HSK-level pills, and all five tab content
  blocks. Tabs switch via `onClick={() => setActiveTab(tab.id)}` — state only, no URL change.
- **Tabs (5):** `Tab = 'dialogues' | 'writing' | 'flashcards' | 'karaoke' | 'grammar'`
  (the old "tests" tab is already gone).
- **Page wrapper:** `src/app/[locale]/chinese/page.tsx` is statically rendered
  (`revalidate = 3600`), loads **all data for all tabs** up front (dialogues HSK 1–6,
  flashcard deck, lesson info, all writing sets), and exposes **one** `generateMetadata`
  (one title/description for the whole catalog).
- **`?tab=` is read-only / one-way:** the page reads `?tab=` on load to pick the initial
  tab, but switching tabs never writes it back. `?tab=` exists only so deep-links *into*
  the page (back buttons from sub-pages) can preselect a tab.
- **State ownership (verified):** almost all state already belongs to exactly one tab:
  - Dialogues: `search`, `activeTag`, `showBookmarked`, `dialogueHskLevel`, `bookmarks`
  - Writing: `hskVersion`, `writingHskLevel`, `writingSearch`
  - Flashcards: `flashcardMode`, `flashcardSubTab`, `flashcardHskLevel`, `topicSearch`
  - Karaoke: `karaokeSearch`
  - Grammar: `grammarSearch`
  - Cross-cutting (chrome only): `activeTab`, `language`, and the HSK level shown in the hero.
- **Auth middleware (`src/proxy.ts`)** gates only `/chinese/hsk*` (paid content). Sibling
  routes named `writing` / `flashcards` / `karaoke` / `grammar` are **not** `hsk*`, so they
  are public by default — same as `/chinese`.
- **Static-rendering perf rule (must preserve):** never call `getLocale()` or read
  `searchParams` in a page or `generateMetadata` — it forces that route dynamic and loses
  the static cache. Locale comes from `params`.

## URL scheme (decided)

| Section    | URL                          | Notes                                              |
|------------|------------------------------|----------------------------------------------------|
| Dialogues  | `/{locale}/chinese`          | **Unchanged** — preserves existing ranking/backlinks; it is the natural default/landing. |
| Writing    | `/{locale}/chinese/writing`  | New route                                          |
| Flashcards | `/{locale}/chinese/flashcards` | New route                                        |
| Karaoke    | `/{locale}/chinese/karaoke`  | New route                                          |
| Grammar    | `/{locale}/chinese/grammar`  | New route                                          |

Rationale: keeping `/chinese` as the Dialogues landing avoids putting a 301-redirect on the
site's most valuable URL. The four others gain their own indexable addresses.

## Target architecture

### New file structure

```
src/app/[locale]/chinese/
  page.tsx                 # Dialogues landing — loads dialogue data, renders <DialoguesCatalog>
  writing/page.tsx         # renders <WritingCatalog>
  flashcards/page.tsx      # renders <FlashcardsCatalog>
  karaoke/page.tsx         # renders <KaraokeCatalog>
  grammar/page.tsx         # renders <GrammarCatalog>

src/components/catalog/
  CatalogHeader.tsx        # client: red hero + tab bar (tabs are <Link>s); props { currentTab, hskLevel? }
  DialoguesCatalog.tsx     # client: dialogues content + its own state (extracted from LanguagePage)
  WritingCatalog.tsx       # client: writing content + its own state
  FlashcardsCatalog.tsx    # client: flashcards content + its own state
  KaraokeCatalog.tsx       # client: karaoke content + its own state
  GrammarCatalog.tsx       # client: grammar content + its own state

src/services/ (or a local helper)
  catalogData.ts           # shared server-side loaders so the five page.tsx files don't duplicate the big loader
```

`src/components/LanguagePage.tsx` is **deleted** once extraction is complete.

### Component responsibilities (isolation)

- **`CatalogHeader`** — owns only the chrome: logo, `BannerMenu`, the per-tab Chinese
  character / pinyin / translation labels, the live HSK-level number, and the tab bar.
  The tab bar renders one `<Link>` per tab (to its route) and highlights `currentTab`.
  Inputs: `currentTab: Tab`, `hskLevel?: string` (so the hero number can reflect the active
  tab's level pill). No knowledge of any tab's internals.
- **Each `*Catalog` component** — owns one tab's content + state + controls (search box, HSK
  pills, subtabs). Renders `<CatalogHeader currentTab="…" hskLevel={…} />` at the top, then
  its content. The HSK level it tracks is passed up to the header for the hero number.
  Inputs: only the data its tab needs (typed props from its page).
- **Each `page.tsx`** — server component: `revalidate = 3600`, own `generateMetadata`
  (title, description, `alternates.canonical`, `alternates.languages` for uz/ru/en), loads
  **only its tab's data** via the shared loader helper, emits its own breadcrumb JSON-LD,
  and renders its `*Catalog` client component. Locale from `params` only.

### Data loading

The current wrapper loads everything for every tab. After the split, each page loads only
what it needs:
- Dialogues page: `loadDialoguesForBook('hsk1'…'hsk6')`
- Flashcards page: `loadFlashcardDeck('hsk1')` + `getLessonsWithInfo()` (lesson→flashcard mapping)
- Writing page: the `WRITING_SETS*` arrays
- Karaoke page: karaoke list (already client-discovered today — minimal server data)
- Grammar page: static grammar card list (minimal/none)

Shared transformation helpers currently inline in `page.tsx` (e.g. `tonelessPinyin`, the
flashcard-lesson mapping, the writing-set mapping) move into `catalogData.ts` so they aren't
duplicated across pages.

## Backward compatibility

### Internal links (~50 references — repoint directly)

All in-repo links currently using `/chinese?tab=…` are updated to the new routes
(preserving any inner params like `dialhsk`, `flashhsk`, `subtab`, `version`, `hsk`):

- **Breadcrumb paths** in sub-page `generateMetadata` (dialogue/karaoke/flashcard/writing/
  grammar reader pages across hsk1–hsk6).
- **`listPath` prop** passed to the dialogue reader (`hsk{1..6}/dialogues/[dialogueId]/page.tsx`).
- **`backHref` / back-button links** in `FlashcardDeck.tsx`, `KaraokePlayer.tsx`, the
  topic/mix flashcard pages, `WritingPracticePage.tsx`, and all `Grammar*PolishedPage.tsx`.
- **Footer/nav links** in `PageFooter.tsx` and `HomePage.tsx`.
- **`hsk1/dialogues/page.tsx`** currently `redirect('/chinese?tab=dialogues')` → redirect to
  `/chinese`.

Mapping rule:
- `?tab=dialogues[&dialhsk=N]` → `/chinese[?dialhsk=N]`
- `?tab=writing[&version=…&hsk=N]` → `/chinese/writing[?version=…&hsk=N]`
- `?tab=flashcards[&flashhsk=N][&subtab=topics]` → `/chinese/flashcards[?flashhsk=N][&subtab=topics]`
- `?tab=karaoke` → `/chinese/karaoke`
- `?tab=grammar` → `/chinese/grammar`

### External / bookmarked links (middleware redirect)

Old `/{locale}/chinese?tab=<x>` URLs from outside (bookmarks, shared links, search index)
are redirected to the new route in **`src/proxy.ts`** middleware, preserving other query
params. This must live in middleware — doing it in the page would require reading
`searchParams`, which would force `/chinese` dynamic and break static caching.

Rule: on `/{locale}/chinese` with a `tab` query whose value ∈ {writing, flashcards, karaoke,
grammar}, 308-redirect to `/{locale}/chinese/<tab>` carrying remaining params. `tab=dialogues`
strips the param and stays on `/{locale}/chinese`.

## SEO

- **Per-route metadata:** each new page exports `generateMetadata` with a unique title +
  description (trilingual via `params.locale`), `alternates.canonical = /{locale}/chinese/<tab>`,
  and `alternates.languages` for uz/ru/en + `x-default`.
- **`/chinese`** keeps its current Dialogues-oriented metadata (canonical stays `/{locale}/chinese`).
- **Breadcrumb JSON-LD** on each route: Home → Chinese (`/chinese`) → `<Section>` (`/chinese/<tab>`).
- **Sitemap** (`src/app/sitemap.ts`): add the four new routes × three locales (same
  `localeEntries` pattern, public/crawlable like `/chinese`).

## Out of scope (stays as-is)

- **Inner controls remain query params / state**, exactly as today: HSK level pills
  (`dialhsk`, `flashhsk`, `hsk`), flashcard `subtab` (lessons/topics), writing `version`
  (2.0/3.0). No new routes for these.
- No visual/UX changes, no content changes.
- Arabic is a separate later project; this refactor is the foundation it will build on.

## Risks & mitigations

- **It's a refactor of a revenue page.** → Execute task-by-task with verification between
  steps; pure extraction (copy each block + its state verbatim into its component, no logic
  changes).
- **Accidentally going dynamic.** → After each route is added, confirm the build table shows
  `●` (SSG) / ISR for it, not `ƒ` (dynamic). No `getLocale()`/`searchParams` in pages or metadata.
- **Broken back navigation.** → Repoint all ~50 internal links *and* add the middleware
  redirect; manually click back-buttons from a reader/flashcard/grammar page to confirm they
  land on the right new route.
- **Lost tab state on the hero number.** → Each `*Catalog` passes its current HSK level into
  `CatalogHeader` so the hero number still tracks the pills.

## Verification

- `npm run build` — all five catalog routes render `●`/ISR (not `ƒ`); build green.
- Visit each of the five URLs directly → correct section loads, correct metadata in `<head>`.
- Click every tab → URL changes, Back button steps between tabs, refresh keeps the tab.
- From a dialogue/flashcard/karaoke/grammar/writing reader, hit Back → lands on the correct
  new catalog route with the right inner state (HSK pill, subtab).
- Old `/chinese?tab=flashcards&flashhsk=2` (and friends) → redirects to the new route with
  params preserved.
- Sitemap includes the four new routes × three locales.
