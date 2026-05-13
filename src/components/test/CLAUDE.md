# Test Builder + Player

A Typeform-style test/quiz builder with a public player. This doc maps the
folder, the per-question-type extension recipe, and the viewport/layout
gotchas that bit us repeatedly.

## Folder map

```
src/components/test/
├── TestBuilder.tsx         Top-level editor: left rail (question list), center
│                           canvas (PreviewCanvas), right rail (SettingsPanel).
│                           Holds all editor state (questions, save, dnd).
├── TestPlayer.tsx          Live test runner. Mounted at `/test-app/t/[slug]`,
│                           and inside the preview shell at `?preview=1`.
├── TestList.tsx            Dashboard list of tests + workspaces.
├── QuestionRenderer.tsx    Dispatcher: switches on `question.type` and renders
│                           the matching player UI. Inline JSX for the small
│                           types; named players (Match/Ordering/FillBlanks)
│                           imported from `renderers/`.
├── QuestionMediaBlock.tsx  Wraps question content with media (image/video).
│                           Picks layout class via `layoutClassName(media,
│                           forceDevice)` — the qmedia class swap.
├── SettingsPanel.tsx       Right-rail editor. Dispatches per-type to
│                           `settings/XSettings.tsx`. Contains MediaRow,
│                           MediaLayoutControls, LayoutSelect (the layout
│                           dropdowns), and panel-level chrome.
├── settings/               Per-question-type editors. One file per type.
│   ├── _shared.tsx         Field, ToggleRow, TextLengthBehavior, kicker,
│   │                       inputStyle, removeBtn, addChoiceBtn, textareaStyle,
│   │                       correctAnswerBlock/Label/Choices/Chip.
│   ├── ChoiceListSettings.tsx   Shared by Dropdown + Checkbox.
│   ├── McSettings.tsx, PictureChoiceSettings.tsx, TrueFalseSettings.tsx,
│   ├── MatchSettings.tsx, OrderingSettings.tsx, FillBlanksSettings.tsx,
│   ├── ShortTextSettings.tsx, LongAnswerSettings.tsx, NumberSettings.tsx,
│   ├── DropdownSettings.tsx, CheckboxSettings.tsx,
│   └── OpinionScaleSettings.tsx, RatingSettings.tsx
├── renderers/              Heavy player components extracted from
│                           QuestionRenderer.tsx. Add one when the inline JSX
│                           grows past ~30 lines.
│   ├── MatchRenderer.tsx    MatchPlayer + match styles.
│   ├── OrderingRenderer.tsx OrderingPlayer + SortableOrderingRow + styles.
│   └── FillBlanksRenderer.tsx FillBlanksPlayer + blankInputWidth.
├── media/                  Media-editing modals + helpers, extracted from
│                           SettingsPanel.tsx.
│   ├── _helpers.ts          getQuestionMedia, setQuestionMedia,
│   │                        normalizeDesktopLayout (used by both
│   │                        SettingsPanel and the modals).
│   ├── _styles.ts           Modal styles shared between gallery + settings.
│   ├── LayoutIcons.tsx      All 12 SVG icons + DeviceIconFrame +
│   │                        LayoutIcon dispatcher.
│   ├── MediaGalleryModal.tsx  Upload / paste-URL gallery.
│   └── MediaSettingsModal.tsx Crop, aspect ratio, rotate, flip.
├── testList/               Helpers extracted from TestList.tsx.
│   ├── styles.ts, icons.tsx, TemplateCard.tsx, formatDate.ts
├── test-player.css         Live-player typography + per-type widths + match
│                           grid + opinion-scale + fill-blank input styling.
│                           Uses @container queries against `.test-player__card`
│                           with breakpoint 480px.
├── question-media.css      Media-block layout (mobile-stack/float/split/
│                           wallpaper, desktop-stack/float-X/split-X/wallpaper).
│                           Uses @container queries against `.qmedia-layout`.
│                           Has parallel `.qmedia-force-desktop` blocks that
│                           apply unconditionally.
├── test-builder-preview.css Builder-only styles. The `.tb-preview-card--*`
│                           classes drive class-based device switching (no
│                           container queries needed since the builder uses
│                           a fixed-pixel preview frame).
├── builderTypes.ts          BuilderQuestion type used across the builder.
└── questionTypeMeta.ts      Type → { icon, label } registry for the add menu.
```

