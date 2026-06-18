# Arabic Learning Target — Design Spec

**Date:** 2026-06-18
**Status:** Approved (design); pending implementation plan
**Author:** brainstorming session (Blim)

## Summary

Add **Arabic as a second learning target** to Blim (today a Chinese/HSK-only app). Arabic is taught as its own track — its own script, content, audio, and lexicon — not as a 4th UI language. The work is built on a newly-extracted, **language-agnostic reader core** driven by a `ScriptConfig`, so the same reading engine serves both Chinese (pinyin-over-hanzi, LTR) and Arabic (harakat + transliteration, RTL). The live Chinese app is left untouched and becomes an optional later consumer of the core.

## Locked decisions

| Decision | Choice |
|---|---|
| What we teach | **Arabic as a learning target** (a new track), **Modern Standard Arabic (MSA)** |
| Pronunciation aid | **Harakat** (vowel marks, inline) **+ a transliteration toggle** — replaces pinyin ruby |
| Leveling | **CEFR A1–C2** (six pills, replaces HSK 1–6) |
| Text direction | **RTL** |
| Audio | **Arabic TTS, cached to Supabase** (`/api/tts-ar`, MiMo-style); recorded `audio_url` preferred when present |
| Architecture | **Option C** — extract a shared, `ScriptConfig`-driven reader core now; build Arabic on it; **Chinese untouched** (migrates later, or never) |
| v1 section types | **Dialogues + Stories + Flashcards** |
| Routes | **Real per-section routes** from day one (section-first, like the current Chinese catalog) |

## Out of scope (v1)

- Writing / Arabic letter-formation practice (HanziCanvas does not transfer — Arabic is cursive/joining).
- Karaoke, Grammar, Tests sections.
- Speaking / STT (no Arabic grader in v1).
- Migrating the Chinese app onto the shared core (optional later payoff).
- Auto-generated transliteration (it is authored, stored per sentence/word).
- A `[course]` dynamic route param / full `/chinese/` refactor (that was Option B, rejected).

## URL structure

A parallel `/arabic/` route tree, mirroring the section-first Chinese scheme. `locale` (uz/ru/en) is the UI language; Arabic is the *learned* language — a separate axis. `"arabic"` is a literal route folder (no `[course]` param).

```
/{locale}/arabic                              → 301/redirect → /{locale}/arabic/dialogues
/{locale}/arabic/dialogues                    → catalog (CEFR pills), PUBLIC
/{locale}/arabic/dialogues/[level]/[slug]     → dialogue reader, GATED
/{locale}/arabic/stories                      → catalog, PUBLIC
/{locale}/arabic/stories/[level]/[slug]       → story reader, GATED
/{locale}/arabic/flashcards                   → catalog, PUBLIC
/{locale}/arabic/flashcards/[level]/[deckId]  → flashcard deck, GATED
```

`[level]` ∈ `a1 a2 b1 b2 c1 c2`. All routes render `●` SSG/ISR (`revalidate = 3600`), same constraints as Chinese (never read `searchParams`/`getLocale()` in page or `generateMetadata`).

## The shared reader core (Option C)

Extract today's reading surface (currently `StoryReader` / `DialogueReader` / `FlashcardDeck`) into a language-agnostic core parameterized by a `ScriptConfig`. The core owns everything language-neutral; only the token renderer and direction differ.

```ts
interface ScriptConfig {
  dir: 'ltr' | 'rtl';
  renderToken: (token: Token) => ReactNode;   // the ONE swappable part
  stripAid?: (text: string) => string;        // "hide pronunciation aid" behavior
  hasSecondaryAid: boolean;                    // transliteration line present?
  fontClass: string;
}
```

- **Chinese config:** `dir: 'ltr'`, `renderToken` → `<ruby>字<rt>pinyin</rt></ruby>`, `stripAid` hides `<rt>`, `hasSecondaryAid: false`, Noto Sans.
- **Arabic config:** `dir: 'rtl'`, `renderToken` → Arabic text (harakat inline), `stripAid` removes the tashkeel range `[ً-ْٰ]`, `hasSecondaryAid: true` (transliteration), Noto Naskh Arabic.

**Core owns (language-neutral):** sentence list (story flow + A/B dialogue layout), tap-to-play audio (recorded `audio_url` else TTS resolver), translation panel, focus mode, bottom-bar toggles (aid on/off, translation on/off, focus), the Words flip-cards, flashcard front/back faces, paywall/trial gating, progress, stars, analytics, correction reporting.

**Seam rationale:** the only genuinely language-specific parts of the reader are *text direction* and *how a single token renders its pronunciation aid*. That narrow, well-understood seam is why Option C's "extract with one new language in hand" bet is safe here.

**v1 consumption:** the Arabic reader runs on the core. The Chinese reader stays on its existing code path (untouched). Chinese becomes a second consumer only if/when migrated.

## Arabic rendering

