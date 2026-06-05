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
├── MathText.tsx            Renders text with inline `$…$` / block `$$…$$`
│                           LaTeX via KaTeX. Used for prompts, descriptions,
│                           and choice labels. See "Math rendering" below.
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
│   ├── MatchRenderer.tsx    MatchPlayer (2-col pairing).
│   ├── OrderingRenderer.tsx OrderingPlayer + SortableOrderingRow (dnd-kit).
│   ├── FillBlanksRenderer.tsx FillBlanksPlayer + blankInputWidth.
│   └── ScrambleRenderer.tsx ScramblePlayer.
├── media/                  Media-editing modals + helpers, extracted from
│                           SettingsPanel.tsx.
│   ├── _helpers.ts          getQuestionMedia, setQuestionMedia,
│   │                        normalizeDesktopLayout (used by both
│   │                        SettingsPanel and the modals).
│   ├── _styles.ts           Modal styles shared between gallery + settings.
│   ├── LayoutIcons.tsx      All 12 SVG icons + DeviceIconFrame +
│   │                        LayoutIcon dispatcher.
│   ├── MediaGalleryModal.tsx  Upload / paste-URL / "My gallery" (reuse
│   │                          previously-uploaded media; GalleryTab
│   │                          fetches GET /api/tests/media/list).
│   └── MediaSettingsModal.tsx Crop, aspect ratio, rotate, flip.
├── testList/               Helpers extracted from TestList.tsx.
│   ├── styles.ts, icons.tsx, TemplateCard.tsx, formatDate.ts
├── tq-options.css          **Single source of truth for every answer-type's
│                           dimensional + theming CSS.** Token system keyed off
│                           `[data-test-device="mobile|desktop"]` on an ancestor.
│                           See `TOKENS.md` for the per-type reference.
├── test-player.css         Card chrome (height, border, scroll), live-player
│                           navigation, wallpaper bg. NO answer-type rules.
├── question-media.css      Audio-player chrome (`.qmedia-audio-player` + sub-
│                           elements). qmedia LAYOUT (mobile-stack/float/
│                           desktop-float-X) is now in `tq-options.css`.
├── test-builder-preview.css Builder canvas card chrome + a few legacy variant-
│                           bridge tokens. NO answer-type rules.
├── builderTypes.ts          BuilderQuestion type used across the builder.
└── questionTypeMeta.ts      Type → { icon, label } registry for the add menu.
```

Other test-app files outside this folder:

```
src/lib/test/
├── quota.ts               Free-tier published cap + enforcement helpers.
│                          See "Free-tier quota" section below.
├── types.ts               BuilderQuestion / PublicQuestion / TestScreenConfig /
│                          Workspace / FREE_WORKSPACE_LIMIT / etc.
├── theme.ts               TestThemeConfig + testThemeCssVars helper.
├── scriptLang.ts          detectScriptLang() — CJK/Arabic content → BCP-47
│                          lang tag. See "Multi-language fonts + RTL".
├── respondentToken.ts     ensureRespondentToken() — ONE canonical per-test
│                          token (localStorage key `blim-test-token:{slug}`)
│                          shared by session-open + submit. See "Per-respondent
│                          sessions".
├── marketplaceCopy.ts     copyMarketplaceTestToBuyer() — duplicates a listing
│                          into the buyer's workspace on admin approval.
├── slug.ts, devAuth.ts, clientFetch.ts, media.ts, grade.ts
└── …
src/app/api/tests/
├── route.ts               GET (list, + per-test response_count + enforce
│                          publish cap) + POST (create draft, accepts
│                          workspace_id)
├── [id]/route.ts          PATCH (edit; accepts workspace_id, is_marketplace,
│                          marketplace_price/summary) + DELETE
├── [id]/publish/route.ts  Enforces the free-tier published cap
├── [id]/duplicate/route.ts Always copies as draft
├── [id]/responses/route.ts Responses for a test
└── media/route.ts         Upload images / audio / video to Supabase Storage
src/app/api/t/[slug]/
├── route.ts               Public GET (sanitized, accepts ?seed=, computes
│                          show_branding)
├── session/route.ts       POST — opens/rejoins a respondent session row with
│                          a shuffle seed
└── responses/route.ts     POST — submit (updates the session row; falls back
                           to insert if the session is missing)
src/app/api/
├── workspaces/route.ts    GET (list) + POST (create, 3-free cap)
├── workspaces/[id]/route.ts PATCH (rename/reorder) + DELETE
├── settings/route.ts      GET + PATCH user_settings (hide_branding,
│                          notify_on_response)
└── marketplace/route.ts   Public GET — lists is_marketplace tests
```

Live-preview shell frame (the phone-frame / desktop frame at `?preview=1`)
lives in **`src/styles/reading.css`** under `.test-preview-shell--{desktop,mobile}`
— card chrome + nav clamps only. Answer-type styling is in `tq-options.css`.

## Token system — read TOKENS.md

Every answer type's dimensional + theming CSS lives in **one file**
(`tq-options.css`) as `--<type>-*` custom properties scoped to
`[data-test-device="mobile|desktop"]`. Each surface (live player,
`?preview=1` shell, builder canvas) sets the attribute on an ancestor;
the same shared rules apply everywhere.

If you need to tweak how an answer type looks, **start in `TOKENS.md`**
to find the right token. Never reach for `test-player.css` /
`test-builder-preview.css` / `reading.css` first; they no longer own
answer-type styles.

## Adding a new question type

Five files, no exception:

1. **`@/lib/test/types.ts`** — add `XOptions` (builder), `PublicXOptions` (player),
   and add the type literal to `BuilderQuestion`/`PublicQuestion` unions.
2. **`settings/XSettings.tsx`** — the right-rail editor. Imports primitives from
   `./_shared`. Pattern: cast `q.options as XOptions`, render inputs, call
   `onChange({ ...q, options: { ...opts, ... } })`.
3. **`SettingsPanel.tsx`** — add `import { XSettings } from './settings/XSettings'`
   at the top, and one line to the dispatch block (around line 56-68):
   `{q.type === 'x' && <XSettings q={q} onChange={onChange} ... />}`
4. **`QuestionRenderer.tsx`** — add an `if (question.type === 'x') { ... }` branch.
   className-driven, no inline dimensional styles. If the JSX is < 30 lines,
   inline it; if it grows, extract to `renderers/XRenderer.tsx`.
5. **`tq-options.css`** — add a `--xx-*` token family (defaults + mobile + desktop
   blocks) and the shared rule block. Theme via `--test-theme-*` vars. See
   `TOKENS.md` for the pattern and existing families.

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

### Mobile production card chrome

`@media (max-width: 640px)` in `reading.css` is the single source for the
real-mobile **card chrome** (everything except answer-type styling, which
is in `tq-options.css`):

- `.test-player`: `align-items: safe center` + `padding: 24px 12px
  calc(132px + safe-area-inset-bottom)` so short content sits visually
  centered in the viewport while long content falls back to flex-start
  and scrolls (no top clipping).
- `.test-player__inner`: `display: block` (no forced 100vh flex-grow).
- `.test-player__card`: chrome-less (no border, no shadow, transparent).
- `.test-player__title`: 18px / 1.3 / -0.2 letter-spacing.
- `.test-player__description`: 15px / 1.4 with `margin: 0` (spacing
  owned by the qmedia flex-gap system in `tq-options.css`).

Answer-type sizing on mobile is owned entirely by the `--<type>-*` token
blocks under `[data-test-device="mobile"]` in `tq-options.css`.

### Defunct: the (0,4,2) mobile match-list clamp

Old `reading.css` had a high-specificity
`html body .test-player .test-player__card.test-player__card--type-match …`
override to defeat `question-media.css` `@container (min-width: 480px)`
rules that widened the match list on phones whose card crossed 480 CSS
px. After the match migration, `question-media.css` no longer widens
`.test-match-list`; the device-token width comes from `--tq-column`
which is `min(100%, 480px)` on mobile regardless of container size.
The clamp has been removed.

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
- **Rating**: selected stars only change colour (gold `#f59e0b`);
  unselected stays grey `#6b7177`. Owned by `--or-*` rule in
  `tq-options.css`.
