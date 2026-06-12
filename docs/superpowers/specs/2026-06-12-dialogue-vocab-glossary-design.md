# Central Dialogue-Vocabulary Glossary — Design Spec

**Date:** 2026-06-12
**Status:** Approved design (pending spec review) → next step: implementation plan
**Author:** Blim team

## Problem

Dialogue vocabulary is stored inline in each dialogue JSON's `vocab[]` array, with all
three languages embedded per word. There is no single source of truth. Today this means:

- **218** vocab entries are duplicated across **31** dialogue files.
- **24** words already appear in 2+ dialogues; **11** of them have **diverging** Uzbek
  glosses or pinyin (e.g. 面条 = "lag'mon" vs "ugra (lag'mon)"; 准备 = "tayyorlanmoq" vs
  "tayyorlamoq, tayyorgarlik").
- A gloss fix lives in one file only; the same word elsewhere keeps the stale value.
- There is no editor — every correction is a hand-edit in JSON.
- No validation (completeness, JSON-breaking Chinese curly quotes, referential integrity).
- The data is trapped per-file: no cross-dialogue flashcard decks, dictionary, or search.

## Goal

A single vetted glossary as the source of truth for dialogue-word **translations**, stored in
Supabase and **editable from the admin panel**, with dialogues referencing it — **without
changing the Words-tab UI or any visible behavior** of existing dialogues.

## Research basis (why the key is `(zh, pinyin)`)

CC-CEDICT — the standard Chinese-English dictionary (~123k entries) — keys every entry by
`(traditional, simplified, pinyin)`, **not by characters alone**. Homographs (same written
form, different reading/meaning) are *separate entries* disambiguated by pinyin. Lexicography
practice is to *enumerate senses of an orthographic form*, not collapse them.

Blim's own data already contains this collision class:

| 汉字 | readings | meanings |
|------|----------|----------|
| 还 | hái / huán | "still, yet" / "to return" |
| 打 | dǎ / dá | "to hit, to play" / "a dozen" |
| 长 | cháng / zhǎng | "long" / "to grow; elder" |
| 觉 | jué / jiào | "to feel" / "sleep 睡觉" |
| 着 | zhe / zháo / zhuó | aspect particle / "to catch" / "to wear" |

**Decision (non-negotiable):** the glossary key is `(zh, pinyin)`. A key on `zh` alone would
silently merge these.

Sources: <http://cc-cedict.org/wiki/format:syntax>, <https://en.wikipedia.org/wiki/CEDICT>,
<https://arxiv.org/pdf/2405.07006>.

## Locked decisions (from design review)

1. **Reference style:** dialogues list bare `zh` strings; pinyin is added only for homographs.
2. **Polysemy depth (v1):** one gloss per `(zh, py)`; a dialogue overrides the meaning inline
   when it needs a different sense at the same reading. No `senses[]` array in v1.
