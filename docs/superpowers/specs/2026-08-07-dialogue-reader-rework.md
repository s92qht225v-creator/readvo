# Dialogue reader rework — 2026-08-07

40 commits, all in `DialogueReader.tsx` + `reading.css` unless noted. Everything
below is live. The reader is shared by the Chinese dialogues and the HSK course
texts, so every change applies to both.

Numbers in this document were measured in a browser against production, not
estimated. Where a value looks arbitrary, the measurement that produced it is
recorded — that is the point of writing it down.

---

## 1. Translation is per sentence, not per JSON entry

**Problem.** Roughly half of all dialogue entries hold more than one sentence
(1327 of 3003; 5% at HSK 1 rising to 74% at HSK 6). Tapping one of them put the
entry's whole translation on screen — three lines to explain five characters.

**Solution.** `src/utils/splitSentences.ts` (new) splits an entry into its
sentences and pairs each with its own slice of the translation.

The JSON stores **one translation string per entry**, so this means splitting
that string and trusting the pairing. It is only trusted when both sides yield
the same sentence count:

| | aligned |
|---|---|
| uz | 99.9% |
| ru | 99.7% |
| en | 99.0% |

The rest return a single segment — i.e. the whole-entry translation, which is
exactly the old behaviour. **A miscount degrades to the status quo, never to a
confidently wrong pairing.**

Two rules were needed to reach that rate, both found by measuring:

- **`……` is not a sentence terminator.** Translators use it mid-sentence for the
  same trailing-off Chinese writes as `……`; treating it as an ending was the
  single largest source of miscounts.
- **`？` inside 「quotes」 doesn't end a sentence** — otherwise a quoted question
  counts as two.

**Character → sentence attribution** uses each pair's **last** code point.
Pinyin alignment sometimes emits one tappable token spanning a break (`"。AI"`),
and its visible letters belong to the sentence that starts, not the one that
ended. Verified over the corpus: all 1325 multi-sentence entries reconstruct
exactly, segment order never runs backwards, **0 visible characters land in the
wrong sentence**.

`WHOLE_ENTRY = -1` marks "no single sentence selected" — what a multi-sentence
entry falls back to when its translation doesn't split evenly.

## 2. Audio follows sentences too

**Play-all walked JSON entries**, so a multi-sentence entry played one clip
covering all of them and the bar froze on the first sentence for its duration.

This was originally misdiagnosed twice. What actually made HSK `text-1` look
correct is that **that one text happens to be authored one sentence per entry**
(all 7). Texts 2–4 of the same lesson are not (2/6, 4/6, 1/7 multi-sentence) and
were broken identically. It was never "HSK vs dialogues".

The fix is cheap because **nothing here has recorded audio** — `grep` confirms
`audio_url` appears only in karaoke content; every dialogue and HSK clip is TTS
resolved from text. Asking for the sentence instead of the paragraph yields a
clip for the sentence.

`units` (a memo) is the playback list. Play-all, taps and the TTS prefetch all
walk it. **Single-sentence entries keep the entry id as their key**, so they
reuse exactly the clips they always did and generate no new audio; only
multi-sentence entries produce new per-sentence clips, lazily on first play.

Focus mode still plays the whole entry — it shows the entry as one card.

## 3. The hero is gone from the reader

The hero cost ~150px of every screen repeating the title you just tapped. Once
content loads it is hidden (`.dr-hero--hidden`) and the **translation bar** is
the reader's only top chrome.

**The hero stays on the teaser.** That page is public — an uncookied GET returns
200, not a redirect; `PROTECTED_PATTERN` in `src/proxy.ts` does not cover
`/chinese/dialogues/` — and its `<h1>` lives in the hero.

### The bar (`.dr-trbar`)

- **Only exists while Tarjima is on.** With translations off it has nothing to
  say, and 120px repeating the title is worse than the hero it replaced.
- **120px, fixed in every state.** Sized from measurement: at phone width the
  longest translation in the corpus renders 88px of text and half are a single
  22px line. (It was briefly 175px — the hero's exact footprint — which left
  55px permanently empty.)
- **Full-bleed**, `100vw` + negative margin. This only works because the bar is
  a **sibling of `.dr-dialog-body`, not a child**: that column is centred
  `fit-content`, so a viewport-width measured from it lands off-centre (485 of
  500 on mobile, 439px off on desktop).
- **Text column matches the dialogue column exactly.** `.dr-dialog-body` is
  `width: fit-content`, so it differs per dialogue and per viewport — the bar
  measures it at runtime. Verified flush on both edges (left 551 = 551, right
  1355 = 1355).
- **18px, absolute.** It used to inherit from `.dialogue-reader`, so the A−/A+
  control scaled it; the bar is chrome, not content.
- **Shrinks to fit** rather than clipping or scrolling: steps 18px → 12px when a
  narrow screen needs more lines than the band has. Reserves only 12px of the
  band, not the full CSS padding — reserving 24px was triggering shrinks while
  ~20px of the box sat unused.