- **Opinion scale**: connected segmented control — a single
  non-wrapping row on every device (`.test-opinion-scale__scale` =
  flex `nowrap`, one outer rounded accent border, buttons
  `flex: 1 1 0` with 1px accent dividers, `overflow: hidden` to clip
  cells to the corners). An 11-point scale shrinks each cell to fit
  rather than wrapping. Selected cell = solid `--test-theme-question`
  fill + white number. Min/max anchor labels (`__labels`) sit BELOW
  the row. The old `--os-btn-basis` / `--os-btn-grow` / `--os-row-gap`
  tokens are now unused (kept defined; cleanup is optional).
- **Ordering drag**: a `restrictToVerticalAxis` modifier on
  `DndContext` zeros out the x component of the dnd-kit transform,
  so rows can only be dragged up/down — no horizontal fling off the
  side of the screen on mobile. Drag state is exposed via
  `data-dragging="true"` on `.test-ordering-row`; CSS branches on
  the attribute for the border/opacity/shadow visuals.
- **Match**: 2-column grid layout (`.test-match-list`) regardless
  of device — left items and right items always side-by-side. Tap a
  left item, then tap its match on the right (or vice versa); badge
  numbers the pair.
- **Fill blanks**: passage flows inline with `.test-fill-blank-input`
  elements interpolated where blanks live. Input width is
  content-driven (set inline by `blankInputWidth()` from typed or
  expected length); everything else owned by `--fb-*` tokens.
  - **Width sizing gotcha:** the input is `box-sizing: border-box` with
    `0.45em` side padding, and the inline width is `calc(Nch + 0.9em)` —
    so the `+0.9em` cancels the padding and the text area is ≈`Nch`.
    Since `ch` = width of `0` and proportional letters (m, w) are wider,
    `blankInputWidth` adds **~2 chars of slack** (floor 5, cap 30) so
    wide words like "name" + the caret don't clip. It grows with typed
    length too.
  - Text is **`text-align: center`** in the input.
  - The input sets `autoCapitalize="none" autoCorrect="off"
    autoComplete="off" spellCheck={false}` so mobile keyboards don't
    auto-capitalize the first letter or silently alter answers.
- **Dropdown**: `CustomDropdownAnswer` (a button-triggered custom popup,
  not a native `<select>`). Option label is the **first** flex child so
  it aligns with the trigger's "Select an answer" text (both share the
  same left padding); the selection ✓ (`.test-custom-dropdown__check`)
  sits at the **right** edge via `margin-left: auto` so it never indents
  the label. Owned by `--dd-*` tokens.
- **Picture choice**: flex-wrap, N-per-row driven by the
  `--pic-basis` device token — **2-up on mobile, 5-up on desktop**
  (`.test-picture-option` is `flex: 1 1 var(--pic-basis)`). `flex-grow`
  makes a partial row stretch to fill the full width (a desktop row of
  4 → 4 equal full-width columns; 6+ wrap into rows of 5). Pure
  token-driven — no inline column override, no JS counting. Selected
  card uses inset 2px accent ring + 16% tint (no layout-shifting
  border). Image cell `aspect-ratio: 1/1` with dashed accent border
  when empty, solid + background-image when set.

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

All mobile answer-type rules read `--tq-column` (set to `min(100%, 480px)`
in the mobile token block) and apply `margin-inline: auto`. The 480px
cap was deliberately wider than the old 303px so phones use most of
the available card width; centered horizontally via the auto margin so
left/right gaps from the card edge match.

If you need a narrower column for a specific answer type, override its
own token (e.g. `--os-max-w: 361px` for opinion-scale) — don't
introduce a new mobile-only width variable.

### `data-test-device` replaces `force-mobile/desktop` for answer types

Answer-type widths/sizes are no longer gated on `@container (min-width: 480px)`
+ `:not(.test-player__card--force-mobile)`. The token system reads
`[data-test-device="mobile|desktop"]` set on `.test-player` (live +
preview shell) and `.tb-preview-card` (builder canvas). One attribute,
one set of tokens, no surface drift.

The `.test-player__card--force-desktop` / `--force-mobile` modifiers
still exist for non-token chrome (e.g. card height, wallpaper bg) but
the qmedia layout itself reads device tokens via
`[data-test-device="desktop"] .qmedia-layout`.

### `display: contents` on `.qmedia-content`

Mobile makes `.qmedia-content` `display: contents` so `.qmedia-header`
and `.qmedia-answer` become direct flex children of `.qmedia-layout` —
this lets the order tokens (header=1, asset=2, answer=3 by default;
asset=1 for `qmedia-mobile-float`) reorder them as siblings, and the
flex `gap` applies directly between header→asset and asset→answer.

Desktop uses a real `.qmedia-content` flex column (with its own `gap`)
inside a 2-column grid that places asset and content side-by-side.

Audio media (`qmedia-audio`) flattens `.qmedia-content` on every device
so the audio player can sit between description and answer via flex
order tokens regardless of device.

The no-media path (`.qmedia-layout.qmedia-no-media`) overrides the
desktop 2-column grid to flex-column + `overflow: visible` so tall
answer content isn't clipped.

## Welcome screen

The welcome screen (shown before the first question when
`test.welcome_screen?.enabled === true`) lives in `TestPlayer.tsx`
under the `phase === 'intro'` branch and is mirrored in
`TestBuilder.tsx`'s `ScreenPreviewCanvas` for builder canvas preview.

### Layout (with collector fields)

Vertical stack inside the content column:
1. Title (from `welcome_screen.title` or `test.title`)
2. Description
3. Collector fields (Name / Last name / Phone / Email — toggled
   individually in settings; placeholders label them, no per-field
   `<label>` text)
4. Start button (always at the natural bottom of the form)
5. Optional "Takes N minutes" line

Field inputs use `aria-label={field.label}` so screen readers
announce them.

### Content alignment (desktop only)

The "Content alignment (desktop)" segmented control in welcome
settings (`collectorLayout: 'left' | 'right'`) drives a 50/50 card
split on desktop:

- **Right** (default): content fills the right half; left half holds
  media (or is empty).
- **Left**: content fills the left half; right half holds media (or
  is empty).
- Mobile ignores the setting — content centers, media is hidden.

The split is **always active on desktop** when content alignment is
chosen, even with no media — the empty half stays blank but the
content's position doesn't shift when an image is added or removed.