Live-preview shell styles (the phone-frame / desktop frame at `?preview=1`)
live in **`src/styles/reading.css`** under `.test-preview-shell--{desktop,mobile}`.
That file also overrides player styles for the simulated frame.

## Adding a new question type

Four files, no exception:

1. **`@/lib/test/types.ts`** — add `XOptions` (builder), `PublicXOptions` (player),
   and add the type literal to `BuilderQuestion`/`PublicQuestion` unions.
2. **`settings/XSettings.tsx`** — the right-rail editor. Imports primitives from
   `./_shared`. Pattern: cast `q.options as XOptions`, render inputs, call
   `onChange({ ...q, options: { ...opts, ... } })`.
3. **`SettingsPanel.tsx`** — add `import { XSettings } from './settings/XSettings'`
   at the top, and one line to the dispatch block (around line 56-68):
   `{q.type === 'x' && <XSettings q={q} onChange={onChange} ... />}`
4. **`QuestionRenderer.tsx`** — add an `if (question.type === 'x') { ... }` branch.
   If the JSX is < 30 lines, inline it. If it grows, extract to
   `renderers/XRenderer.tsx` and import.

Optional: register icon/label in `questionTypeMeta.ts`. Add a default in
`TestBuilder.tsx`'s `addQuestion` switch.

## Viewport architecture

Three places render question content. They share class names but layout
differently:

| Surface | Where | Sizing | Layout source |
|---|---|---|---|
| **Builder PreviewCanvas** | `TestBuilder.tsx:PreviewCanvas` | Fixed pixel frame: 1120×620 desktop, 372×663 mobile. The `.tb-canvas` wrapper is `display: flex; align-items: flex-start; justify-content: safe center` and uses `padding: 52px 32px` (desktop) / `52px 8px` (mobile) so the card top sits at the same y (52 px below the toolbar) on both devices. | Class-based via `.tb-preview-card--{desktop,mobile-centered}` in `test-builder-preview.css` |
| **Live TestPlayer (real users)** | `/test-app/t/[slug]` mounted directly | Card width follows real viewport, max 660px in playerInner | `@container (min-width: 480px)` queries against `.test-player__card` in `test-player.css` |
| **Preview shell** | Same route with `?preview=1` (or on localhost) | Wraps `<TestPlayer forceDevice={device}>` in `.test-preview-shell--{desktop,mobile}` with fixed simulated frame | `.test-preview-shell--*` overrides in `reading.css` |

**Container type is set inline** on both `.tb-preview-card` and
`.test-player__card` (`containerType: 'inline-size'`). The 480px breakpoint
is chosen so the builder's 427px mobile frame stays mobile while the live
desktop card (~556-660px) triggers desktop.

**`forceDevice` and the qmedia class swap.** When `<TestPlayer forceDevice="X">`
or the builder's mobile/desktop toggle is set, `QuestionMediaBlock`'s
`layoutClassName()` drops the inactive device's class entirely. Result:

- `forceDevice='mobile'` → element has `qmedia-mobile-X qmedia-force-mobile`
  (no desktop class). Desktop CSS rules don't match. Mobile rules apply.
- `forceDevice='desktop'` → element has `qmedia-desktop-X qmedia-force-desktop`
  (no mobile class). Mobile rules don't match. Desktop rules apply.
- No force → both `qmedia-mobile-X qmedia-desktop-X` are present, and
  `@container` queries decide which wins.
- Audio media bypasses `layoutClassName()` and uses `qmedia-audio-top`, so it
  is always rendered above the question and does not expose layout controls.

## Layout gotchas (read before debugging)

### `justify-content: safe center`