- **Idle state** shows a hint ("Tarjimani ko'rish uchun gapni bosing" / RU / EN),
  centred; translations are left-aligned. It says *sentence* because that is the
  unit, and nothing else in the UI says so.

### Attribution: highlight + scroll

Two supporting changes, both because the bar is far from the line it describes:

- **Tapping scrolls the line up under the bar** (12px gap). Karaoke doesn't need
  this because audio drives its active line; here the tap is the driver.
  Deferred to an effect, **not `requestAnimationFrame`** — rAF is starved
  whenever the tab isn't compositing, and this is correctness, not animation.
- **The highlight narrows to the tapped sentence** while translations are on.
  A highlight spanning both sentences implies the bar covers both, which made a
  correct per-sentence translation read as truncated.
  - Tap-again-to-deselect now counts only a repeat tap on the **same sentence**;
    it used to treat any second tap on the same entry as a re-tap, so moving to
    the entry's other sentence blanked everything.

## 4. Preferences persist

`src/hooks/usePersistedState.ts` (new). Pinyin, translation and font size
survive navigation: whether you need them is a fact about your level, not about
the dialogue you opened.

- Applied in an effect, **not a lazy initialiser** — reading `localStorage`
  during render is a hydration mismatch. The reader fetches content
  client-side, so the effect runs long before there is text; the default is
  never visibly on screen.
- Stored values are **range-checked on read**. Only this hook writes these keys,
  but a corrupt number reaching `fontSize` would make the reader unusable.
- **Focus mode deliberately does NOT persist** — it is a way to work through one
  dialogue, not a standing preference, and landing in it on a freshly opened
  dialogue reads as a broken page.

## 5. The ⋮ menu

Order: **Til** — Tarjima · Pinyin · Fokus — Shrift — Chiqish.

- **Til is new.** The hamburger held the only language switch inside the reader,
  and it went with the hero.
- **On/off switches** (`.dr-sw`) replaced checkmarks. A checkmark only marks
  what *is* on, so an off row read as an empty row rather than something you
  could turn on. Fokus got one too — a bare row beside two switches reads as
  broken rather than as different.
- **Chiqish** — same destination as the old hero ‹, a `Link` so it prefetches
  and middle-clicks like navigation.
- **Tarjima is disabled and greyed while focus mode is on**, because focus mode
  has no translation (§6). Shows the state rather than ignoring it.

## 6. Focus mode

- **No translation at all** — it is for working a line out from the Chinese and
  its full pinyin. (Full pinyin in focus mode remains deliberate; see the
  standing note in `src/components/CLAUDE.md`.)
- **Left-aligned**, matching the Dialog tab.
- **`line-height: 2.2`.** Was 3 — measured 108px between rows against the
  dialogue's 70. Brought to 1.95 to match exactly, then raised for a little more
  air on a screen showing one line. Kept as a multiple of the 36px type so A−/A+
  scales it.

## 7. Spacing

- **Line spacing no longer changes when pinyin is toggled.** Rows sat 70px apart
  with pinyin on and 47px off — every toggle reflowed the dialogue. The pinyin
  row is now reserved either way, so toggling changes what you see, not where
  the characters are. This also keeps `.dr-line-chars`' `column-gap` alive; it
  was collapsing to 0 via `:not(:has(.dr-char-py))` and changing horizontal
  spacing too.
- **First card sits 14px below the bar**, matching `.dr-line`'s own margin. It
  was 38px — 30px of column padding plus the bar's 8px. The `--dr-body-pt`
  variable went with it: it existed so the bar could cancel that padding, and
  nothing reads it now the bar is a sibling.

## 8. Navigation

- **‹ at the left end of the bottom tab bar**, mirroring the ⋮ at the right,
  same destination as Chiqish. Without it the only way out was two taps deep in
  a menu.
- **No support FAB on the HSK course reader** (`TelegramFAB.tsx`). It collides
  with the fixed bottom bar, which is why it was already hidden on dialogues,
  karaoke, story, flashcards and writing. Matched by **path depth**, not the
  word "hsk", so the lesson list one level up keeps it.

---

## Reverted

**Tab icons** (5 commits, `0754047`…`1ad1091`, reverted in `4a398e1`). Dialog
and Diktant, later all four tabs, showed an icon until selected. Reverted on
request — icons read worse than words there. Tree verified byte-identical to
before the attempt.

Worth keeping from it: icons must be sized by **area (geometric mean)**, not
longest side. Matching longest side left a wide-short glyph (20×15.8) and a
narrow-tall one (13.7×20) both hitting the target on one axis while reading
smaller than a square one.

---

## Every changed value, before → after

Extracted from `git diff d1d149a^ HEAD`, not from recall. This is the part that
would otherwise exist only in one person's head.

### `.dr-trbar` — new rule, the reader's top chrome

