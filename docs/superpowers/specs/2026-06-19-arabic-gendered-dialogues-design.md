# Arabic Gendered Dialogues — Design Spec

**Date:** 2026-06-19
**Status:** Approved (design); pending user review → implementation plan

## Summary

Arabic is grammatically gendered: verbs, adjectives, pronouns, and 2nd-person "you" inflect for the speaker's and addressee's gender (e.g. *kayfa ḥāluka* to a man vs *kayfa ḥāluki* to a woman). A single dialogue should therefore exist in a **male version and a female version**, and the audio should use a **male voice for male speakers, a female voice for female speakers**. This spec adds an opt-in gender toggle to the Arabic dialogue reader: one button flips the whole dialogue's wording **and** voices between man↔man and woman↔woman.

## Locked decisions

| Decision | Choice |
|---|---|
| Gender pairings | **MM (two men) ↔ WW (two women)** only. Mixed (man↔woman) **deferred** — it mixes both addressee forms in one conversation and is more complex. |
| Control | A **round 👨/👩 flip button stacked above the play-all FAB** in the dialogue reader. Tap flips wording + voice. |
| Opt-in | Only dialogues authored with both gender wordings show the button. Existing single-gender dialogues show **no** toggle (backward compatible). |
| Voices | **OpenAI TTS** (already in use). Male → `onyx` (speaker A) / `echo` (speaker B); Female → `nova` (A) / `shimmer` (B). Two voices per gender so A and B are distinguishable. |
| Translations | The uz/ru/en translations are **shared** across genders (they don't change). Only the Arabic text + transliteration have male/female variants. |
| Audio source | TTS only for gendered dialogues v1 (no recorded `audio_url`). |

## Why this placement (round button above the play FAB)

The dialogue reader's controls split into two kinds:
- **Bottom bar** (Harakat / Translit / Tarjima) = show/hide *helpers*.
- **Floating FABs** (play-all) = actions that affect *content/audio*.

Gender belongs with the second kind (it rewrites the lines and switches the voice), so it sits as a second round button above the play FAB — prominent (solid, not faded), grouped with play, and kept off the crowded bottom bar. Cap the floating stack at these two buttons.

```
                    ( 👨 )   ← gender (tap → 👩), flips wording + voice
                    ( ▶ )    ← play all
──────────────────────────────────
 Harakat │ Translit │ Tarjima      ← bottom bar (aids, unchanged)
```

## Content model

A dialogue sentence becomes "gendered" by carrying male + female Arabic. The reader treats a dialogue as gendered iff its sentences have `ar_m`/`ar_f`.

```ts
interface ArabicSentence {
  id: string;
  speaker?: 'A' | 'B';
  // Gendered wording (present → dialogue is gendered, toggle shown):
  ar_m?: string;        // male-version Arabic (vowelized)
  translit_m?: string;
  ar_f?: string;        // female-version Arabic (vowelized)
  translit_f?: string;
  // Legacy single-gender (present when not gendered):
  ar?: string;
  translit?: string;
  // Shared:
  text_translation_uz: string;
  text_translation_ru: string;
  text_translation_en: string;
}
```

Resolution at render time, given `genderMode: 'm' | 'f'`:
- `text  = mode === 'm' ? (ar_m ?? ar) : (ar_f ?? ar)`
- `translit = mode === 'm' ? (translit_m ?? translit) : (translit_f ?? translit)`
- A dialogue with no `ar_m`/`ar_f` on any sentence → not gendered → no toggle, behaves exactly as today.

**Authoring rule:** each speaker keeps a *consistent* gender within a version, and verbs/adjectives/"you" forms must agree (the author writes both correct versions). MM = both male wording; WW = both female wording.

## Voice mapping

Voice is a function of `(genderMode, speaker)`:

| Mode | Speaker A | Speaker B |
|---|---|---|
| `m` (MM) | `onyx` | `echo` |
| `f` (WW) | `nova` | `shimmer` |

## TTS changes

`/api/tts-ar` and the client resolver gain a **voice** parameter, and the Supabase cache key includes the voice (so the same text in two voices caches separately):

- Route: `POST /api/tts-ar { text, voice }` → OpenAI `tts-1` with that `voice` → cache to `audio/ar/{voice}/{hex(text)}.mp3`.
- Resolver: `resolveTtsUrlAr(text, voice)` (voice defaults to `alloy` for callers that don't pass one, preserving current behaviour).

## Reader wiring

The gender state + variant selection live in `ArabicDialogueReader`; `ReaderCore` stays mostly generic:

1. `ArabicDialogueReader` holds `genderMode` state (default `'m'`), shown only when the loaded dialogue is gendered.
2. It maps each API sentence → `ReaderSentence` for the current mode: `text`/`translit`/`audioText` from the mode's wording, plus a per-sentence `voice` from `(mode, speaker)`.
3. `resolveAudio = (s) => resolveTtsUrlAr(s.audioText, s.voice)`.
4. `ReaderCore` gains an optional `fabExtra?: React.ReactNode` slot rendered **above** the play FAB. `ArabicDialogueReader` passes the 👨/👩 button (only when gendered); tapping it flips `genderMode`, which re-maps the sentences → `ReaderCore` re-renders text and the next play/tap uses the new voice.
5. `ReaderSentence` gains an optional `voice?: string`.

Flipping mid-playback: toggling gender stops current audio (the existing `stop`/`stopSeq` paths) and re-renders; the user re-taps/▶ to hear the other gender.

## Sample content

Migrate `content/arabic/dialogues/a1/greetings.json` to gendered form (MM/WW) as the first example: speaker A male/female, speaker B male/female, with correct *ḥāluka/ḥāluki* etc. New gendered A1 dialogues authored in this shape.

## Out of scope

- **Mixed (man↔woman)** dialogues — deferred (needs both addressee forms within one conversation; a 3rd/4th variant).
- Gendered **flashcards** — words are dictionary entries (fixed gender); no per-word toggle. (Sentences in dialogues are where the inflection shows.)
- Recorded human audio for gendered lines (TTS only v1; the reader already prefers a recorded `audio_url` if one is ever added).
- Non-Arabic readers (Chinese is ungendered; `ReaderCore.fabExtra` is simply unused there).

## Risks & mitigations

- **Content authoring burden** (two correct Arabic versions per line) → opt-in per dialogue; start with one migrated sample; LLM-assisted authoring with native-form review.
- **TTS cache collisions** across voices → voice folded into the cache path/key.
- **Voice naturalness** (OpenAI general voices) → acceptable for v1; swappable per the existing `/api/tts-ar` isolation (Azure native Arabic voices later if desired).
- **Backward compatibility** → gendered fields optional; non-gendered dialogues render unchanged with no toggle.

## Verification

- A gendered dialogue shows the 👨/👩 button above ▶; a non-gendered one does not.
- Tapping the button swaps every line's Arabic (e.g. *ḥāluka*↔*ḥāluki*) and the transliteration.
- Play-all / tap uses a male voice in 👨 mode and a female voice in 👩 mode; speakers A and B sound distinct.
- `npm run build` keeps the reader route `●` SSG; Chinese reader unaffected.
