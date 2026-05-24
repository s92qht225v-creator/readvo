# Test Player Token System

Single source of truth for every answer-type's dimensional and theming
styles. Lives in `tq-options.css`, read by the renderers and applied
identically across all three rendering surfaces (live player,
`?preview=1` shell, builder canvas).

This document is the reference for tweaking any answer-type's look —
**don't go hunting through `test-player.css`, `test-builder-preview.css`,
or `reading.css` first**; they no longer own answer-type styles.

---

## Why this exists

Before the migration, each answer type's CSS lived in 3-5 parallel
chains across `test-player.css`, `test-builder-preview.css`,
`reading.css` (`.test-preview-shell--mobile`, `@media (max-width:640px)`,
`.tb-canvas--mobile`), `question-media.css` (`@container (min-width:480px)`
expansions), plus inline-style helpers in each renderer. Tweaking one
surface broke another; the override chain was so deep that surfaces
silently cancelled each other out.

The token system solves it by:

1. Declaring all dimensional values **once** as `--<type>-*` custom
   properties on the device root (`:where(html)` + `[data-test-device="mobile"]` +
   `[data-test-device="desktop"]`).
2. Writing shared rules that read tokens (`var(--mt-row-min-h)`),
   never device-branched.
3. Setting `data-test-device="mobile|desktop"` on an ancestor at each
   surface — `TestPlayer.tsx` derives from viewport, `TestBuilder.tsx`
   from the preview-device toggle.
4. Removing every parallel rule chain from the legacy files; theming
   (theme-tinted background + accent text + answer-radius) reads
   `--test-theme-*` vars directly.

Net result: tweak one token, every surface follows. No more "fix one,
break another."

---

## How a surface picks a device

```tsx
// TestPlayer.tsx
<div className="test-player" data-test-device={device}>
  …
</div>

// TestBuilder.tsx
<div className="tb-preview-card" data-test-device={previewDevice}>
  …
</div>
```

The CSS rules:

```css
:where(html)                  /* safety-net defaults if attribute missing */
[data-test-device="mobile"]   /* mobile token block */
[data-test-device="desktop"]  /* desktop token block */
```

Tokens cascade to descendants. Shared element rules read them. No
ancestor required at the rule level — `data-test-device` just defines
the values.

---

## Token families

Every family follows the same pattern: declare in `:where(html)` as a
default, then mobile + desktop overrides. Shared rules live below the
token blocks and reference `var(--name)`.

| Family | Type(s) | Drives |
|---|---|---|
| `--tq-*` | multiple_choice, true_false, checkbox | `.tq-options` grid, `.tq-option` chip rows, `.tq-option__chip`/`__check`/`__label` |
| `--ti-*` | short_text, long_answer, number | `.test-short-answer`, `.test-long-answer`, `.test-number-answer` |
| `--pic-*` | picture_choice | `.test-picture-options` grid + `.test-picture-option` + `__image`/`__label`/`__badge`/`__text` |
| `--os-*` | opinion_scale | `.test-opinion-scale` block + `__scale` (flex-wrap row of buttons) + `__labels` |
| `--or-*` | rating | `.test-rating` flex row of star/heart/number buttons |
| `--dd-*` | dropdown | `.test-dropdown-answer`, `.test-custom-dropdown__trigger`/`__chevron`/`__menu`/`__option`/`__check` |
| `--ord-*` | ordering | `.test-ordering-list` + `__rows` + `.test-ordering-row` + `__badge`/`__text`/`__handle` + `.test-ordering-hint` |
| `--fb-*` | fill_blanks | `.test-fill-blanks` passage + `.test-fill-blank-input` |
| `--mt-*` | match | `.test-match-list` 2-column grid + `.test-match-column` + `.test-match-choice` + `__badge`/`__text` |
| `--qm-*` | media (image/video) layout | `.qmedia-layout` direction/grid + `.qmedia-asset` + `.qmedia-content` (token block, not per-type) |

The qmedia tokens (`--qm-*`) drive the media-wrapper layout — float,
stack, audio — and read `--qmedia-card-pad-x` set by each host on the
card root.

---

## Per-type token reference

### `--tq-*` — option lists (multi-choice, true/false, checkbox)

| Token | Mobile | Desktop |
|---|---|---|
| `--tq-column` | `min(100%, 480px)` | `100%` |
| `--tq-list-gap` | `7px` | `8px` |
| `--tq-option-min-h` | `37px` | `56px` |
| `--tq-option-pad-y` / `-x` | `6px` / `10px` | `12px` / `16px` |
| `--tq-option-fs` | `18px` | `18px` |
| `--tq-option-lh` | `20px` | `24px` |
| `--tq-option-radius` | `1px` | `3px` |
| `--tq-option-content-gap` | `8px` | `10px` |
| `--tq-chip-size` / `-fs` | `22px` / `11px` | `28px` / `12px` |
| `--tq-checkbox-size` | `22px` | `26px` |