CSS gates on `data-test-device` (set on the welcome card itself, not
on `.test-player`, because `ScreenWrapper` doesn't include the
`.test-player` ancestor). Selectors:

```css
.test-player-screen__card[data-test-device="desktop"]
  .test-player-screen__card--align-left { … 50/50 split, flex row … }
.test-player-screen__card[data-test-device="mobile"]
  .test-player-screen__media { display: none !important; }
```

### Media

Upload an image via the settings panel "Image" row (4MB max, jpg/
png/gif/webp). Stored in `welcome_screen.imageUrl` and uploaded
via the existing `/api/tests/media` endpoint with
`questionId='welcome-screen'`.

Renders as a `<div className="test-player-screen__media">` with
`backgroundImage` inline (only when imageUrl set). CSS owns the 50%
width + `background-size: cover`. On mobile the element is
`display: none`. Always rendered (even with empty bg) on desktop
when content alignment is set, so layout doesn't shift when the
teacher toggles the image off/on.

The media settings row matches the question-media `MediaControlRow`
visual style — "Image" title + "Added" status + Change text-button +
trash icon when attached; bordered `+` add button when not.

## Free-tier quota

Free accounts can publish **1 test at a time**; drafts are
unlimited. Enforced server-side in
`src/lib/test/quota.ts`:

- `FREE_PUBLISHED_LIMIT = 1`
- `checkPublishQuota(userId, admin, excludeTestId?)` — counts
  `is_published=true` rows owned by the user + checks
  `subscriptions.ends_at > now()`. Returns `isOverLimit`.
- `enforceFreePublishLimit(userId, admin)` — idempotent helper that
  auto-unpublishes oldest extras when an ex-subscriber lands on
  the dashboard with multiple published tests. Most recently
  published one stays live; the rest become drafts (nothing
  deleted). No-op for active subscribers.

Enforcement points:
- `POST /api/tests`: no quota check (drafts unlimited).
- `POST /api/tests/[id]/duplicate`: no quota check (copy is always
  a draft via `is_published: false`).
- `POST /api/tests/[id]/publish`: blocks false→true transitions
  when `checkPublishQuota` reports over-limit; returns 402
  `free_publish_limit_reached`. Uses `excludeTestId` so re-
  publishing the same row never trips the check.
- `GET /api/tests`: calls `enforceFreePublishLimit` before
  returning so the dashboard always reflects the enforced state.

### UI behavior (`TestList.tsx`)

The component fetches `/api/subscription` on mount and stores
`hasActiveSubscription` so:
- **Subscriber**: no free-tier banner; sidebar shows "Pro /
  Unlimited published tests".
- **Free user**: banner reads "Free accounts can publish 1 test at
  a time. Drafts are unlimited." + `{publishedCount} / 1 published`.
  Sidebar shows the same quota track.
- **Loading state** (`hasActiveSubscription === null`): neither
  rendered, so the banner doesn't flash on a subscriber before the
  check returns.

`PaywallNotice` is shown in the builder when a publish attempt
returns 402; messaging tells the user to unpublish the current test
or upgrade.

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

## Math rendering (LaTeX / KaTeX)

`MathText.tsx` renders text containing LaTeX wrapped in `$…$` (inline)
or `$$…$$` (block), via KaTeX. A literal dollar is `\$`. Plain text with
no `$` fast-paths to a bare string. `throwOnError: false` — bad LaTeX
renders red instead of crashing (teachers author by hand).

- `katex/dist/katex.min.css` is imported once in the root
  `src/app/layout.tsx`.
- Wired into: `TestPlayer` prompt + description; `QuestionRenderer`
  choice labels (mc / checkbox / picture / dropdown trigger + menu);
  `TestBuilder` PreviewCanvas prompt + description hint. Builder
  choices inherit it through the shared `QuestionRenderer`.
- A collapsible "Insert math (LaTeX)" cheat-sheet sits under the
  question text field in `SettingsPanel.tsx`.

## Multi-language fonts + RTL

Three things make Russian / Chinese / Japanese / Korean / Arabic render
correctly:

1. **`--test-theme-font-family` is Latin-only.** Do NOT append CJK fonts
   to it — a Chinese-first fallback forces Chinese glyph shapes onto
   Japanese text.
2. **Per-script `lang`.** `detectScriptLang(text)` (in `scriptLang.ts`)
   inspects the content and returns `ko` (Hangul) / `ja` (kana) / `ar`
   (Arabic) / `zh` (Han, default) / undefined. It's set as the `lang`
   attribute on every text-bearing element (prompt, description, choice
   labels, dropdown, text inputs) so the browser picks region-correct
   glyphs via the OpenType `locl` feature. Priority: Hangul > kana >
   Arabic > Han.
3. **`[lang="…"]`-scoped font stacks** in `reading.css` lead each
   language with its correct regional font (PingFang/YaHei for zh,
   Hiragino/Yu Gothic for ja, Apple SD Gothic/Malgun for ko, Noto
   Arabic for ar) after the Latin theme font.

**RTL:** `dir="auto"` is on the same text elements, so each string picks
LTR/RTL from its first strong character — Arabic right-aligns, Latin/CJK
stay LTR, automatically and per-string. No per-test setting.

When adding a new text surface, set BOTH `dir="auto"` and
`lang={detectScriptLang(text)}`.

## Workspaces

Server-backed folders for organizing tests (`test_workspaces` table;
`tests.workspace_id` nullable FK, `on delete set null`). The default
"My workspace" bucket is `workspace_id = null` — NOT a stored row.

- Free tier capped at `FREE_WORKSPACE_LIMIT = 3` (POST returns 402 when
  over; subscribers unlimited).
- `TestList.tsx`: workspace list fetched from `/api/workspaces`; the
  active-folder selection is the only thing in localStorage
  (`blim-test-active-workspace`) — purely a UI convenience.
- `visibleTests` filters by `workspace_id`; sidebar counts are real.
- **Drag-and-drop** (dnd-kit): test rows (`DraggableTestRow`) drag onto
  sidebar workspaces (`WorkspaceDropTarget`, drop id `ws-{id}`). 6px
  activation distance so a click still opens the test. A `DragOverlay`
  renders the floating preview (without it the cursor drags nothing).
- Deleting a workspace moves its tests back to the default bucket (FK
  set null), never deletes them.
- Marketplace buyers pick a target workspace at checkout (threaded via
  `payment_requests.marketplace_workspace_id`).

## Settings tab

`TestList.tsx` → `SettingsPane`. Three cards: Plan (Pro + days left /
Free + upgrade), Branding (the **Hide "Made with Blim"** toggle —
Pro-only), Account (name/email/joined + log out).

- Backed by `user_settings` (user_id PK, `hide_branding`,
  `notify_on_response`), RLS on, service-role only.
- `/api/settings` GET + PATCH (upsert, partial).
- `notify_on_response` column exists but isn't wired to fire yet
  (planned Telegram new-response alert).

## Branding badge ("Made with Blim")

The public test API (`/api/t/[slug]`) sets `show_branding` on the
payload: **true unless the owner is an active subscriber AND has
`user_settings.hide_branding = true`.** Free users always show it;
subscribers see it by default and opt out via the Settings toggle.
`TestPlayer` renders the badge (link to test.blim.uz) at the bottom of
the welcome screen when `test.show_branding`.

## Marketplace