Any flex-column container with **fixed height + `justify-content: center`**
will clip the top of overflowing content (and the badge/title get cut off
above the visible area). Use `safe center` — the keyword falls back to
`flex-start` when content would overflow. Applies in:

- `TestBuilder.tsx:PreviewCanvas` (`previewCard` inline style on the
  card itself; the `.tb-canvas` parent uses `flex-start` instead — see
  "Card y-position parity" below)
- `reading.css` `.test-preview-shell--mobile/desktop .test-player__card`

### Card y-position parity (builder + preview shell)

Both the builder PreviewCanvas and the `?preview=1` shell render
desktop and mobile cards. The expectation is that toggling device
shouldn't shift the card vertically; the card top stays anchored at
the same y.

**Builder canvas (`tb-canvas`)** — both devices use:
- `display: flex; align-items: flex-start; justify-content: safe center`
- `padding-top: 52px` (was: desktop `28px` + safe-center slack, mobile
  `8px` canvas padding + `44px` wrap padding — both produced different
  vertical centers and a 15 px mismatch)
- `.tb-canvas--mobile .tb-preview-wrap` padding is **0** (the old
  `44px 0` wrap chrome was the source of bottom clipping after the
  card heights were re-unified).

Net: card top lands at y = `toolbar.bottom + 52` on both devices.

**Preview shell (`test-preview-shell--*`)** — the desktop card sits at
y=93 (test-player-screen padding-top 36 + 57 px toolbar area). The
mobile card uses `justify-content: flex-start` (not center) with
`padding: 93px 0 calc(132px + safe-area-inset-bottom)` on
`.test-player` and `.test-player-screen` so its card lands at the
same y=93 as desktop.

### No drop shadows on cards

All test-app cards render flat:
- `.test-preview-shell--desktop .test-player__card` and
  `.test-preview-shell--mobile .test-player__card`:
  `box-shadow: none !important` in `reading.css`.
- `publicScreenCard` inline style in `TestPlayer.tsx` (welcome /
  end screen card): `boxShadow: 'none'`.
- Production mobile (`@media (max-width: 640px)` block in `reading.css`):
  `.test-player__card` is `background: transparent`, `border: none`,
  `box-shadow: none`, `padding: 0` — the card chrome is invisible so
  the question content floats directly on the page background.

If you need to add elevation, do so per-element (e.g. on a button or
badge) — do NOT reintroduce shadows on the card chrome itself.

### Mobile production card layout

`@media (max-width: 640px)` in `reading.css` is the single source for the
real-mobile player chrome. After several iterations the active config is:

- `.test-player`: `align-items: safe center` + `padding: 24px 12px
  calc(132px + safe-area-inset-bottom)` so short content sits visually
  centered in the viewport while long content falls back to flex-start
  and scrolls (no top clipping).
- `.test-player__inner`: `display: block` (no forced 100vh flex-grow).
  The shell handles centering.
- `.test-player__card`: chrome-less (see "No drop shadows" above) and
  `--test-mobile-column: min(100%, 303px)` defined here.
- Typography unified to flatten the title-vs-body hierarchy that looked
  jumpy on phones:
  - `.test-player__title`: `18px / 1.3 / -0.2 letter-spacing`
  - `.test-player__description`: `15px / 1.4`
  - Every option / row / input (.test-question-option, .test-match-row,
    .test-match-select, .test-match-choice, .test-ordering-row,
    .test-short-answer, .test-fill-blanks): `15px`

### Mobile match-list clamp (defeats @container desktop float rules)

`question-media.css` has `@container (min-width: 480px) { …
.qmedia-desktop-float-left .test-match-list { width: 100% !important } }`
plus the same rule for float-right and split-* variants. The container
is `.test-player__card` (`container-type: inline-size`). On phones whose
card width reaches ~480 CSS px (~430–480 viewport with no padding), the
container fires even though the viewport is "mobile", and the match list
widens past `--test-mobile-column`.