Selected state: 18% accent-tint background + inset 2px accent ring.
Click feedback: `transform: scale(0.992)` on `:active`.

### `--ti-*` — text inputs (short, long, number)

| Token | Mobile | Desktop |
|---|---|---|
| `--ti-fs` | `15px` | `16px` |
| `--ti-lh` | `24px` | `24px` |
| `--ti-pad-y` / `-x` | `10px` | `12px` / `14px` |
| `--ti-min-h-short` | `92px` | `56px` |
| `--ti-min-h-long` | `148px` | `200px` |
| `--ti-min-h-number` | `37px` | `56px` |
| `--ti-radius` | `1px` | `3px` |
| `--ti-width` | `var(--tq-column)` | `100%` |

Short + long: grey 1px border + `resize: vertical`. Number: no border,
1.5px accent underline.

### `--pic-*` — picture choice

| Token | Mobile | Desktop |
|---|---|---|
| `--pic-cols` | `repeat(2, minmax(0, 1fr))` | `repeat(2, minmax(0, 1fr))` |
| `--pic-gap` | `8px` | `12px` |
| `--pic-pad` | `8px` | `10px` |
| `--pic-radius` | `1px` | `3px` |
| `--pic-fs` | `14px` | `16px` |
| `--pic-img-mb` | `8px` | `10px` |
| `--pic-img-radius` | `1px` | `3px` |
| `--pic-label-gap` | `6px` | `8px` |
| `--pic-badge-size` / `-fs` / `-radius` | `22px` / `11px` / `3px` | `26px` / `12px` / `3px` |
| `--pic-grid-mb` | `0` | `24px` (breathing room above nav bar) |

Image cell: `aspect-ratio: 1/1`, dashed accent border when empty, solid
+ background-image when set. Badge = letter chip (A/B/C/D).

### `--os-*` — opinion scale

| Token | Mobile | Desktop |
|---|---|---|
| `--os-max-w` | `361px` | `100%` |
| `--os-stack-gap` | `8px` (between scale + labels) | `10px` |
| `--os-row-gap` | `6px` (between buttons) | `8px` |
| `--os-btn-basis` | `calc((100% - 5 * gap) / 6)` | `0` |
| `--os-btn-grow` | `0` | `1` |
| `--os-btn-h` | `56px` | `56px` |
| `--os-btn-fs` | `14px` | `16px` |
| `--os-btn-radius` | `1px` | `3px` |
| `--os-label-fs` | `12px` | `13px` |

Layout: flex-wrap with explicit per-button basis. Mobile forces 6 cols
(basis = 1/6 of container, grow = 0), so 11-button 0-10 scales wrap to
6 + 5 and the partial second row centers via `justify-content: center`.
Desktop (basis = 0, grow = 1) puts all buttons in one row regardless
of count.

### `--or-*` — rating

| Token | Mobile | Desktop |
|---|---|---|
| `--or-gap` | `8px` | `8px` |
| `--or-btn-size` | `46px` | `46px` |
| `--or-btn-fs` | `34px` | `34px` |
| `--or-btn-radius` | `1px` | `1px` |

Selected button = gold `#f59e0b`, unselected = grey `#6b7177`.
Transparent background. Symbol from JSX (★ / ☆ / ♥ / number).

### `--dd-*` — dropdown

| Token | Mobile | Desktop |
|---|---|---|
| `--dd-trigger-min-h` | `37px` | `56px` |
| `--dd-trigger-pad-y` / `-x` | `6px` / `10px` | `12px` / `14px` |
| `--dd-trigger-fs` | `18px` | `18px` |
| `--dd-trigger-lh` | `24px` | `24px` |
| `--dd-trigger-gap` | `12px` | `12px` |
| `--dd-radius` | `3px` | `3px` |
| `--dd-chevron-size` | `16px` | `18px` |
| `--dd-menu-shadow` | `0 8px 24px rgba(0,0,0,0.12)` | same |
| `--dd-option-min-h` | `34px` | `40px` |
| `--dd-option-pad-y` / `-x` | `6px` / `10px` | `8px` / `14px` |
| `--dd-option-fs` / `-lh` | `16px` / `22px` | `16px` / `22px` |
| `--dd-option-gap` | `6px` | `8px` |
| `--dd-check-w` | `14px` | `14px` |

Trigger: theme tint + chevron rotates 180° on open. Menu: absolute
popover with `test-dropdown-open` keyframe animation. Selected option
gets 14% accent tint + accent text.

### `--ord-*` — ordering