Premade tests flagged `is_marketplace = true` are listed publicly via
`/api/marketplace`. The dashboard "Marketplace" tab (`MarketplacePane`
in `TestList.tsx`) shows the catalog; a buyer uploads a payment
screenshot (`MarketplaceBuyModal` → `/api/payment` with
`kind='marketplace_test'`, `marketplaceTestId`, optional
`marketplaceWorkspaceId`). On admin approval (`/api/admin`),
`copyMarketplaceTestToBuyer` duplicates the source test into the
buyer's workspace as a draft and links it back via
`payment_requests.marketplace_copy_test_id`. Listing flags
(`is_marketplace`, `marketplace_price`, `marketplace_summary`) are set
from the builder's `MarketplaceTogglePopover`. Currently single-vendor
(admin-curated); a two-sided teacher marketplace is a deferred phase 2.

## Per-respondent sessions + shuffle seed

True per-respondent randomization (not the old stable-per-question
shuffle):

- On load, the player page POSTs `/api/t/[slug]/session` with the
  respondent token → server inserts a `test_responses` row with a
  random `seed` (and `started_at`), returns `{ response_id, seed }`.
  Existing in-flight sessions for the same token are reused (stable
  shuffle across reloads).
- The test is then fetched as `/api/t/[slug]?seed=…`; `sanitizeQuestion`
  seeds choice/tile shuffles with `${q.id}:…:${seed}` — different per
  respondent, identical across that respondent's reloads.
- On submit, the player sends `response_id`; the responses route
  UPDATEs that row (preserving the seed↔answers tie). If the session
  row is missing it falls back to INSERT — a missing session never
  strands a respondent. A completed session returns 409 (duplicate).
- **Token gotcha:** session-open and submit MUST use the same
  respondent token. Both import `ensureRespondentToken` from
  `lib/test/respondentToken.ts` (key `blim-test-token:{slug}`). A
  mismatch causes `session_not_found`.
- The session POST is **idempotent** (reuses the in-flight row for the
  same token) and now also returns **`started_at`** — used for the
  server-anchored timer below. The page always calls it (rather than
  trusting the cached session) to get the authoritative `started_at`,
  falling back to the cached session only if the network call fails.

## Refresh resilience — answer autosave + server-anchored timer

An accidental page refresh used to wipe all answers and reset the
timer (the latter also let a respondent reload for more time). Both are
fixed; all of this is **live-attempt only** — preview/builder surfaces
(`forceDevice` set) skip it.

**Answer autosave (`TestPlayer`, localStorage).**
- `answersStorageKey` = `blim-test-answers:{responseId}` (falls back to
  `blim-test-answers:{slug}:{respondentToken}` if no responseId).
- A progress blob `{ answers, name, profile, started }` is autosaved on
  every change and restored once on mount (`restoredRef` guards the
  one-time restore). On resume it skips the welcome screen if `started`
  was true, dropping the respondent straight back where they were.
- The autosave effect won't run until after the restore pass and skips
  the empty pre-start state, so it never clobbers a fresh restore.
- Cleared on a successful submit (alongside the existing
  `blim-test-session-{slug}` marker) so a completed attempt doesn't
  linger or 409 on reload.

**Server-anchored timer.**
- The countdown is derived in an effect from `sessionStartedAt`
  (threaded from the page) + `time_limit_seconds`:
  `timerEndsAt = new Date(sessionStartedAt).getTime() + limit*1000`.
  On refresh it recomputes the SAME end time, so the clock continues
  from where it was and a reload can't reset it.
- `startQuestions()` no longer stamps the timer — it only flips the
  phase. This also fixed a pre-existing bug where tests with **no
  welcome screen** never started their timer (startQuestions, the only
  place that used to stamp it, was never called on that path).
- **Behaviour note:** the timer starts when the test is **opened** (the
  session row is created on page load), not when the student clicks
  "Start". This is the standard cheat-resistant exam behaviour; the
  welcome screen already shows the time limit. If start-on-Start-click
  is ever wanted, persist the start moment at Start time instead.

**Leave-page guard.** A native `beforeunload` prompt is armed while a
live attempt is in the question phase with ≥1 answer entered, to prevent
most accidental reloads in the first place.

## Required-question submit guard

**Navigation never blocks on required questions** — Next, Enter, the
text-field Enter (`onSubmit`), and navigator jumps all advance freely
regardless of whether the current required question is answered. The
`canAdvance` memo still exists but is used ONLY to decide whether to
render the per-question "required" note, not to disable Next. (This
replaced the old behaviour where Next was disabled on a blank required
question, which got users stuck mid-test.)

Validation happens ONLY at the finish path:

- `firstMissingRequiredIdx` is computed across ALL questions.
- `attemptSubmit()` (bottom Submit on the last question, Enter on the
  last question, navigator "Finish") is the single validator. If a
  required question is blank it jumps to the FIRST missing one and sets
  the persistent `submitAttempted` flag (instead of letting the server
  400 `missing_required`).
- While `submitAttempted` is true, EVERY unanswered required question
  shows its "This question is required …" note as the user navigates to
  it — card mode renders the `requiredWarnBar` under the current card
  (`submitAttempted && !canAdvance && q.required`); scroll mode renders
  `scrollItemWarnText` inline under each unanswered required item
  (`submitAttempted` is threaded into `ScrollBody`). The note clears
  per-question the moment it's answered, and `submitAttempted` resets on
  a clean submit.
- Timer auto-submit bypasses the guard entirely (time's up → send what
  exists).

Scroll mode's `navigatorFinish` arms the same `submitAttempted` flag and
scrolls to the first missing required item (via `centreInViewport`).

## Welcome / end screen auto-enable

Adding the FIRST question to a test auto-enables both the welcome and
end screens with defaults (`TestBuilder.addQuestion`, gated on
`questions.length === 0`). The welcome content alignment drives the
desktop 50/50 split unconditionally (even with no fields / no media).
A disabled welcome screen skips the intro entirely (player auto-advances
`intro → question`); a disabled end screen still shows a minimal
"Submitted" acknowledgement.

## Scroll mode (`tests.layout = 'scroll'`)

Tests have a `layout` field — `'card'` (default, Typeform-style one
question per screen) or `'scroll'` (IELTS / SurveyMonkey-style: every
question stacked on one scrollable page, with the currently-focused
one lit and the rest dimmed). Card mode is the baseline; scroll mode
is an alternate **presentation shell** over the same shared core
(QuestionRenderer, grading, submission, required-guard, randomization).

### Data

- `tests.layout text not null default 'card'` (`'card' | 'scroll'`).
- `tests.listening_audio_url text` — optional continuous audio track
  for listening exams. Independent of layout — works in both card and
  scroll modes via the shared `ListeningAudioBar`.
- Both columns: `add column if not exists … default 'card'`. Migration
  applied via Supabase MCP; safe additive change.
- Public API (`/api/t/[slug]`) returns `layout` (defaulting to `'card'`)
  and `listening_audio_url ?? null` on `PublicTest`.
- PATCH `/api/tests/[id]` accepts `layout: 'card' | 'scroll'` and
  `listening_audio_url: string | null` (1000-char cap).

### Player (`TestPlayer.tsx`)

`TestPlayer` branches on `test.layout` AFTER the shared intro/done/error
phase handling but BEFORE the card return:

