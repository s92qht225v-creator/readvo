# HSK 3.0 Word Database — Design

**Goal:** Import the authoritative HSK 3.0 vocabulary list (~11,092 words, levels 1–9) as a reference spine, and use it to power three features: an **admin word-level analyzer**, **progressive pinyin** in dialogues, and a **public dictionary**.

**Status:** design approved 2026-07-16. Not yet implemented.

---

## Context & problem

Today `glossary` holds **2,572 words**, each hand-tagged `hsk` 1–6 as dialogue vocab was added. The distribution is:

| hsk | 1 | 2 | 3 | 4 | 5 | 6 | null |
|---|---|---|---|---|---|---|---|
| words | 202 | 248 | 637 | 258 | 709 | 506 | 12 |

These counts match **no official standard** (HSK 2.0 is 150/150/300/600/1300/2500). The `hsk` field is therefore **ad-hoc — whatever level was guessed when the word was added.** It is not a reliable basis for levelling, pinyin decisions, or a dictionary.

The target standard is **HSK 3.0** (《国际中文教育中文水平等级标准》, 2021), which has a different shape — **9 levels, ~11,092 words**:

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7–9 |
|---|---|---|---|---|---|---|---|
| new | 500 | 772 | 973 | 1,000 | 1,071 | 1,140 | 5,636 |
| cumulative | 500 | 1,272 | 2,245 | 3,245 | 4,316 | 5,456 | **11,092** |

Note **七–九级 is a single band** in the standard, not three separate levels.

## Decisions (locked)

1. **Import first, dictionary built on top.** The spine is (汉字, pinyin, level); glosses come via backfill (M4).
2. **Source:** a reputable open HSK 3.0 dataset, **gated on a hard count check** against the official spec. Mismatch ⇒ reject, do not import.
3. **Schema:** a **separate `hsk_words` table** (authoritative reference). `glossary` keeps its curated glosses and gains an `hsk30_level` column backfilled by join. Official level wins for badges. The old ad-hoc `hsk` column is kept until the diff is reviewed, then dropped.
4. **No automatic dialogue levelling.** The analyzer reports per-word levels as *information*; a human sets the dialogue's level. (Explicitly rejected: auto-verdict levelling.)
5. **Progressive pinyin:** hide pinyin for words **below** the dialogue's level; keep it for words at-or-above and for off-list words. The existing global pinyin toggle becomes a **"show all" override**.
6. **Dictionary is complete on day one** — backfill glosses for the ~8,500 unglossed HSK words before shipping it.
7. **Dictionary is public**, but word pages are sitemapped only once substantive (see M5).
8. **Backfilled glosses live in `hsk_words`**, not `glossary`. Precedence: **glossary (human) > hsk_words (machine)**.
9. **HSK 3.0 is the single standard, product-wide — including user-facing labels.** No dual-standard UI, no 2.0/3.0 toggle. Decided 2026-07-16. This resolves the ambiguity that exists today (the Writing tab currently ships HSK 2.0 *and* 3.0 sets side by side, so "HSK 2" already means two different things). See "Migration consequences" below.

> **Caveat recorded, not blocking:** levels are ultimately a promise about the exam the learner sits. The HSK 3.0 exam rollout was still in progress as of the last reliable information available here, and this is exactly the kind of fact that changes. If it later turns out the target audience predominantly sits HSK 2.0, this decision is the one to revisit — everything else in this spec survives, because the data spine is standard-agnostic.

## Migration consequences of decision 9

Adopting 3.0 for **user-facing** levels (not just internally) has two real costs that must be planned, not discovered:

1. **Writing tab carries HSK 2.0 content.** `WRITING_SETS_HSK2` … `WRITING_SETS_HSK6` are 2.0-level sets (HSK 6 alone has 25), reached via `?tab=writing&version=2.0&hsk={level}`, with `setId`s like `hsk2-*`. Under a single-standard product these must be **relabelled to 3.0 levels or retired**, and the `version` toggle removed. The characters themselves don't change — only their level grouping — but `setId`s appear in URLs, so renaming implies redirects.
2. **Dialogue levels will move, and dialogue URLs contain the level.** Re-confirming levels on the 3.0 scale (via M2) will reassign some dialogues; since URLs are `/chinese/dialogues/hsk{n}/{slug}`, any move changes the URL. Use the existing `MOVED_DIALOGUES` map in `src/proxy.ts` to 301 the old path. Expect movement to be common: 3.0's lower levels are far broader (L1 = 500 words vs 2.0's 150), so content will generally shift **down** a level.

Flashcard decks (`content/flashcards/hsk1.json`, 307 words — a count matching neither standard) should be reconciled against the imported list in the same pass.

## Data model