To re-clamp, `reading.css` `@media (max-width: 640px)` adds a (0,4,2)
selector that beats the container rule's (0,4,0):

```css
html body .test-player .test-player__card.test-player__card--type-match
  .test-match-list,
html body .test-player .test-player__card.test-player__card--type-match
  .test-match-pairing,
html body .test-player .test-player__card.test-player__card--type-match
  .qmedia-answer,
html body .test-player .test-player__card.test-player__card--type-match
  .qmedia-header {
  width: var(--test-mobile-column, min(100%, 303px)) !important;
  …
}
```

Same pattern works for any other element that the desktop `@container`
rules would widen past the mobile column.

### Theme fields (current shape)

`TestThemeConfig` in `src/lib/test/theme.ts` (mirrored loosely in
`src/lib/test/types.ts`):

```ts
themeName, backgroundColor, questionColor, descriptionColor,
answerTextColor, answerColor, buttonColor, buttonTextColor, fontScale,
fontFamily, answerRadius, backgroundImageUrl
```

CSS vars exported via `testThemeCssVars`: `--test-theme-bg`,
`--test-theme-question`, `--test-theme-description`, `--test-theme-answer-text`,
`--test-theme-answer`, `--test-theme-button`, `--test-theme-button-text`,
`--test-theme-font-scale`, `--test-theme-font-family`,
`--test-theme-answer-radius`, `--test-theme-bg-image`.

Two answer colours are deliberately split:
- `--test-theme-answer-text` drives the `color:` of option labels,
  dropdown text, fill-blank input text, etc.
- `--test-theme-answer` drives the accent: 8 % bg tint, letter chip /
  selected ring / fill-blank underline / dropdown chevron (`color` on
  `.test-custom-dropdown__chevron` is bound to the accent so it doesn't
  inherit answer-text).

Legacy fields silently dropped by `normalizeTestTheme`: `logoUrl`,
`logoAlt`, `logoSize`, `logoAlign` (the Design > Logo tab was removed);
`titleSize`, `titleAlign`, `questionSize`, `questionAlign` (the Design >
"Size and positioning" controls were removed).

### Font picker popover (no Design modal)

`TestBuilder.tsx` no longer mounts a `<ThemeModal>`. The Design button
is replaced by a Font button that toggles a draggable
`<FontPickerPanel>` popover (320 px wide, anchored top-right). The
popover:

- Lists 31 font families (system + 30 web-safe stacks). Each row
  previews its label in its own family via the `FONT_PREVIEW_STACK`
  map.
- Header has a drag handle (the 6-dot grip) — pointer-down on the dots
  starts an absolute-position drag, clamped to viewport bounds.
- The close (×) button is **outside** the drag region and uses
  `onPointerDown={e => e.stopPropagation()}` so it doesn't get
  swallowed by the parent's `setPointerCapture`.

The legacy `ThemeModal` function and its sub-panels (`ThemeFontPanel`,
`ThemeButtonsPanel`, `ThemeBackgroundPanel`, theme-list view, upload
view) still live in `TestBuilder.tsx` as dead code — the modal is no
longer mounted but the helpers can be deleted in a follow-up cleanup.

### Question type quirks

- **Multi-select** (`multiple_choice` with `allowMultiple: true`):
  letter chip A/B/C/D is replaced with a 22 × 22 rounded square
  checkbox icon. Empty (2px accent outline) when unchecked, filled
  with accent + white checkmark when checked. Single-select keeps
  the lettered chip.
- **Dedicated `checkbox` type**: same 22 × 22 checkbox icon (was 44 px
  before). Border is a uniform 2 px accent ring in either state.
- **Checkmark stroke**: hardcoded `stroke="#fff"` in both the inline
  multi-select icon and the dedicated checkbox renderer. Using
  `currentColor` made the white ✓ inherit the answer-accent colour
  via `.test-question-option span:first-child { color: …!important }`,
  which painted blue-on-blue and looked invisible.