```tsx
const audioActive = !!test.listening_audio_url && phase === 'question';
const listeningBar = audioActive
  ? <ListeningAudioBar url={test.listening_audio_url!} />
  : null;

if (test.layout === 'scroll') {
  return (
    <>
      {listeningBar}
      <ScrollBody … />
      {navigatorOpen ? <NavigatorOverlay … /> : null}
    </>
  );
}

return (
  <>
    {listeningBar}
    <Wrapper …>
      {/* card-mode AnimatePresence card */}
    </Wrapper>
    {navigatorOpen ? <NavigatorOverlay … /> : null}
  </>
);
```

- `ListeningAudioBar` is **layout-independent** — mounted at the
  top-level fragment of both branches when an audio URL is set.
  Position: `fixed; top: 0; z-index: 50`. Tries to autoplay on mount
  (works after the Start click on the welcome screen; browsers block
  autoplay otherwise — the native controls let students press play).
- `NavigatorOverlay` is the **shared question navigator** lifted out
  of the card return. Both modes mount it from the same JSX with
  layout-specific `onGoTo` / `onFinish` callbacks.

### `ScrollBody`

Props receive everything from `TestPlayer`:

- `test, device, themeVars, answers, onAnswer (id-addressed), onSubmit
  (= navigatorFinish), onOpenNavigator (= setNavigatorOpen(true)),
  activeId, setActiveId, activeIdx, phase, total, audioActive`.
- `activeId / setActiveId / activeIdx` are LIFTED to `TestPlayer` so
  the shared navigator can highlight the current scroll question and
  the footer can show "i / total".

Render structure:

```
.test-scroll (data-test-device, themeVars on shell)
└── .test-scroll__list (max-width 1120, centered)
    ├── section.test-player__card.test-scroll__item.test-player__card--has-media|--no-media[--active|--dim]
    │   └── QuestionMediaLayout (header h2 + answer QuestionRenderer)
    └── … (one section per question)
.test-scroll__footer (fixed bottom)
└── Questions button | i/total | Submit
```

Each scroll item **wears `test-player__card`** (plus `--has-media` /
`--no-media`) — see "CSS rule split" below.

### Focus tracking (which question is "active")

1. **IntersectionObserver** observes every `[data-qid]` section with
   `rootMargin: '-45% 0px -45% 0px'` (a thin band around the viewport
   centre). The topmost question whose section is inside the band
   becomes `scrollActiveId`.
2. **Edge guard** — a `scroll` listener pins `scrollActiveId` to the
   first or last question when the page is within 140px of the top or
   bottom. The IntersectionObserver's centre band misses those
   extremes; without the guard the first/last never highlight.
3. **`onFocusCapture`** on each item also promotes it to active when
   the user clicks/tabs into a field — so the lit ring follows
   intent, not just scroll position.

### CSS rule split — scroll items reuse `.test-player__card` chrome

The fundamental simplification: **a scroll item IS a card**. It wears
`test-player__card` so every card-mode rule across surfaces applies
automatically:

- `.test-player__card` in `test-player.css` — desktop chrome (border,
  shadow, background, min-height, scrollbar styling).
- `@media (max-width: 640px) .test-player__card { transparent, no
  border, padding 0 }` in `test-player.css` — mobile chrome strip.
- `.test-preview-shell--desktop .test-player__card` — preview shell
  desktop sizing (width 1120, min-height 620, border).
- `.test-preview-shell--mobile .test-player__card` — preview shell
  mobile sizing (width 372, min-height 663, padding 30 26 152).

`.test-scroll__item` carries ONLY the scroll-specific bits: focus dim
opacity, transitions, `scroll-margin-top: 96px` (clears the listening
bar when the navigator scrolls to a card).

### No-`!important` cascade strategy

All scroll-mode rules win the cascade via specificity alone — **no
scroll-specific declaration uses `!important`**. Achieved through a
deliberate three-part rewrite of the existing card-mode rules:

**1. `:not(.test-scroll__item)` splits** — where card-mode rules
need to keep their `!important` for card-mode reasons (chrome strip
that beats inline styles, etc), the conflicting declarations were
moved into a `:not(.test-scroll__item)` variant so scroll items
simply don't match them:

- `@media (max-width: 640px) .test-player__card:not(.test-scroll__item)
  { display: block !important }` in `test-player.css` — keeps mobile
  card-mode cards as block, lets scroll items use `display: flex`
  from their own rule.
- `.test-preview-shell--desktop .test-player__card:not(.test-scroll__item)
  { height: 620px !important; overflow-y: auto !important }` in
  `reading.css` — preview shell desktop card-mode keeps its pinned
  height + internal scroll; scroll items skip the pinning.
- `.test-preview-shell--mobile .test-player__card:not(.test-scroll__item)
  { height: 663px !important; overflow-y: auto !important }` — same
  for preview shell mobile.

**2. Removed `!important` from base** declarations that nothing
external was fighting:

- `.test-player__card { height: min(620px, …); overflow-y: auto }` in
  `test-player.css` desktop @media — `!important` dropped from
  `height` and `overflow-y` so the scroll override wins on combined-
  class specificity (0,2,0 > 0,1,0).
- `min-height: min(620px, …) !important` stays as the canonical
  floor — consumed by card mode (gets pinned to it via `height`) and
  scroll mode (uses it as a floor; cards grow above it with content).

**3. Removed redundant defensive `!important`** that was forcing
mobile scroll items to have no min-height:

- `@media (max-width: 640px) .test-player__card { min-height: auto
  !important }` in `reading.css` — removed entirely. Defensive
  declaration: the desktop min-height rule on `.test-player__card` is
  scoped to `@media (min-width: 641px)` and never applies on mobile
  anyway, so `min-height` was already `auto` without the override.
  Without it, mobile scroll items can set their own
  viewport-tall min-height.

### Scroll-item overrides — what `.test-player__card.test-scroll__item`
declares

With the cascade cleanups above in place, two card-mode declarations
get overridden by the scroll combined-class selector cleanly (0,2,0
beats 0,1,0, no `!important` needed):

```css
.test-player__card.test-scroll__item {
  height: auto;          /* card grows with content (was 620 pinned) */
  overflow-y: visible;   /* page scrolls; no wheel-trap inside card */
  display: flex;         /* enables qmedia flex chain (desktop) + safe-center (mobile) */
  flex-direction: column;
}
```

### Flex chain for media items (desktop only)

With `height: auto`, the qmedia grid's `min-height: 100%` resolves to
0 against the now-min-height-only parent — so the image column stays
natural height and content pins to the top of a tall card on desktop.
Fix (DESKTOP ONLY — see mobile note below):

```css
.test-player__card.test-scroll__item {
  display: flex;
  flex-direction: column;
}
@media (min-width: 641px) {
  .test-player__card.test-scroll__item > .qmedia-layout:not(.qmedia-no-media) {
    flex: 1;        /* grow to fill card; no min-height: 0 (avoid clipping tall media) */
  }
}
```

- `flex: 1` (desktop) lets short qmedia stretch to fill the card so
  the grid's `align-items: center` vertically centres the content
  column.
- **NO `min-height: 0`** — that allows shrinking below content and the
  qmedia grid's `overflow: hidden` then crops the bottom of tall
  media (portrait videos). Without it, qmedia respects its content
  height and pushes the scroll card to grow taller instead of cropping.
