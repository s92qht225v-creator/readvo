# Section-First URLs — Cycle 3: Flashcards Implementation Plan

> **For agentic workers:** Mechanical URL migration. Verified by `npm run build` + `grep` + production `curl` (no component test suite). Steps use checkbox syntax.

**Goal:** Move flashcard content URLs from book-first (`/chinese/hsk{N}/flashcards/...`) to section-first (`/chinese/flashcards/...`), 301-redirect the old URLs, keep paid deck pages login-gated and the public catalog ungated.

**Architecture:** Mirror the shipped dialogues/karaoke cycles: move route folders → add 301 redirects in `src/proxy.ts` → extend the auth gate → repoint internal links → build/deploy/curl. Three per-level lesson routes merge into one `flashcards/[level]/[lessonId]` (branching on `level`); `mix` and `topic` client pages move under `flashcards/` (`topic`→`topics`).

**Tech Stack:** Next.js 16 App Router, next-intl, TypeScript.

## URL mapping (from spec)

| Old | New |
|---|---|
| `/chinese/hsk{N}/flashcards/[lessonId]` | `/chinese/flashcards/hsk{N}/[lessonId]` |
| `/chinese/hsk1/flashcards/topic/[topicId]` | `/chinese/flashcards/topics/[topicId]` |
| `/chinese/hsk1/flashcards/mix` | `/chinese/flashcards/mix` |

`hsk1` lessons route serves BOTH numeric lessons (`1`..`15`) and writing-set decks (`hsk1-set1`). `hsk2`/`hsk3` serve writing-set decks only.

---

### Task 0: Branch + baseline (DONE)
- [x] `git checkout -b section-first-flashcards`
- [x] Snapshot baseline flashcard route list.

### Task 1: Merged `flashcards/[level]/[lessonId]` route

**Files:**
- Create: `src/app/[locale]/chinese/flashcards/[level]/[lessonId]/page.tsx`

Combine the three source pages' logic, keyed on `level` (`hsk1`|`hsk2`|`hsk3`); 404 any other level. Preserve `revalidate = 3600`.

- [ ] **generateStaticParams**: hsk1 → numeric lessons (from `loadFlashcardDeck('hsk1')`) + `WRITING_SETS` ids; hsk2 → `WRITING_SETS_HSK2_L2` ids; hsk3 → `WRITING_SETS_HSK3` ids. Emit `{ level, lessonId }`.
- [ ] **generateMetadata**: branch by level + (hsk1 writing-set vs numeric). Reuse the exact title/description strings from each source page. canonical/hreflang → `/${locale}/chinese/flashcards/${level}/${lessonId}`.
- [ ] **Page body**: 
  - hsk1 + `isWritingSetId` → `getWritingSet`, `FlashcardDeckLoader book="hsk1" deckId bookPath="/chinese/hsk1"`.
  - hsk1 + numeric → `loadFlashcardDeck('hsk1')` + `getLessonsWithInfo()`, filter words, lesson info props.
  - hsk2 → `getWritingSet`, `book="hsk2"`, `backHref="/chinese/flashcards?flashhsk=2"`.
  - hsk3 → `getWritingSet`, `book="hsk3"`, `backHref="/chinese/flashcards?flashhsk=3"`.
  - Breadcrumb: Blim → Chinese (`/${locale}/chinese/dialogues`) → Flashcards (`/${locale}/chinese/flashcards`) → set/lesson (new path). (Standardize the flashcards crumb to `/chinese/flashcards` — fixes the old hsk1 page's dead `/chinese/hsk1/flashcards` crumb.)
- [ ] Build compiles (full build in Task 3).

### Task 2: Move `mix` and `topic` client pages

**Files:**
- Create: `src/app/[locale]/chinese/flashcards/mix/page.tsx` (verbatim copy of `hsk1/flashcards/mix/page.tsx` — already targets `/chinese/flashcards`; no change needed inside).
- Create: `src/app/[locale]/chinese/flashcards/topics/[topicId]/page.tsx` (copy of `hsk1/flashcards/topic/[topicId]/page.tsx`; verbatim — `backHref` already `/chinese/flashcards?subtab=topics`, router fallback already `/chinese/flashcards`).

- [ ] Copy both files to new locations (folder `topic` → `topics`).

### Task 3: Delete old folders + build

**Files:**
- Delete: `src/app/[locale]/chinese/hsk1/flashcards/`, `hsk2/flashcards/`, `hsk3/flashcards/`.

- [ ] `git rm -r` the three old `*/flashcards` folders.
- [ ] `rm -rf .next/dev/types` (clear stale route validators).
- [ ] `npm run build` — confirm:
  - `● /[locale]/chinese/flashcards/[level]/[lessonId]` (SSG, params for all 3 levels)
  - `flashcards/mix` and `flashcards/topics/[topicId]` present
  - no `/[locale]/chinese/hsk{1,2,3}/flashcards/...` routes remain
  - no `ƒ` regression on the merged lessons route.

### Task 4: Redirects + auth gate (`src/proxy.ts`)

- [ ] Add 301 redirects after the karaoke block, before the auth gate, in THIS ORDER (specific first):
  - `/^\/(uz|ru|en)\/chinese\/hsk(\d)\/flashcards\/mix$/` → `/${1}/chinese/flashcards/mix`
  - `/^\/(uz|ru|en)\/chinese\/hsk(\d)\/flashcards\/topic\/(.+)$/` → `/${1}/chinese/flashcards/topics/${3}`
  - `/^\/(uz|ru|en)\/chinese\/hsk(\d)\/flashcards\/(.+)$/` → `/${1}/chinese/flashcards/hsk${2}/${3}`
- [ ] Extend `PROTECTED_PATTERN` to `/^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.|flashcards\/.)/` — gates deck/mix/topic pages, leaves bare `/chinese/flashcards` catalog public.

### Task 5: Repoint internal links

**Files:**
- `src/components/catalog/FlashcardsCatalog.tsx`: lesson href `/chinese/${hskPath}/flashcards/${set.id}` → `/chinese/flashcards/${hskPath}/${set.id}`; topic href `/chinese/hsk1/flashcards/topic/${topic.slug}` → `/chinese/flashcards/topics/${topic.slug}`.
- `src/app/api/corrections/route.ts`: label parser `path.includes('/flashcards/topic/')` + `split('/topic/')` → `/flashcards/topics/` + `split('/topics/')` (new path no longer contains `/topic/`).

- [ ] Apply both edits.
- [ ] `grep -rn "hsk[0-9]/flashcards\|flashcards/topic/" src` → only matches are in deleted-folder-free code (none in active src).

### Task 6: Ship

- [ ] Final `npm run build` clean.
- [ ] Commit, merge `--ff-only` to main, push, `ssh deploy@... './deploy.sh'`.
- [ ] Production curl:
  - old `/uz/chinese/hsk1/flashcards/1` → 301 → `/uz/chinese/flashcards/hsk1/1`
  - old `/uz/chinese/hsk2/flashcards/hsk2-set1` → 301 → `/uz/chinese/flashcards/hsk2/hsk2-set1`
  - old `/uz/chinese/hsk1/flashcards/mix` → 301 → `/uz/chinese/flashcards/mix`
  - old `/uz/chinese/hsk1/flashcards/topic/X` → 301 → `/uz/chinese/flashcards/topics/X`
  - new `/uz/chinese/flashcards/hsk1/1` uncookied → 307 → `/login` (gated)
  - new `/uz/chinese/flashcards/mix` + `/topics/X` uncookied → 307 → `/login`
  - `/uz/chinese/flashcards` catalog → 200 (public)