| Token | Mobile | Desktop |
|---|---|---|
| `--ord-rows-gap` | `8px` | `10px` |
| `--ord-row-min-h` | `37px` | `48px` |
| `--ord-row-pad-y` / `-x` | `8px` / `10px` | `10px` / `14px` |
| `--ord-row-content-gap` | `8px` | `10px` |
| `--ord-row-fs` / `-lh` | `15px` / `20px` | `16px` / `22px` |
| `--ord-row-radius` | `1px` | `3px` |
| `--ord-badge-size` / `-fs` / `-radius` | `22px` / `11px` / `3px` | `26px` / `12px` / `3px` |
| `--ord-handle-pad-x` | `2px` | `4px` |
| `--ord-hint-fs` / `-mt` | `13px` / `4px` | `13px` / `6px` |

Drag state: `data-dragging="true"` attribute on the row. CSS branches
on the attribute to apply 1px accent border + 50% opacity + drop
shadow. dnd-kit's `transform` + `transition` stay inline on the row
(per-item, runtime-driven).

### `--fb-*` — fill blanks

| Token | Mobile | Desktop |
|---|---|---|
| `--fb-passage-fs` / `-lh` | `16px` / `1.8` | `17px` / `1.85` |
| `--fb-input-min-w` | `4.6ch` | `5ch` |
| `--fb-input-h` | `1.9em` | `1.9em` |
| `--fb-input-pad-x` | `0.45em` | `0.5em` |
| `--fb-input-margin-x` | `0.18em` | `0.2em` |
| `--fb-input-fs` / `-lh` | `16px` / `1.2` | `17px` / `1.2` |
| `--fb-input-radius` | `1px 1px 0 0` | `3px 3px 0 0` |
| `--fb-input-underline` | `1.5px` | `1.5px` |

Passage flows inline. Each blank: theme tint, accent underline, no
top border, content-driven width (the renderer sets `width` inline
from typed length / expected answer-length hint via `blankInputWidth()`).
`:focus-visible` adds an inset accent shadow.

### `--mt-*` — match

| Token | Mobile | Desktop |
|---|---|---|
| `--mt-cols-gap` | `8px` (between left + right columns) | `12px` |
| `--mt-col-rows-gap` | `7px` (between items in a column) | `8px` |
| `--mt-choice-min-h` | `37px` | `48px` |
| `--mt-choice-pad-y` / `-x` | `6px` / `10px` | `10px` / `14px` |
| `--mt-choice-content-gap` | `6px` | `8px` |
| `--mt-choice-fs` / `-lh` | `15px` / `20px` | `16px` / `22px` |
| `--mt-choice-radius` | `1px` | `3px` |
| `--mt-badge-size` / `-fs` / `-radius` | `20px` / `11px` / `3px` | `24px` / `12px` / `3px` |

Layout: `display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr)`
— two columns side-by-side regardless of device. Selected: inset 2px
accent ring + 18% tint. Matched (not selected): 14% tint + numbered
badge. Tap-pattern: click left item, then click matching right item
(or vice versa); badge numbers the pair.

### `--qm-*` — qmedia layout (image/video wrapper)

This isn't per-question-type — it drives the wrapper that hosts the
header (title + description) and answer area, optionally with a media
asset (image/video/audio) above, beside, or stacked. Tokens declared
in `tq-options.css`, structure in `QuestionMediaLayout` (in
`QuestionMediaBlock.tsx`).

Variants are class-driven:
- `qmedia-mobile-stack` (default) / `qmedia-mobile-float` — order tokens
- `qmedia-desktop-float-right` (default) / `qmedia-desktop-float-left` — grid columns
- `qmedia-audio` + `qmedia-audio-top` — audio player flow

Audio is special: it always sits between description and answer on
both devices via `display: contents` on `.qmedia-content` + flex
`order` tokens (header=1, asset=2, answer=3).

No-media wrapper: `.qmedia-layout.qmedia-no-media` overrides the
desktop 2-column grid to flex-column + `overflow: visible` so tall
answer content (picture cards, long forms) isn't clipped.

Portrait media: `.qmedia-asset--portrait` modifier set by the renderer
when `aspect < 1`. Wrapper sized to fit `--qm-asset-max-h` (default
600px). Uploaded video uses `object-fit: cover` to guarantee no
letterbox.

---

## Renderer pattern

Each renderer must:

1. **Use className-driven structure**, BEM-ish (`.test-x`, `.test-x__sub`).
2. **Strip inline dimensional styles** — only data-driven inline
   styles are allowed:
   - Picture-choice image `backgroundImage` from `image_url`.
   - Fill-blank input `width` from `blankInputWidth(...)`.
   - Ordering row `transform` + `transition` from dnd-kit.
   - Uploaded video wrapper `aspectRatio` from runtime
     `videoWidth/videoHeight` detection.
3. **Use `data-*` attributes for state** (`data-selected`, `data-matched`,
   `data-dragging`). CSS branches on them; no per-state inline style
   helpers.