- `:not(.qmedia-no-media)` — no-media items keep the existing
  `.test-player__card--no-media { justify-content: center }` rule
  doing their centring.
- **Mobile NOT included** — mobile qmedia is a plain flex-column
  stack with no internal `align-items: center` (per CLAUDE.md
  "viewport architecture" → `display: contents` on `.qmedia-content`),
  so stretching it just leaves content pinned to its top and defeats
  the scroll item's own `justify-content: safe center`. On mobile,
  qmedia stays at natural height so the item's flex centring can
  position it correctly.

### First / last card centring in viewport (desktop)

Card mode centres its single card via flex on `.test-player`. Scroll
mode can't (multiple cards can't all flex-centre), so equivalent CSS
padding on the list/shell — `(viewport − card_height) / 2` minus a
small 48 px lift so the card sits slightly above geometric centre
(preferred resting position):

```css
@media (min-width: 641px) {
  .test-scroll__list {
    padding-top: max(24px, calc((100vh - min(620px, 100vh - 136px)) / 2 - 48px));
  }
  .test-scroll {
    padding-bottom: max(96px, calc((100vh - min(620px, 100vh - 136px)) / 2 + 48px));
  }
}
```

Floors protect short viewports + preserve fixed-footer clearance
(96 px). Last-card padding-bottom is `+ 48` (not `− 48`) because on
the scroll-bottom rest position more padding-bottom = card visually
higher in viewport.

### Mobile scroll items — per-item viewport-tall

On mobile, card mode gives each question the full viewport via
`.test-player { min-height: 100vh; align-items: safe center }` in
reading.css. Scroll items mirror that **per item**:

```css
@media (max-width: 640px) {
  .test-scroll {
    padding-bottom: calc(96px + env(safe-area-inset-bottom));
  }
  .test-scroll__list {
    /* 24px horizontal padding mirrors card mode's `.test-player {
       padding: 24px 24px … }`. The `.test-player__card` mobile
       chrome-strip zeroes the card's own padding, so without list
       padding scroll items would touch the screen edges. */
    padding-left: 24px;
    padding-right: 24px;
    gap: 12px;
  }
  .test-scroll__item {
    min-height: calc(100vh - 24px - 96px - env(safe-area-inset-bottom));
    justify-content: safe center;
  }
}
```

`display: flex; flex-direction: column` is already on the
all-viewports `.test-player__card.test-scroll__item` rule. With qmedia
NOT stretched on mobile (see above), the item's `safe center` actually
centres the qmedia content block in the viewport-tall box. `safe`
falls back to `flex-start` when content overflows so tall questions
aren't clipped at the top.

### Navigator (shared with card mode)

`NavigatorOverlay` is a single component rendered from both layout
branches:

- Card mode: `currentIdx = idx`, `onGoTo = goToIdx`, `onFinish =
  attemptSubmit`.
- Scroll mode: `currentIdx = scrollActiveIdx`, `onGoTo = navigatorGoTo`
  (smooth-scrolls to `[data-qid=…]` and updates active id), `onFinish
  = navigatorFinish` (scrolls to first missing required if any, else
  submits).

**Visible-region centring** — `scrollIntoView({ block: 'center' })`
centres against the raw 100vh viewport, placing the target visually
low because the fixed footer (~80 px desktop / ~96 px mobile) and the
listening bar (~96 px when on) cover part of the screen. Instead, the
helper `centreInViewport(el)` computes the unobstructed visible region
(`window.innerHeight − topChrome − bottomChrome`), gets the element's
centre via `getBoundingClientRect()`, and `window.scrollTo` by the
delta — so the target lands at the centre of what the user actually
sees.

### Builder (`TestBuilder.tsx`)

Two **separate** toolbar controls, both opening modals next to Timer:

- **Layout** (`<LayoutIcon />`, opens `<LayoutModal>`) — picks `'card'`
  or `'scroll'` via two stacked option cards (`<LayoutOptionCard>`)
  with title + one-line description + radio dot. Highlights when
  layout is scroll.
- **Listening** (`<HeadphonesIcon />`, opens `<ListeningModal>`) —
  uploads / replaces / removes the continuous audio. Works with any
  layout. Highlights when an audio URL is set.

Both update via the existing `updateTest({ layout, listening_audio_url })`
helper. The builder canvas (`PreviewCanvas`) still renders one card at
a time even when the test is in scroll mode — extending the canvas to
preview scroll layout is a future enhancement.

### Files touched

- `src/lib/test/types.ts` — `Test` and `PublicTest` gain `layout` +
  `listening_audio_url` fields.
- `src/app/api/tests/[id]/route.ts` PATCH — accepts new fields with
  validation.
- `src/app/api/t/[slug]/route.ts` GET — returns them in `PublicTest`.
- `src/components/test/TestPlayer.tsx` — branch, `ScrollBody`,
  `ListeningAudioBar`, `NavigatorOverlay` extraction, lifted
  `scrollActiveId`, `navigatorGoTo` / `navigatorFinish`,
  `centreInViewport`.
- `src/components/test/TestBuilder.tsx` — `LayoutModal`, `LayoutOptionCard`,
  `LayoutIcon`, `HeadphonesIcon`, `ListeningModal`, two toolbar buttons.
- `src/components/test/test-player.css` — `.test-scroll*` rules,
  scroll-item override, base `!important` cleanup on `height` and
  `overflow-y`.
- `src/styles/reading.css` — preview shell rules split into
  shared-chrome vs `:not(.test-scroll__item)` height/overflow.

## Sections (stage-b — `test_sections`)

Stage-b adds ordered **sections** that group questions, each with its
own optional continuous audio, plus a per-test forward-only toggle —
for IELTS/HSK-style multi-part listening exams. **Currently the BUILDER
side is fully wired; the PLAYER does not yet render section-by-section
behaviour or switch audio per section** (that's the remaining b3/b3.5
work). A sectionless test behaves exactly like stage (a).

### Data

- Table `test_sections` (`id`, `test_id` FK cascade, `position`,
  `title`, `audio_url`, `created_at`) + `(test_id, position)` index +
  RLS (owner-manages; public reads for published tests). Migration via
  Supabase MCP.
- `test_questions.section_id` — nullable FK, `on delete set null`
  (deleting a section moves its questions back to "unsectioned", never
  destroys them) + index.
- `tests.strict_sections boolean not null default false` — forward-only
  navigation + play-once audio when true. Default false keeps stage-(a)
  tests unchanged.
- Types (`src/lib/test/types.ts`): `TestSection` (builder),
  `PublicSection` (player); `section_id` on `TestQuestion` and
  `PublicQuestion`; `strict_sections` on `Test`/`PublicTest`;
  `sections: PublicSection[]` on `PublicTest`. `BuilderQuestion`
  (`builderTypes.ts`) also carries `section_id`.

### API

- `GET/POST /api/tests/[id]/sections` (list ordered / create — appends
  to end) and `PATCH/DELETE /api/tests/[id]/sections/[sectionId]`
  (update title/audio_url/position / delete). Same `authorize()`
  ownership pattern as the other `tests/[id]/*` routes.
- `PATCH /api/tests/[id]` accepts `strict_sections`.
- `PUT /api/tests/[id]/questions` accepts + stores `section_id` per
  question (full-list replacement; null = unsectioned).
