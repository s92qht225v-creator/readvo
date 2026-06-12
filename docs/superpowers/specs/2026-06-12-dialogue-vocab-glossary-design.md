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
- No validation (completeness, JSON-breaking Chinese curly quotes, referential integrity).
- The data is trapped per-file: no cross-dialogue flashcard decks, dictionary, or search.
- Adding a 4th UI language later means editing every entry in every file.

## Goal

A single vetted glossary as the source of truth for dialogue vocabulary, with dialogues
referencing it (and able to override per-context), plus validation and a one-time
migration — **without changing the Words-tab UI or any visible behavior.**

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

**Decision (non-negotiable, not a judgment call):** the glossary key is `(zh, pinyin)`.
A key on `zh` alone would silently merge these.

Sources:
- CC-CEDICT format & syntax: <http://cc-cedict.org/wiki/format:syntax>, <https://en.wikipedia.org/wiki/CEDICT>
- Lexicographic sense enumeration / Chinese WSD framing: <https://arxiv.org/pdf/2405.07006>

## Locked decisions (from design review)

1. **Reference style:** dialogues list bare `zh` strings; pinyin is added only when a word
   has 2+ readings (homograph). Resolver + validator enforce correctness.
2. **Polysemy depth (v1):** one gloss per `(zh, py)`; a dialogue overrides the meaning
   inline when it needs a different sense at the same reading. No `senses[]` array in v1.
3. **HSK metadata:** include an `hsk` field on each entry now (filled during migration).
4. **Process:** formalize via spec (this doc) → writing-plans → implementation.

## Design

### Data store — `content/dialogues/glossary.json`

A flat **array** of entries (git-diff-friendly, sortable). Each entry is one `(zh, py)` lexeme:

```json
[
  { "zh": "加班", "py": "jiābān", "uz": "qo'shimcha ishlamoq",
    "ru": "работать сверхурочно", "en": "to work overtime", "hsk": 2 },
  { "zh": "还", "py": "hái",  "uz": "hali, yana", "ru": "ещё, всё ещё", "en": "still, yet", "hsk": 1 },
  { "zh": "还", "py": "huán", "uz": "qaytarmoq",  "ru": "возвращать",   "en": "to return", "hsk": 3 }
]
```

- **Required:** `zh`, `py`, `uz`, `ru`, `en`. **Optional:** `hsk` (integer 1–6).
- **No `ex_*` fields** — consistent with the prior dead-field cleanup. (If example sentences
  are ever rendered, they attach to the dialogue *reference* or a separate store, not here.)
- **Uniqueness invariant:** `(zh, normPy)` is unique, where
  `normPy = py.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()`.
  Tone marks survive NFC, so cháng ≠ zhǎng stay distinct; whitespace/case noise is collapsed.
- **Simplified only.** Unlike CEDICT, Blim content is 100% simplified; no `trad` field.

### Reference model — dialogue `vocab[]`

A dialogue's `vocab` becomes an ordered list of references (appearance order preserved):

```json
"vocab": [
  "心事",                          // bare string — must resolve to exactly one entry
  { "zh": "还", "py": "hái" },      // homograph — pinyin disambiguates
  { "zh": "打", "py": "dǎ", "uz": "o'ynamoq" }  // reference + per-dialogue field override
]
```

A reference is one of:
- **string** `zh`
- **object** `{ zh, py? , uz?, ru?, en? }` — `py` disambiguates homographs; `uz`/`ru`/`en`
  override the glossary value for *this dialogue only* (the polysemy mechanism).

### Resolution algorithm (build/SSR time)

For each reference:
1. Bare `zh` → find glossary entries with that `zh`.
   - exactly one → use it.
   - zero → **error** (dangling reference).
   - 2+ → **error** ("ambiguous; specify py").
2. `{ zh, py }` → resolve to the unique `(zh, normPy)` entry (error if none).
3. Any `uz`/`ru`/`en` on the reference **field-level merge** over the resolved entry: only the
   provided fields are replaced; unspecified languages keep the glossary value (e.g. a ref with
   just `uz` overrides Uzbek but inherits `ru`/`en`/`py` from the entry).