3. **HSK metadata:** every entry carries an `hsk` field (filled during migration).
4. **Storage:** the glossary lives in a **Supabase table**, edited via the admin panel — *not*
   a file in the repo (a deployed server can't durably edit its own source).
5. **Process:** formalize via spec (this doc) → writing-plans → implementation.

## Architecture: content vs. data split

Two concerns are separated by where they live:

- **"Which words a dialogue teaches" = content.** Stays in the dialogue JSON as an ordered
  **reference list** (in git, versioned, appearance-ordered). Rarely changes.
- **"What each word means" = data.** Moves to the Supabase `glossary` table. Editable in the
  admin panel; goes live without a code deploy.

Only the **server** reads the glossary table (service-role), resolves a dialogue's references
into translations, and renders. The browser never queries Supabase for glossary data.

### Supabase `glossary` table

```sql
create table glossary (
  id         uuid primary key default gen_random_uuid(),
  zh         text not null,
  py         text not null,                       -- tone-marked pinyin, as displayed
  py_norm    text not null,                       -- normalized for uniqueness (see below)
  uz         text not null,
  ru         text not null,
  en         text not null,
  hsk        smallint check (hsk between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zh, py_norm)
);
```

- `py_norm = py.normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase()` — computed in app
  code on write. Tone marks survive NFC, so cháng ≠ zhǎng stay distinct; the DB `unique
  (zh, py_norm)` constraint guarantees one entry per `(zh, reading)`.
- **Simplified only** — no traditional column (Blim content is 100% simplified).
- **No example-sentence columns** — consistent with the prior dead-field cleanup.
- **RLS / access:** **RLS is enabled with no policies.** The service-role key (server reads +
  admin API writes) bypasses RLS and keeps full access; anon/authenticated roles get zero
  access. The browser never touches the table directly. (Note: RLS *disabled* would expose the
  table to the public anon key for read **and write** — the opposite of "no public access".)

### Reference model — dialogue `vocab[]`

A dialogue's `vocab` becomes an ordered list of references (appearance order preserved):

```json
"vocab": [
  "心事",                          // bare string — must resolve to exactly one entry
  { "zh": "还", "py": "hái" },      // homograph — pinyin disambiguates
  { "zh": "打", "py": "dǎ", "uz": "o'ynamoq" }  // reference + per-dialogue field override
]
```

A reference is either a **string** `zh`, or an **object** `{ zh, py?, uz?, ru?, en? }` where
`py` disambiguates homographs and any `uz`/`ru`/`en` **field-level merge** over the entry (only
provided languages are replaced; the rest inherit from the glossary). Overrides stay in the
JSON (content-ish, rare).

### Resolution (server-side)

For each reference, at render on the server:
1. Bare `zh` → entries with that `zh`: exactly one → use it; zero → **error** (dangling);
   2+ → **error** ("ambiguous; specify py").
2. `{ zh, py }` → the unique `(zh, py_norm)` entry (error if none).
3. Reference `uz`/`ru`/`en` merge over the resolved entry.

Output: `{ zh, py, uz, ru, en }[]` — **the exact shape `DialogueVocab` already consumes**, so
the Words-tab component, flip-cards, and direction toggle are unchanged. The existing
auto-extract fallback (from per-sentence `words[]`) stays as the safety net for dialogues with
no curated list, and also covers a dialogue whose referenced word is briefly missing from the
table.

### Freshness (admin edits going live)

Dialogue pages resolve the glossary server-side. To make admin edits appear without a deploy:
- Glossary reads are cached server-side under a **`glossary` cache tag**.
- On any admin write (add/edit/delete), the admin API calls `revalidateTag('glossary')`, so the
  next render re-reads the table → edits appear within seconds.
- A time-based revalidate is the fallback if tag revalidation is unavailable.

### Components / files

| Unit | Responsibility | Depends on |
|------|----------------|-----------|
| `glossary` Supabase table | source of truth for translations | — |
| `src/services/glossary.ts` | server-side cached `getGlossary()` (Map index, `glossary` tag) + `resolveVocab(refs)` → `VocabItem[]` | Supabase admin client |
| `src/app/[locale]/chinese/hsk*/dialogues/[dialogueId]/page.tsx` (modify, all levels) | resolve the dialogue's `vocab` refs server-side; pass resolved `VocabItem[]` into `DialogueReader` | glossary.ts |
| `src/components/DialogueReader.tsx` (light modify) | accept resolved `VocabItem[]`; keep the auto-extract fallback | — |
| `src/components/DialogueVocab.tsx` | **unchanged** | — |
| `src/app/api/admin/glossary/route.ts` | GET (list/search), POST (upsert), DELETE; admin-password auth; computes `py_norm`; `revalidateTag('glossary')` after writes | Supabase admin client |
| `src/components/AdminPanel.tsx` (modify) | new **Glossary** tab: search, paginated table, add/edit form (zh, py, uz, ru, en, hsk), delete | admin glossary API |
| `scripts/migrate-vocab-to-glossary.py` | one-time: dedupe 218 inline entries → seed table + rewrite dialogues to reference lists + conflict report | current dialogue JSONs |
| `scripts/validate-glossary.py` | referential integrity: every reference resolves; referenced `zh` appears in the dialogue | dialogues + table export |

> **Admin client note:** glossary CRUD uses plain `.from('glossary')` calls on the shared
> service-role client. This is safe — the documented hazard is *session-mutating auth* calls
> (`verifyOtp`/`setSession`) on the singleton, which this does not use.

### Admin "Glossary" tab (Stage 4)

A new tab in `AdminPanel.tsx`, matching the Users/Payments tabs:
- **Search** by `zh`, pinyin, or any translation.
- **Table** (paginated): zh · pinyin · UZ · RU · EN · HSK · edit/delete.
- **Add word** form and inline **edit** (all of zh, py, uz, ru, en, hsk).
- **Delete** with confirm. Delete is blocked (or warned) if a dialogue still references the word.
- Duplicate `(zh, py_norm)` rejected by the DB constraint, surfaced as a friendly error.

### Validation — `scripts/validate-glossary.py`

- all dialogue JSONs parse (catches Chinese curly-quote `"` JSON breakage).
- every dialogue `vocab` reference resolves to exactly one table row; no dangling/ambiguous refs.
- reference overrides are well-formed.
- **content warning:** referenced `zh` actually appears in that dialogue's sentences.
- (table-side completeness + `(zh, py_norm)` uniqueness are enforced by the schema itself.)

### Migration — `scripts/migrate-vocab-to-glossary.py` (run once)

1. Read all 31 dialogues' current `{zh,py,uz,ru,en}` entries (218 total).
2. Group by `(zh, py_norm)`.
3. Identical across occurrences → one row; derive `hsk` from the source dialogue's level.
4. **Conflicts** (the 11 diverging words) → write `glossary-conflicts.json` and **stop** for
   human resolution (no auto-guessing meaning).
5. Seed the `glossary` table (idempotent upsert on `(zh, py_norm)`).
6. Rewrite each dialogue's `vocab[]` to references (bare `zh` where unambiguous, `{zh,py}` where
   homograph), **preserving appearance order**.