- `GET /api/tests/[id]` (builder) returns ordered `sections`.
- `GET /api/t/[slug]` (player) returns `strict_sections`, ordered
  `sections`, and preserves each `PublicQuestion.section_id` through
  `sanitizeQuestion` (section_id is non-secret metadata).

### Builder (`TestBuilder.tsx`)

- **Left rail `SectionsPanel`** (between the mode dropdown and the
  question list) — renders only when ≥1 section exists or via its
  "+ Add section" button. Per-section row: inline-editable title, audio
  dot, delete (×). Clicking a row sets `activeBlock = { kind: 'section',
  id }` (new `ActiveBlock` variant). Footer carries the **forward-only
  toggle** (writes `strict_sections`) — only shown when sections exist.
- **Right rail `SectionSettingsPanel`** (when a section is active) —
  title input + per-section audio upload (reuses `/api/tests/media`
  tagged `section-{id}`).
- **Question kebab → "Move to section"** — a radio list of sections +
  "No section" with ✓ on the current one. Local state change
  (`moveQuestionToSection`); persisted on the next `saveQuestions` PUT
  (which now sends `section_id`).
- **Listening modal evolves**: when the test has sections, it hides the
  global `listening_audio_url` upload (the player will use per-section
  audio when sections exist) and shows a per-section directory with
  click-to-jump into each section's settings. Sectionless tests keep
  the original single-track upload.
- CRUD helpers `createSection` / `updateSection` (optimistic) /
  `deleteSection` (also nulls the local questions' `section_id`, mirroring
  the FK) / `moveQuestionToSection` hit the routes above and update local
  state so the rail re-renders without a refetch.

### Player (stage-b shipped)

Section-by-section scroll player, per-section audio switching (both
layouts), "Section X of Y" + Next-section, forward-only enforcement when
`strict_sections`, navigator section headers, per-section required-guard
— all built (b3/b3.5/b4).

## Results-by-section (stage-c · `summarizeSectionScores`)

Graded tests with sections show a per-part score breakdown.