4. **Theme via CSS vars** — never hardcode `#0445af` or `rgba(4,69,175,...)`.
   Use `var(--test-theme-answer)`, `var(--test-theme-answer-text)`,
   `color-mix(in srgb, var(--test-theme-answer) 8%, #ffffff)`.

---

## Adding a new question type

1. Add the type literal to `src/lib/test/types.ts` (`XOptions` +
   `PublicXOptions` + union).
2. Add a `settings/XSettings.tsx` (right-rail editor; pattern in `_shared.tsx`).
3. Wire it in `SettingsPanel.tsx`'s dispatch block.
4. Add the renderer branch in `QuestionRenderer.tsx` (or extract to
   `renderers/XRenderer.tsx` if it grows past ~30 lines).
5. **Add a `--xx-*` token family to `tq-options.css`** — declare in
   `:where(html)` + mobile + desktop blocks.
6. **Add the shared rule block** to `tq-options.css` under the
   `Token blocks` divider. Read tokens. Theme via `--test-theme-*`.
7. Register icon/label in `questionTypeMeta.ts` if user-facing.

**Don't add any selector to `test-player.css`, `test-builder-preview.css`,
or `reading.css`.** Those files only contain card chrome, page layout,
and the few remaining bits not yet moved to tokens (e.g. `--qmedia-card-pad-x`
on the card itself).

---

## Migration history

Done in order, one commit per type after the multi-choice PoC:

| Order | Type(s) | Tokens | Net diff |
|---|---|---|---|
| 1 (PoC) | multiple_choice + true_false + checkbox | `--tq-*` | (initial system) |
| 2 | short_text + long_answer + number | `--ti-*` | −54 |
| 3 | picture_choice | `--pic-*` | +22 |
| 4 | opinion_scale + rating | `--os-*`, `--or-*` | −197 |
| 5 | dropdown | `--dd-*` | −75 |
| 6 | ordering | `--ord-*` | −139 |
| 7 | fill_blanks | `--fb-*` | −33 |
| 8 | match | `--mt-*` | −492 |

**Total: −968 lines** of CSS removed from `test-player.css`,
`test-builder-preview.css`, `reading.css`, and `question-media.css`,
replaced with ~750 lines of token declarations + shared rules in
`tq-options.css`.

Scramble (the 14th type, `ScramblePlayer`) was deliberately not
migrated — it has only 6 CSS references, all inline in its renderer
with no parallel chains. Migration would be cosmetic-only.

---

## Files involved

- **`src/components/test/tq-options.css`** — the token system + all
  answer-type rules. **Single source of truth.**
- **`src/components/test/QuestionRenderer.tsx`** — dispatcher; small
  branches inline (multi-choice / true_false / checkbox / picture /
  opinion / rating / short / long / number / dropdown).
- **`src/components/test/renderers/`** — heavy renderers (match,
  ordering, fill_blanks, scramble).
- **`src/components/test/test-player.css`** — card chrome (height,
  border, scroll), navigation, wallpaper bg, force-mobile/desktop card
  modifiers. **No answer-type rules left.**
- **`src/components/test/test-builder-preview.css`** — builder canvas
  card chrome + the few legacy variant-bridge tokens. **No answer-type
  rules left.**
- **`src/components/test/question-media.css`** — audio-player chrome
  (`.qmedia-audio-player` + its sub-elements). qmedia layout now in
  tq-options.css. **No answer-type rules left.**
- **`src/styles/reading.css`** — preview-shell frame chrome
  (`.test-preview-shell--{mobile,desktop}` card + nav clamps). **No
  answer-type rules left.**

If you find yourself reaching for any file other than `tq-options.css`
or the renderer to change how an answer type *looks*, stop. The
mechanism is broken or there's a leftover override that should be
deleted. The whole point of the migration is that one file owns it.

---

## Out of scope (not token-driven)

A few areas of the test app are intentionally NOT in the `--*-*`
token system because they're surface-specific chrome, not answer-type
styling:

- **Test card chrome** (height, border, scroll, padding) — lives in
  `test-player.css` + `test-builder-preview.css` + `reading.css`
  `.test-preview-shell--*` blocks. Change those if you want the card
  itself bigger / scrollable / padded differently.
- **Welcome screen layout** (50/50 split, content alignment, media
  half) — uses `data-test-device` on the welcome card directly, with
  rules in `reading.css` under `.test-player-screen__card[…]`. See
  the "Welcome screen" section in `CLAUDE.md`.
- **End screen** — same shape as welcome but no collector / media.
- **Test player navigation** (Back/Next, progress) — `TestPlayer.tsx`
  inline styles + the `.test-player__nav` rules.
- **Builder dashboard / sidebar / quota box** — `TestList.tsx` inline
  styles.
- **Settings panel** — `SettingsPanel.tsx` + `settings/` per-type
  editors, plus `settings/_shared.tsx` primitives.