## Scope boundaries (explicit)

- Simplified only; one gloss per `(zh, py)` in v1 (override for context); no example sentences;
  **no visible change** to the Words tab for existing dialogues.

## Phased implementation (each phase independently shippable)

1. **Table + server loader + types + validation script.** Create the `glossary` table and the
   cached server resolver. Dialogues still use their inline vocab (table not yet wired in), so
   zero behavior change.
2. **Migration.** Seed the table + conflict report (human resolves the 11); rewrite dialogue
   JSONs to reference lists.
3. **Cut over reads.** Dialogue pages resolve vocab from the table server-side; verify the Words
   tab renders identically on preview for all levels/languages/both flip directions; deploy.
   Auto-extract fallback retained.
4. **Admin Glossary tab.** CRUD UI + admin API + `revalidateTag('glossary')` on save. (This is
   the editor you asked for.)
5. **Optional follow-ons.** Backfill HSK 4/6 vocab as references; then unlocked features:
   cross-dialogue flashcard decks, vocab search, dictionary view.

## Risks & rollback

- Each phase is a separate commit. Phases 1–2 don't change behavior. Phase 3 is the only
  visible change and is fully verifiable (Words-tab output compared before/after); the
  auto-extract fallback limits blast radius.
- Migration conflicts are surfaced, not silently resolved — no meaning is invented.
- Admin writes are service-role + admin-password gated, like existing admin actions.

## Success criteria

- One glossary row per `(zh, py)`; zero duplicated vocab across dialogue files.
- The 11 current conflicts resolved to a single canonical gloss each.
- Admin can search, add, edit (all three languages), and delete words; edits appear on the site
  without a code deploy.
- Words tab (all dialogues, all three languages, both flip directions) renders identically to
  pre-migration.
