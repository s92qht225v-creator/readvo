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
│   ├── MediaGalleryModal.tsx  Upload / paste-URL gallery.
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

## Required-question submit guard

The per-question Next button is gated on `canAdvance` (current question
only). But the navigator lets you jump around + the "Finish the test"
button submits directly — both could reach `submit()` with required
questions blank (server then 400s `missing_required`).

`TestPlayer` computes `firstMissingRequiredIdx` across ALL questions;
`attemptSubmit()` is the single finish path (bottom Submit, Enter,
navigator Finish). If a required question is unanswered it navigates
there and shows an inline alert instead of submitting. Timer
auto-submit bypasses the guard (time's up → send what exists).

## Welcome / end screen auto-enable

Adding the FIRST question to a test auto-enables both the welcome and
end screens with defaults (`TestBuilder.addQuestion`, gated on
`questions.length === 0`). The welcome content alignment drives the
desktop 50/50 split unconditionally (even with no fields / no media).
A disabled welcome screen skips the intro entirely (player auto-advances
`intro → question`); a disabled end screen still shows a minimal
"Submitted" acknowledgement.

## Webpack mode

Dev script is `next dev --webpack` (set in `package.json`). The test
builder's module graph is large enough that Turbopack hits intermittent
chunk-load races (`ERR_CONTENT_LENGTH_MISMATCH`) on rapid edits. Webpack
HMR is slower (~1.5s vs <500ms) but stable.