**RTL.**
- Arabic reader core renders inside a `dir="rtl"` container; the browser handles base mirroring (text flow, alignment, A/B speaker columns to the right).
- Shared chrome that is currently LTR with physical margins/paddings is converted to **CSS logical properties** (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`) scoped to the Arabic subtree, so one component works both directions. New Arabic-only CSS lives in its own file; `reading.css` Chinese rules are not modified.
- **Mixed-direction safety:** embedded Latin/digits/transliteration inside RTL Arabic wrapped in `bdi` / `dir="auto"` to prevent reordering.

**Harakat (pinyin replacement).** Content is authored **fully vowelized**. The "show pronunciation aid" toggle renders as-is (on) vs. strips the tashkeel range (off) via `stripAid`. Mirrors the Chinese pinyin toggle UX.

**Transliteration (secondary aid).** A toggleable Latin-spelling line shown per sentence/word, stored as a content field (`translit`), not auto-generated.

**Font.** `Noto Naskh Arabic` added via `next/font/google`, applied through `ScriptConfig.fontClass`. Chinese keeps Noto Sans.

## Data model

**Content files** (mirror Chinese JSON shape; Arabic fields):
```
content/arabic/dialogues/{a1..c2}/{slug}.json
content/arabic/stories/{a1..c2}/{slug}.json
content/arabic/flashcards/{a1..c2}.json
```
Each sentence: `{ ar (vowelized), translit, text_translation_uz, text_translation_ru, text_translation_en, audio_url?, speaker? }`. Same sentence + vocab-reference structure as Chinese so the core consumes both.

**Lexicon** — new Supabase table, separate from the Chinese `glossary`:
```
arabic_lexicon:
  id, ar (vowelized), translit, root?, uz, ru, en, level (a1..c2), created_at, updated_at
```
Same resolve-by-reference pattern as the Chinese glossary: content references lexicon entries; resolved server-side; cached under an `arabic-lexicon` revalidation tag; edited via an admin tab. RLS service-role-only (never queried from the browser). Distinctive field: `root` (triliteral root) instead of pinyin.

**Audio.** New `/api/tts-ar` route → Arabic TTS provider (chosen at implementation time; quality on harakat varies — evaluate ElevenLabs/Azure/Google) → cached once to Supabase `audio/ar/{hash}.mp3` (hex of UTF-8 text), MiMo pattern. Core playback prefers recorded `audio_url`, else the TTS resolver — recorded audio can be layered in later for free.

## Catalog & navigation

**Landing / "I'm learning" selector.** Today the landing `languageList` and the BannerMenu "Men o'rganaman" hardcode one entry (中文 → `/chinese`). Generalize to a 2-entry list: 中文 → `/chinese/dialogues`, العربية → `/arabic/dialogues`. This is where "Chinese is one course among several" first appears in the UI (minimal change, no Chinese refactor).

**Catalog.** Reuse the existing `CatalogHeader` + catalog component pattern, parameterized: tabs (Dialogues / Stories / Flashcards), **CEFR pills (A1–C2)** instead of HSK, RTL-aware, Arabic hero glyph instead of 中. Catalog pages PUBLIC; readers/decks GATED.

## Auth, gating, SEO

**Auth gate (`src/proxy.ts`).** Extend `PROTECTED_PATTERN` to gate Arabic paid paths while keeping catalogs public:
`arabic/(dialogues\/.|stories\/.|flashcards\/.)` — the trailing `\/.` requires a child segment, so bare `/arabic/dialogues` (catalog) stays public, readers gate. Add `/arabic` → `/arabic/dialogues` redirect (mirrors `/chinese`).

**Reused as-is (no new work):** auth, trial, payment, paywall, stars/progress, analytics, correction reporting.

**SEO.** Each Arabic catalog route gets its own `generateMetadata` (trilingual titles + hreflang) and JSON-LD (BreadcrumbList; Course on catalogs; LearningResource on readers). Sitemap adds the three Arabic catalog URLs; gated content stays out of the sitemap (same policy as Chinese). All routes `●` SSG/ISR.

## Implementation phasing

One spec, built in dependency order:

1. **Core extraction** — pull today's reading surface into the `ScriptConfig`-driven core; validate with zero behavior change to the live Chinese app (Chinese config produces identical output, verified by build + spot checks; Chinese routes need not switch to the core in v1, but the Chinese `ScriptConfig` is authored and used to validate the seam).
2. **Arabic plumbing** — `Noto Naskh Arabic` font, RTL CSS scaffold (logical-property layer), `arabic_lexicon` table + admin tab + resolver, `/api/tts-ar`, `/arabic` routes + redirect + auth-gate extension.
3. **Arabic reader thin slice** — one fully-built A1 dialogue end-to-end on a phone (RTL + harakat toggle + transliteration + TTS). Surfaces ~80% of layout pain before scaling content.
4. **Catalog + remaining section types** — stories + flashcards catalogs/readers; CEFR pills; landing "I'm learning" selector.
5. **Content backfill** — author A1 dialogues/stories/flashcards + lexicon rows (LLM-assisted, incremental).

## Risks & mitigations

- **Abstraction-with-one-example (the C bet).** → The seam is deliberately narrow (direction + token aid renderer); author BOTH the Chinese and Arabic `ScriptConfig` during extraction so the core is validated against two concrete configs even though Chinese routes don't switch in v1.
- **RTL layout regressions.** → Logical properties scoped to the Arabic subtree; `reading.css` Chinese rules untouched; thin-slice phase (3) catches layout pain on one page before scaling.
- **TTS quality on harakat.** → Provider chosen after evaluation in phase 2; recorded `audio_url` can override per item.
- **Static-rendering regression.** → After each phase confirm Arabic routes build `●`/ISR (not `ƒ`); no `searchParams`/`getLocale()` in page/metadata.
- **Mixed-direction text bugs.** → `bdi`/`dir="auto"` wrappers for Latin/digits/transliteration in RTL.
- **Scope creep into a full platform refactor.** → Chinese stays untouched in v1; `[course]` param and Chinese migration explicitly deferred.

## Verification

- `npm run build` — Arabic routes `●`/ISR; no `ƒ` leak; Chinese build output unchanged.
- Thin-slice phone check — one A1 dialogue: RTL correct, harakat toggle strips/restores marks, transliteration toggle, TTS plays + caches.
- Production curl — Arabic catalog 200 (public); reader 307→login uncookied (gated); `/arabic` → redirect → `/arabic/dialogues`.
- Chinese regression — existing Chinese reader/flashcards behave identically (no visual/behavior change).