**Source dataset (verified 2026-07-16):** [`ivankra/hsk30`](https://github.com/ivankra/hsk30) — MIT, derived from the PRC Ministry of Education standard via proof-read OCR. **Count gate PASSED exactly**: 500/772/973/1000/1071/1140/5636 = 11,092, and it already labels the band as `7-9`.

> **One word ≠ one level.** The standard lists polysemous words once *per sense*, at different levels: 打 is **L1** (V, dǎ), **L4** (M, **dá** — different tone), **L5** (Prep, dǎ); 白 is L1 (Adj) and L3 (Adv). There are **112** such `(zh, py_norm)` groups, **79 of which span different levels**. Therefore:
> - **No unique constraint on `(zh, py_norm)`** — it would reject 112 rows. The natural key is the dataset's own `hsk_id` (`L1-0056`).
> - **Pinyin + analyzer use the *lowest* level a word form appears at** ("first introduced at"). If 打 is introduced at L1, an L2 learner knows the form and must not get pinyin. Exposed via the `hsk_word_levels` view.
> - **The dictionary shows all senses** — that polysemy is a feature there, not noise.

```sql
create table public.hsk_words (
  id          bigint generated always as identity primary key,
  hsk_id      text not null unique,          -- dataset ID, e.g. L1-0056 (natural key)
  zh          text not null,
  traditional text,
  pinyin      text not null,                 -- tone-marked, e.g. kōngtiáo
  -- toneless + lowercase + despaced + ellipsis-stripped, e.g. kōngtiáo -> kongtiao, …jí le -> jile
  py_norm     text generated always as (
                replace(replace(replace(lower(translate(pinyin,
                  'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ',
                  'aaaaeeeeiiiioooouuuuuuuuuaaaaeeeeiiiioooouuuuuuuuu')),
                ' ', ''), '''', ''), '…', '')
              ) stored,
  pos         text,                          -- part of speech: V, N, Adj, M, Prep… (aids M4 disambiguation)
  level       smallint not null check (level between 1 and 7), -- 7 == the 七–九级 band
  uz          text,                          -- machine-generated (M4)
  ru          text,
  en          text,
  source      text not null default 'ivankra/hsk30',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.hsk_words enable row level security;  -- service-role only, read server-side
create index on public.hsk_words (py_norm);
create index on public.hsk_words (level);
create index on public.hsk_words (zh);

-- "first introduced at" level per word form — the ONLY level source for M2/M3.
create view public.hsk_word_levels as
  select zh, py_norm, min(level) as level
  from public.hsk_words
  group by zh, py_norm;
```

- `level = 7` means **"7–9"**; UI renders the label `7–9`, never `7`.
- The `py_norm` expression is validated against all 11,092 rows: 0 rows retain non-ASCII after normalisation.
- `glossary` gains `hsk30_level smallint` (nullable). **NULL = not in HSK 3.0** (proper nouns / modern terms: 微信, 定位, 上海, 大盘鸡).
- `py_norm` mirrors the existing generated-column pattern already used by `glossary`.
- Per project convention, RLS is enabled with **no policies** (service-role only, reached through `/api/*`), never queried from the browser.
- Schema is applied **manually in the Supabase dashboard SQL editor** — `supabase db push` is blocked by migration drift. Write the migration file for the record, then verify via PostgREST.

## M0 — Import + verification

1. Fetch an open HSK 3.0 word list.
2. **Verification gate (hard):** group by level and assert counts equal `{1:500, 2:772, 3:973, 4:1000, 5:1071, 6:1140, 7:5636}`, total **11,092**. On any mismatch: **abort, report the delta, import nothing.** This is the primary correctness control — the list is public factual data, so an exact structural match is strong evidence of fidelity.
3. Normalise pinyin to tone marks; derive `py_norm`.
4. Insert with `source` recording dataset provenance.
5. Cross-check against existing assets as a sanity signal (not a gate): the 307-word HSK1 flashcard deck and the 202 writing-set characters should fall overwhelmingly in levels 1–2.

## M1 — Glossary reconciliation

1. Add `glossary.hsk30_level`.
2. Backfill: join `glossary` → `hsk_words` on `(zh, py_norm)`.
3. Unmatched glossary rows ⇒ `hsk30_level = NULL` (off-list) — expected for proper nouns and modern vocabulary.
4. **Produce a diff report**: every row where the old ad-hoc `hsk` ≠ new `hsk30_level`. Expect substantial disagreement. This report is reviewed by a human before the old column is dropped.
5. Widen admin glossary validation from `1..6` to the new scheme (1..7 with 7 = 7–9, plus null).
6. Only after review: drop `glossary.hsk`.

## M2 — Admin analyzer

New admin tab ("HSK Analyzer"). **Reports, never decides.**

- **Input A — existing dialogue** (preferred, exact): select by slug; use the dialogue JSON's `words[]`, which already carries exact character ranges — no segmentation needed.
- **Input B — pasted text** (approximate): longest-match segmentation against `hsk_words`. Results **must be labelled approximate**, since Chinese segmentation without a proper tokenizer is lossy.
- **Output:** per-word rows — word · pinyin · HSK 3.0 level · in-glossary? · gloss — plus a summary: word count per level, off-list words listed explicitly, and cumulative coverage at each level.
- The human reads this and sets the dialogue's level. No suggested verdict is displayed.

## M3 — Progressive pinyin

> **Hard dependency — scale mismatch.** The rule compares a word's **HSK 3.0** level against `dialogue.level`. But today's `dialogue.level` values (1–6, driving the HSK tabs) were assigned under the **old ad-hoc scheme**, not 3.0. Comparing them directly would be apples-to-oranges. **M3 must not ship until each dialogue's level has been re-confirmed on the 3.0 scale using the M2 analyzer.** M2 is therefore a blocking prerequisite for M3, not merely an earlier step.

- For each rendered word, resolve its authoritative level (`hsk_words` via `(zh, py_norm)`).
- Rule: `level < dialogue.level` → **render bare**. `level >= dialogue.level` **or** off-list (NULL) → **keep pinyin**.
- The global pinyin toggle = **override → show all pinyin**.
- The per-word `h` field already present in dialogue `words[]` is ad-hoc and is **not** used for this; the authoritative level is.
- Levels resolve **server-side** on the dialogue page (which already resolves vocab server-side) and are passed to the reader, preserving static rendering.
- **This visibly changes every dialogue.** Verify on a handful of dialogues across levels before rollout.

## M4 — Gloss backfill

- Target: every `hsk_words` row with no matching `glossary` entry. **Exact count is unknown until M1 runs** — it is *not* simply 11,092 − 2,572, because an unknown share of the 2,572 glossary words are off-list (proper nouns, modern terms) and match nothing. Expect **&gt; 8,520**; M1's join produces the real number.
- LLM-generate `uz` / `ru` / `en` (~25k translations). **Uzbek in Latin script only** (standing project rule); Russian in Cyrillic.
- Write to `hsk_words.uz/ru/en`. **Never** into `glossary`.
- Quality: sampled human review per level band; ambiguous/polysemous words flagged for review rather than silently shipped.
- This is a real token cost and a multi-pass job — it is the gate for M5.

## M5 — Dictionary (public)

- **Search matches:** 汉字 (exact + prefix), `py_norm` (toneless — "kongtiao"), or native text (uz/ru/en, ILIKE).
- **Result:** 汉字 · pinyin · level badge (`7–9` rendered correctly) · meaning in the current UI language.
- **Precedence:** if a `glossary` row exists for `(zh, py_norm)`, its gloss **wins** over the machine gloss in `hsk_words`.
- **Public** (not login-gated) — it is top-of-funnel, consistent with blog/catalogs.
- **SEO guardrail:** the search page is indexable immediately. **Word pages are added to the sitemap only once substantive** (gloss + level + at least one real example sentence sourced from an existing dialogue). Rationale: GSC already shows **632 crawled-not-indexed**; bulk-publishing 11k thin pages would feed that problem rather than fix it. Phase word pages in, measure, expand.

## Rollout order

1. M0 — import + count verification
2. M1 — glossary backfill + diff report (human review)
3. M2 — admin analyzer
4. M3 — progressive pinyin (verify on sample dialogues first)
5. M4 — gloss backfill + sampled review
6. M5 — dictionary (search page → phased word pages)

Each step is independently shippable; 1–3 deliver value with zero translation work.

## Risks & open questions

- **Dataset fidelity** — mitigated by the hard count gate, but the gate proves structure, not per-word correctness. Spot-check known words per level.
- **Machine gloss quality** (~25k translations) — needs sampled QA; polysemy is the main failure mode (a word's HSK sense vs. its common sense).
- **Segmentation** for pasted text is approximate; existing-dialogue input avoids this entirely and should be the default path.
- **Progressive pinyin is user-visible** on every dialogue — needs sample verification, and possibly a per-dialogue escape hatch if a specific dialogue reads badly.
- **7–9 band** must never render as "7".
- **Thin-content SEO risk** on word pages — explicitly managed by the phased sitemap rule in M5.

## Non-goals

- Automatic dialogue levelling (explicitly rejected — human decides).
- Rewriting the curated `glossary` glosses.
- HSK 2.0 support. Target standard is 3.0.
- Character-level (汉字) grading — this is a **word** list.