Output: `{ zh, py, uz, ru, en }[]` — **identical shape `DialogueVocab` already consumes**, so
the Words-tab component, flip-cards, and direction toggle are unchanged. The existing
auto-extract fallback (from per-sentence `words[]`) stays as the safety net for dialogues
with no curated list.

### Components / files

| Unit | Responsibility | Depends on |
|------|----------------|-----------|
| `content/dialogues/glossary.json` | the vetted source of truth | — |
| `src/services/glossary.ts` | load glossary, build `Map<zh, entry[]>` index, `resolveVocab(refs)` → `VocabItem[]` | glossary.json |
| `src/services/dialogues.ts` (modify) | resolve at the **service layer** (server/build time): call `resolveVocab(refs)` so the loaded dialogue exposes a resolved `VocabItem[]`; the client receives plain `VocabItem[]` exactly as today (glossary never shipped to the client) | glossary.ts |
| `src/components/DialogueReader.tsx` | **unchanged** — receives already-resolved `VocabItem[]` from the service; existing `vocabList` memo + fallback keep working | — |
| `scripts/validate-glossary.py` | pre-deploy invariants + referential integrity | glossary.json, dialogues |
| `scripts/migrate-vocab-to-glossary.py` | one-time: dedupe 218 inline entries → glossary + rewrite dialogues to refs | current dialogue JSONs |

`DialogueVocab.tsx` is **unchanged**.

### Validation — `scripts/validate-glossary.py`

- glossary.json and all dialogue JSONs parse (catches Chinese curly-quote `"` JSON breakage).
- every entry has non-empty `zh/py/uz/ru/en`; `hsk` ∈ 1–6 if present.
- `(zh, normPy)` unique across the glossary.
- pinyin is tone-**marked** (reject stray tone numbers) and within the allowed character set.
- every dialogue `vocab` reference resolves to exactly one entry; no dangling/ambiguous refs;
  overrides point at real entries.
- **content warning:** referenced `zh` actually appears in that dialogue's sentences.

### Migration — `scripts/migrate-vocab-to-glossary.py` (run once)

1. Read all 31 dialogues' current `{zh,py,uz,ru,en}` entries (218 total).
2. Group by `(zh, normPy)`.
3. Identical across occurrences → one canonical entry; derive `hsk` from the source dialogue's level.
4. **Conflicts** (the 11 diverging words) → write `glossary-conflicts.json` listing each variant
   and the files using it, then **stop** for human resolution (no auto-guessing meaning).
5. Emit `glossary.json` sorted by `hsk`, then pinyin.
6. Rewrite each dialogue's `vocab[]` to references (bare `zh` where unambiguous, `{zh,py}` where
   homograph), **preserving appearance order**.

### Scope boundaries (explicit)

- **Simplified only** — no traditional field.
- **One gloss per `(zh, py)` in v1**; per-dialogue override for context. Multi-sense `senses[]`
  is a possible v2 (standalone dictionary), not built now.
- **No example sentences** in the glossary unless/until examples are rendered.
- **No UI change** — Words tab renders byte-identical after migration.

## Phased implementation (each phase independently shippable)

1. **Schema + loader + types + validation script.** Glossary unused; zero behavior change.
2. **Migration.** Generate `glossary.json` + conflict report; human resolves the 11 conflicts.
3. **Cut over.** Rewrite dialogues to references; wire the resolver; verify Words tab renders
   identically on preview; deploy. Fallback retained.
4. **Optional follow-ons.** Backfill HSK 4/6 vocab as references; ensure `hsk` everywhere; then
   the unlocked features: cross-dialogue flashcard decks, vocab search, dictionary view.

## Risks & rollback

- Each phase is a separate commit. Only Phase 3 changes behavior and is fully verifiable
  (Words tab output compared before/after). The auto-extract fallback limits blast radius.
- Migration conflicts are surfaced, not silently resolved — no meaning is invented.

## Success criteria

- One glossary entry per `(zh, py)`; zero duplicated vocab across dialogue files.
- The 11 current conflicts resolved to a single canonical gloss each.
- Validation script passes in CI/pre-deploy.
- Words tab (all dialogues, all three languages, both flip directions) renders identically
  to pre-migration.