| property | value | why this number |
|---|---|---|
| `position` / `top` | `sticky` / `0` | nothing occupies the top since the hero went |
| `height` | **120px** | longest translation renders 88px at phone width; half are one 22px line. Was 175px (the hero's footprint) → 55px permanently empty |
| `width` / `margin-left` | `100vw` / `calc(-50vw + 50%)` | only correct because the bar is a **sibling** of `.dr-dialog-body`; measured from inside that column it lands 15px short on mobile, 439px off on desktop |
| `padding` | **6px 20px** | was 12px vertical — the fit routine reserved all of it and shrank text while the band had room |
| `background` | **`#fff`** | was `rgba(255,255,255,0.97)` + `blur(6px)`; at 0.97 the Chinese scrolling under it still read through |
| `margin-bottom` | *removed* (was 8px) | it added to the gap above the first card |
| `border-radius` | *removed* (was `0 0 6px 6px`) | a band spanning the viewport shouldn't have corners |
| `align-items` | `safe center` | plain centring pushes the first line above the scrollable area when text overflows |

### `.dr-trbar__text`

| property | before | after |
|---|---|---|
| `font-size` | `0.95em` | **`18px`** — px so A−/A+ can't scale chrome. JS owns the live value (18 → 12) |
| `text-align` | `center` | **`left`** (the idle hint stays centred via `.dr-trbar--idle`) |
| `max-width` | — | `900px`, a pre-script fallback only; **JS sets the real width from `.dr-dialog-body`** |
| `width` | — | `100%` |

### `.dr-dialog-body`

| property | before | after |
|---|---|---|
| `--dr-body-pt` | `30px` | **removed** — existed so the bar could cancel it; the bar left the column |
| `padding` | `var(--dr-body-pt) 16px 24px` | **`14px 16px 24px`** — matches `.dr-line`'s own 14px margin, so the first card sits the same distance below the bar as cards sit apart (was 38px) |

### `.story__focus-text` (focus mode)

| property | before | after |
|---|---|---|
| `text-align` | `center` | **`left`** |
| `line-height` | `3` (= 108px) | **`2.2`** — 1.95 matched the dialogue's 70px exactly, then raised for air |
| `align-items` | `center` | `stretch` |

### New rules

| selector | value |
|---|---|
| `.dr-hero--hidden` | `display: none` — reader only; **the teaser keeps the hero and its `<h1>`** |
| `.dr-sw` | 38×22 track, `#d8d8d8` → `#dc2626` when on, `border-radius: 999px`, 0.15s |
| `.dr-sw::after` | 18px knob, `translateX(16px)` when on |
| `.dr-ctl__item.is-disabled` | `opacity: 0.4` — Tarjima while focus mode owns it |
| `.dr-ctl__sz--on` | `#dc2626` fill — selected language in the Til row |
| `.dr-ctl__exit` / `-icon` | `#333` / `#999`, no switch track (it's an action) |
| `.dr-nav .dr-tabs__back` | `flex: 0 0 44px`, mirrors `.dr-nav .dr-more` |

### Removed rules

| selector | was |
|---|---|
| `.dr-ctl__item b` | `color: #dc2626; opacity: 0` — the checkmark |
| `.dr-ctl__item.is-on b` | `opacity: 1` |

### Component constants (`DialogueReader.tsx`)

| constant | value | note |
|---|---|---|
| `WHOLE_ENTRY` | `-1` | "no single sentence selected" |
| fit start / floor | `18px` / `12px` | shrink-to-fit bounds |
| fit reserve | `clientHeight - 12` | was `- 24`, which shrank text while the band had room |
| scroll gap | `12px` | tapped line's distance below the bar |
| scroll deadband | `24px` | below this a scroll reads as a twitch |
| localStorage keys | `blim-reader-{font,pinyin,translation}` | defaults `100` / `true` / `false`; font accepted only in 80–150 |

---

## Mistakes worth not repeating

Every one of these was caught by measuring in a browser. None would have been
caught by looking.

- **Smooth scroll does not animate in a non-compositing tab.** `behavior:'auto'`
  defers to CSS `scroll-behavior: smooth`, which the site sets globally, so
  *every* programmatic scroll reads back as "nothing moved". Only
  `behavior:'instant'` overrides it. Cost three false negatives.
- **`requestAnimationFrame` never fires in a backgrounded tab**
  (`visibilityState: hidden`). Fine for animation, wrong for correctness.
- **Full-bleed measured from a centred `fit-content` parent is wrong.** Twice.
- **`str.replace(old, new, 1)` hits the first match in the file**, which is not
  necessarily the rule you mean — one edit silently restyled an unrelated
  button. Match on surrounding context, not on the value.
- **Diagnose before explaining.** The play-all bug got two confident wrong
  explanations ("HSK stores one sentence per entry", "dialogue audio is
  recorded") before anyone checked the data. Both were false.