- **`summarizeSectionScores(questions, valueByQid, sections)`** in
  `grade.ts` — server-side only (grades against the canonical key, so
  answer keys never reach the client). Counts only **submitted +
  gradable** answers, mirroring the overall score's denominator exactly,
  so the per-section totals always **sum to the overall `score / total`**
  (a skipped optional question is excluded from its section, same as it's
  excluded from the overall — avoids a "3/4 overall vs parts summing to
  3/5" mismatch on the done screen). Returns `[]` for sectionless tests;
  unsectioned answered questions fall into a trailing "Other questions"
  bucket; empty buckets drop; sections ordered by `position`.
- **Student**: `POST /api/t/[slug]/responses` returns `sections:
  SectionScore[]`; `TestPlayer` done screen renders
  `<SectionScoreBreakdown>` under the overall score (graded + sectioned
  only).
- **Teacher**: `GET /api/tests/[id]/responses` computes `section_scores`
  per response from the canonical questions/sections (no migration, no
  keys to client; covers historical responses since nothing is
  persisted). `ResponsesTable` renders them as chips inside each expanded
  response.
- **NO database change** — `section_id` already on questions,
  `is_correct` already on answers; the breakdown is pure compute.

## Play-once audio (stage-c · `play_once_audio`)

Listening audio that can't be scrubbed or replayed, refresh-proof. A
SEPARATE toggle from `strict_sections` (forward-only) — either can be on
without the other.

- **Data**: `tests.play_once_audio boolean default false`;
  `test_responses.consumed_audio text[] default '{}'` — the play-once
  tracks a respondent has already consumed (a section id, or `'global'`
  for the test-level track). Migration `add_play_once_audio`.
- **API**: PATCH `/api/tests/[id]` accepts `play_once_audio`; public GET
  `/api/t/[slug]` returns it; `POST /api/t/[slug]/session` returns
  `consumed_audio`; new `POST /api/t/[slug]/audio-consumed`
  (`{respondent_token, response_id, track_id}`) appends a track —
  idempotent, guarded by response_id+token (the per-respondent secret).
- **Builder**: a "Play audio once" checkbox at the bottom of the
  Listening modal (shown when any audio is set — global or per-section).
- **Player** (`ListeningAudioBar`, gets `playOnce`/`consumed`/`onConsumed`;
  `playOnce = test.play_once_audio && !forceDevice` so preview is never
  locked):
  - **Locked** (consumed snapshot at mount → after a refresh): renders
    "Audio already played", no `<audio>` element, no replay.
  - **Active** (not yet consumed): **status-only** player — plays once,
    straight through. A single ▶ Play button shows only BEFORE playback
    (needed because browsers block silent autoplay); the moment audio
    starts (`onPlay` → `started=true`) the button is gone and only a
    progress bar remains. **No pause** (a `pause` event before the end
    silently resumes — guards OS media keys), **no scrub** (`onSeeking`
    snaps `currentTime` back to the furthest point reached — blocks fwd
    AND rewind via the `Math.abs(...) > 0.4` clamp), **no replay** (locks
    on `ended`, shows "Finished"). Marks the track consumed on FIRST play
    (`onConsumed` → local set + persists via `/audio-consumed`) so a
    refresh re-locks it; the live bar snapshots `consumed` at mount so
    marking-on-play doesn't re-lock the current listen.
  - **Off** (`!playOnce`): unchanged native `<audio controls>` (free
    seek + replay).
  - Track identity = `currentGroup.section.id` / `cardQuestionSection.id`
    / `'global'`; the bar is keyed by `audioKey` so switching sections
    remounts and re-evaluates `consumed` for the new track.
  - `consumedAudio` Set lives in `TestPlayer` (seeded from the session's
    `initialConsumedAudio` prop threaded through the page).
- **Behaviour note**: consumed is marked the moment playback STARTS, so a
  network drop mid-clip means it can't be re-heard — the honest cost of a
  truly refresh-proof "play once" (this was the user's chosen tradeoff).

## Speaking question type (AI rubric-graded, separate score)

A `speaking` question: the student reads/hears the prompt, records an
open-ended spoken reply (any language), and the AI transcribes + scores it
against a teacher-authored **rubric**. **Graded on its own track — the score
is shown SEPARATELY in results, never merged into the objective total.**

### Why "separate track" (no scoring-rollup changes)
`gradeAnswer()` returns `null` for `speaking`, so it's auto-excluded from the
objective total and `summarizeSectionScores` (both already drop `null`).
Speaking results live in their own table, surfaced as their own block. Spec:
`docs/superpowers/specs/2026-05-31-speaking-question-type-design.md`.

### Data
- `SpeakingOptions { rubric: { id, text, weight }[], maxRecordingSeconds }`
  (default 30). Max points = sum of weights. **The rubric is the answer key
  — `sanitizeQuestion` strips it; the public player only gets
  `{ maxRecordingSeconds }`.**
- Table `test_speaking_grades (response_id, question_id, audio_url,
  transcript, score, max_score, detail jsonb, created_at)`, PK
  `(response_id, question_id)` (idempotent). `detail = { criteria:
  [{ id, verdict: full|partial|none, earned, note }], feedback }`. RLS on,
  service-role only.
- Private bucket **`test-recordings`** holds the audio (voice data → never
  public; served via 1h signed URLs in the owner results route).

### Grading — `POST /api/t/[slug]/speaking-grade` (grade-on-record)
Called by the player when the student finishes a recording (anonymous,
respondent-token + response_id gated like `audio-consumed`). Guardrails →
upload audio to `test-recordings` → **standalone transcription** (its own
`gpt-4o-transcribe` call with `response_format: 'json'`, NO language field =
auto-detect — does NOT reuse the Chinese-tuned `whisper.ts`, keeping the live
speaking-practice pipeline untouched) → **`lib/transcribe/rubricJudge.ts`**
(gpt-4o-mini, temp 0, JSON; per-criterion full/partial/none → points;
notes+feedback in the transcript's language via `detectScriptLang`) → upsert
`test_speaking_grades`. Returns `{ ok: true }` only — **never leaks the
score** (exam-style). Idempotent per (response, question).
- **Gotchas (found in testing):** gpt-4o-transcribe only supports
  `response_format: 'json'` (not `text`); and the recording filename
  extension must match the content-type (Chrome→webm, Safari→mp4) or OpenAI
  rejects it — the route derives the ext from `audioFile.type`.

### Player — `renderers/SpeakingRecorder.tsx`
Mic record (MediaRecorder, mimeType selection like `SpeakingMashq`) →
countdown to `maxRecordingSeconds` → stop → upload → background grade → shows
**"✓ Recorded"** (no score). **One attempt** (locks after recording). No
`responseId` (preview/builder) → disabled placeholder. `QuestionRenderer`
gets `slug`/`responseId`/`respondentToken` threaded from `TestPlayer` (both
card + scroll sites; `ScrollBody` also threads `responseId`). Answer value =
`{ recorded: true }`; `hasAnswer` checks it for the required-question guard.

### Builder — `settings/SpeakingSettings.tsx`
Rubric editor (criterion text + weight rows, add/remove) + max-seconds.
**Pro-gate:** `POST /api/tests/[id]/publish` blocks first-publish with a 402
`speaking_requires_pro` if the test has any speaking question and the owner
lacks an active subscription; the builder surfaces it via `PaywallNotice`.

### Results — `ResponsesTable.tsx`
Owner responses route attaches `speaking_grades` per response (with signed
audio URLs). Each speaking question renders a distinct block: audio player +
transcript + per-criterion breakdown (criterion id→text from
`q.options.rubric`) + `earned / max` + feedback. "Grading…" when no row yet.

## Webpack mode

Dev script is `next dev --webpack` (set in `package.json`). The test
builder's module graph is large enough that Turbopack hits intermittent
chunk-load races (`ERR_CONTENT_LENGTH_MISMATCH`) on rapid edits. Webpack
HMR is slower (~1.5s vs <500ms) but stable.

## Question / test feature flags (added later)

- **Optional prompt**: question text is NOT required (builder + `PUT
  .../questions` API). Player renders no `<h2>` for an empty prompt.
- **`options.hidePrompt`** ("Show question text to respondents" toggle,
  default on): keeps the prompt as a builder question-list label but hides
  it from respondents — `sanitizeQuestion` blanks `prompt` when set (the
  player already hides empty prompts); the builder canvas shows a muted
  "hidden" note.
- **`options.columns`** (picture_choice "Images per row", 1–6): **DESKTOP
  ONLY**. QuestionRenderer sets `--pic-cols` + `data-cols`; the rule
  `[data-test-device="desktop"] .test-picture-options[data-cols]` computes
  the exact 1/N `--pic-basis` and turns off flex-grow. Mobile always stays
  at its responsive 2-per-row default.
- **`tests.show_pinyin`** (per-test): Chinese answer choices render pinyin
  stacked above each character. Generated **SERVER-SIDE** in `/api/t/[slug]`
  via `annotatePinyin` (`lib/test/pinyin.ts`, pinyin-pro, word-segmented so
  most polyphonic readings resolve) → `PublicChoice.pinyin[]`; rendered by
  `<PinyinText>` in QuestionRenderer (per-character **flexbox columns, NOT
  `<ruby>`** — precise cross-browser spacing). **Never import pinyin-pro in
  QuestionRenderer / the player** — keep it off the player bundle (route
  server-side + TestBuilder PreviewCanvas client-side only). Covers **both
  answer choices AND the question prompt**: `/api/t/[slug]` annotates the
  sanitized prompt into `PublicQuestion.promptPinyin` (gated on
  `show_pinyin`, uses the sanitized prompt so a hidePrompt question gets
  none); `TestPlayer` (card + scroll) and the builder PreviewCanvas render
  `q.promptPinyin?.length ? <PinyinText> : <MathText>`. (Manual per-choice
  override is still an unbuilt follow-up.)
- **`word_bank` question type** (HSK "banked gap-fill" / reading part 4): a
  single-select type that renders **Question (prompt, with pinyin) → Word bank
  (A–F grid of text cells: letter + word + pinyin) → bare letter answer
  buttons**. Reuses the `PictureChoiceOptions`/`PublicPictureChoiceOptions`
  data shape and the single-select `grade.ts` / `sanitize.ts` branches (added
  alongside `picture_choice`/`image_letters`), so no new grading/pinyin
  plumbing — `attachChoicePinyin` annotates the bank words for free. Distinct
  renderer (`.test-word-bank` + reused `.test-letter-options` buttons),
  distinct settings editor (`settings/WordBankSettings.tsx`, text-only choices
  + mark-correct, **no images/shuffle/multi-select**). No image/video media
  (audio-only, like the other choice-grid types). CSS: `.test-word-bank*` in
  `tq-options.css` (2-col grid both devices, theme-accent tinted cells). The
  bank order is fixed A–F (no shuffle — it's a stable reference).
- **Examples excluded from question numbering**: `realTotal` /
  `displayNumberByIdx` are DISPLAY-only (`total` stays the full array length
  for `isLast` / index bounds). Footer shows "Example" on example pages;
  the navigator omits examples and renumbers real questions 1..N;
  `answeredCount` excludes examples.
- **Audio lock works with `audioMustFinish` alone**: `questionAudioLocked =
  (audioMustFinish || audioPlayOnce) && audioMedia?.url && !done`. No
  on-screen hint banner — Next / Questions navigator just disable while
  locked.
- **Cropped image render** (`croppedImageStyle` in QuestionMediaBlock):
  height % must use the FRAME aspect (`aspectRatioNumeric`), NOT the crop
  rectangle's %-ratio, or a non-square crop leaves a blank gap
  (`object-fit:cover` already prevents distortion). Circle `border-radius`
  is forced by card/preview chrome `!important` rules (test-player.css,
  test-builder-preview.css, reading.css) — beat it in tq-options.css with a
  higher-specificity `.qmedia-asset.qmedia-asset--circle { border-radius:
  50% !important }`.

## Verifying the player on localhost (preview shell gotcha)

- `/test-app/t/[slug]` on localhost wraps `<TestPlayer>` in the **preview
  shell with a forced device** (toolbar "Desktop preview" / "Mobile
  preview" buttons, found via `aria-label`). **Viewport resize does NOT
  flip the device on this route** — click the toolbar button. The real
  production player (no shell) uses `window.innerWidth <= 640`.
- Published tests are viewable on localhost without auth, so per-feature
  checks can set a flag/column via SQL on a real test, verify, then revert.
  The builder/dashboard pages still require Telegram auth.