- **Rating**: selected stars only change colour (gold); no blue
  inset box-shadow. The shared
  `.test-player__card .test-rating button[data-selected="true"]`
  rule sets `box-shadow: none !important`.
- **Ordering drag**: a `restrictToVerticalAxis` modifier on
  `DndContext` zeros out the x component of the dnd-kit transform,
  so rows can only be dragged up/down — no horizontal fling off the
  side of the screen on mobile.

### `flex-shrink: 0` for content-driven height

When a child of the card flex column has `min-height: 100%` and content
larger than the card, the parent flex will **shrink** the child to fit
unless you explicitly set `flex-shrink: 0`. Example: the `.qmedia-mobile-wallpaper`
in the preview shell — without `flex-shrink: 0`, it stays at 661px even
though content needs 876px, and the wallpaper's `padding-bottom` never
applies because content overflows past the wallpaper element. See
`reading.css` `.test-preview-shell--mobile .test-player__card:has(.qmedia-mobile-wallpaper) .qmedia-layout`.

### Wallpaper layout dim opacity

The wallpaper image (`.qmedia-asset` inside `.qmedia-mobile-wallpaper`)
needs `opacity: 0.42` so the overlaid title/description/options stay
readable. Don't override to `1` in shell-specific rules — black text
becomes unreadable on full-saturation backgrounds.

### Mobile content centering

The card's content area is 320px wide (372 - 26×2 padding). The 303px
content column inside (`width: 303px !important`) needs **`margin-inline: auto !important`**
to center symmetrically — without it, the column left-aligns and produces
a 27px/42px asymmetric gap. The catchall `.test-preview-shell--mobile .qmedia-answer`
rule in `reading.css` sets both width and margin-inline together.

Use the same mobile column width everywhere mobile is rendered:
`--test-mobile-column: min(100%, 303px)`. That column applies to question
title/description, stack/float media, audio players, and answer controls.
Split media can stay full-bleed, but the text and answer controls below it
still use the shared 303px column. Do not add separate 320px media widths.

### `:not(.test-player__card--force-mobile)` modifier

Desktop-expansion rules (e.g. `width: 100%` instead of mobile's
`width: 303px`) gate on **`@container (min-width: 480px)` AND
`:not(.--force-mobile)`** so:

- Real desktop viewport → container fires, no force-mobile → desktop wins.
- Real mobile → container doesn't fire → mobile wins.
- Force mobile on wide screen → container fires, but `:not(force-mobile)`
  blocks → mobile wins.

For the parallel "force desktop on tiny viewport" case, there's a separate
unconditional block of `.test-player__card--force-desktop` rules at the
bottom of `test-player.css` and `.qmedia-force-desktop.qmedia-desktop-X`
in `question-media.css` (~78 mirror rules).

### `display: contents` on `.qmedia-content`

In the preview shell, `.qmedia-content` has `display: contents !important`,
making `.qmedia-header` and `.qmedia-answer` direct flex children of
`.qmedia-layout`. This is why qmedia-layout's `align-items` / `gap` /
`justify-content` apply directly to header/answer. Don't add box-affecting
properties to `.qmedia-content` in the shell — they have no effect.

## Question progress

`TestPlayer.tsx` shows progress in the bottom navigation as `current / total`
between Back and Next. The question card itself does not render a number badge;
keep progress chrome outside the question content so media/wallpaper layouts
stay clean. Builder preview cards also omit the badge.

## Question transitions (animation)

`TestPlayer.tsx` uses framer-motion `<AnimatePresence mode="wait">` with
direction-aware variants (`cardSlideVariants`). Going Next slides the
new question up from below, going Back slides it down from above. The
direction is tracked via `navDirection` state; all `setIdx` callsites
funnel through `goToIdx()` which sets the direction.

## Webpack mode

Dev script is `next dev --webpack` (set in `package.json`). The test
builder's module graph is large enough that Turbopack hits intermittent
chunk-load races (`ERR_CONTENT_LENGTH_MISMATCH`) on rapid edits. Webpack
HMR is slower (~1.5s vs <500ms) but stable.
