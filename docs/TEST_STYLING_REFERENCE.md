# Test Styling Reference

This is the working reference for the test builder preview and public test player.
Use it before changing layout, spacing, typography, media, answer boxes, navigation,
or theme behavior.

## Files To Check First

- `src/components/test/TestPlayer.tsx` - public test runtime, nav, question card wrapper, navigator modal.
- `src/components/test/QuestionRenderer.tsx` - per-question answer UI.
- `src/components/test/QuestionMediaBlock.tsx` - media/audio wrapper and layout class names.
- `src/components/test/test-player.css` - public player type widths, answer boxes, theme overrides.
- `src/components/test/question-media.css` - image/audio layout rules for mobile/desktop.
- `src/components/test/test-builder-preview.css` - builder preview-only overrides.
- `src/styles/reading.css` - preview shell frame overrides for `/test-app/t/[slug]?preview=1`.

## Rendering Surfaces

There are three separate surfaces. Do not assume one CSS rule fixes all three.

| Surface | URL / component | Main CSS |
| --- | --- | --- |
| Builder center preview | `/test-app/dashboard/[id]/edit` | `test-builder-preview.css`, `question-media.css` |
| Public test player | `/test-app/t/[slug]` | `test-player.css`, `question-media.css` |
| Preview shell | `/test-app/t/[slug]?preview=1` | `reading.css`, `test-player.css`, `question-media.css` |

## Breakpoints And Frames

- Mobile layout switches at `<= 599px`.
- Desktop layout applies at `>= 600px`.
- Builder desktop canvas target: `1120 x 620`.
- Builder mobile canvas target: `427 x 760`.
- Public desktop card target in preview shell: `1120 x 620`.
- Public mobile card target in preview shell: `372 x 663`.

## Card Rules

- Public desktop card has a thin outline for consistency:
  `border: 1px solid #e4ded8`, `border-radius: 7px`.
- Mobile card also uses `border-radius: 7px`.
- Welcome/end screen cards must use the same frame language as question cards.
  In the live player, `.test-player-screen__card` is full-width up to the
  public desktop max (`1120px`) with the same border, `7px` radius, and shadow.
  In the desktop preview shell, it is forced to the same frame as question cards:
  `1120 x 620px`.
- Mobile welcome/end screen cards keep the phone-frame size in the preview shell:
  `372 x 663px`.
- Most inner answer/media radii are theme-controlled by
  `--test-theme-answer-radius`; default is `1px`.
- Navigation buttons use `border-radius: 3px`.
- `Questions` and `Next` buttons should remain visually equal width.
- Question number badge was removed from the card; progress appears in nav as `current / total`.

## Welcome / End Screen Rules

Welcome and end screens use the same frame language as question cards and should
not drift into a separate visual system.

### Welcome Screen Settings

- Do not show an `Image or video` URL field on the welcome/end screen settings.
- Welcome screen respondent collection is controlled by explicit toggles:
  - `Name`
  - `Last name`
  - `Phone number`
  - `Email`
- If any respondent field is enabled, show a `Fields position` segmented control:
  - `Left`
  - `Right`
- Default respondent field position is `Right`.
- The old single `Your name (optional)` field should not appear when a custom
  welcome screen is enabled. It only exists as a legacy fallback for tests
  without a configured welcome screen.

### Welcome Screen Layout

- Desktop with respondent fields uses a two-column layout:
  - one column for title, description, start button, and time-to-complete
  - one column for respondent fields
- If `collectorLayout` is `left`, fields render on the left and intro info moves
  to the right.
- If `collectorLayout` is `right`, intro info stays left and fields render right.
- Mobile always stacks intro info and fields in one column to preserve the phone
  canvas width.
- Respondent fields use normal inputs with the same form language as settings:
  `border: 1px solid #ded8d1`, `border-radius: 8px`, white background.

### Time To Complete

- Welcome screen time-to-complete uses the shared alarm clock SVG icon, not a
  text glyph like `◷`.
- The icon and text are inline-flex aligned:
  `display: inline-flex; align-items: center; gap: 6px`.
- The setting label remains `Time to complete`; the value field can use text
  like `Takes X minutes`.

### Response Storage

- Current DB schema stores respondent identity in `test_responses.respondent_name`.
- The public player combines enabled respondent info into a compact label before
  submission.
- If separate columns are added later, update both:
  - `src/lib/test/types.ts`
  - `src/app/api/t/[slug]/responses/route.ts`

## No-Media Desktop Cards

No-media questions do not render `.qmedia-layout`; `QuestionMediaLayout` returns
`qmedia-header` and `qmedia-answer` directly.

Therefore vertical centering must target:

```css
.test-player__card--no-media {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

Do not rely on `.test-player__card--no-media > .qmedia-layout` for no-media
questions, because that wrapper does not exist.

If content overflows, the card remains scrollable with hidden scrollbars.

## Media Layouts

### Mobile

- `stack` - text, media, answers in one column.
- `float` - compact media near text.
- `split` - image is full width at the top with no top/left/right gap.
- `wallpaper` was removed/disabled for normal selection because it created too
  many edge cases with background movement, stretching, and nav overlap.
- Audio questions only allow mobile layouts that make sense for audio; image-only
  layouts should be unavailable/greyed out for audio.

### Desktop

- `float-right` - content left, image right.
- `float-left` - image left, content right.
- `split-right` - content left, full-height image right.
- `split-left` - full-height image left, content right.
- `wallpaper` - background media with content overlaid.

Desktop `float-left` should mirror `float-right`; `split-left` should mirror
`split-right`.

## Desktop Symmetry Rules

For desktop cards with media:

- Outer gutters must be symmetrical.
- Content column width should visually match media column width where possible.
- Question title, description, and answer boxes should align to the same column.
- Answer boxes should generally match the available content column width.
- Do not center content by adding unequal padding to one side.
- For split layouts, the media should fill its half of the card.

For desktop cards without media:

- Content should be vertically centered in the outlined card.
- Answer boxes can be full-width across the card when there is no media.
- Opinion scale can be one long row when no media is present.

## Mobile Spacing Rules

- Main content column target: `303px`.
- Card content horizontal padding target: `26px`.
- Choice row target:
  - width: `303px`
  - height: `37px`
  - padding: `6px 10px`
  - radius: theme radius/default `1px` unless explicitly using Typeform-style mobile row radius
  - background: light answer tint
- Choice key badge:
  - `20 x 20px`
  - radius `4px`
  - font size `12px`
  - weight `600`
- Long answer text must wrap inside the answer box; no horizontal overflow.
- When there are many answers, the card scrolls vertically and hides the scrollbar.

## Hidden Scrollbars

Scrollable cards should hide scrollbars:

```css
overflow-y: auto;
scrollbar-width: none;
-ms-overflow-style: none;
```

```css
::-webkit-scrollbar {
  display: none;
}
```

## Typography

- Font: Inter for the test app.
- Question titles should not be bold by default.
- Desktop title is larger and responsive via CSS variables in `test-player.css`.
- Mobile title target:
  - `20px`
  - line-height `26px`
  - font-weight `400`
- Description:
  - italic where appropriate
  - same spacing behavior whether description exists or not; do not let missing
    description create awkward jumps.

## Answer Type Rules

### Multiple Choice / True-False / Checkbox / Ordering

- Answer rows should share consistent width, height, background, and radius.
- Selected state should show clear outline/fill.
- Long labels must truncate or wrap according to context, never overflow.

### Match

- Desktop no-media match uses two columns side by side.
- Left and right boxes must have equal height and aligned rows.
- Mobile match boxes use full answer width.

### Dropdown / Number / Short / Long Answer

- With media on desktop, width should match other media answer boxes.
- Without media on desktop, width can stretch to the full content/card column.
- Inputs should not auto-focus in the public player; users should read first,
  then tap to open keyboard.

### Custom Dropdown

Dropdown questions use a custom menu, not a native `<select>`.

Renderer:

- `src/components/test/QuestionRenderer.tsx`
- Component: `CustomDropdownAnswer`
- Root classes: `test-dropdown-answer test-custom-dropdown`
- Trigger: `test-custom-dropdown__trigger`
- Menu: `test-custom-dropdown__menu`
- Option: `test-custom-dropdown__option`

Required behavior:

- Corner radius is `3px` on the trigger and menu.
- Chevron uses the shared Typeform-style down icon:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M7.116 10.847a1.25 1.25 0 0 0 1.768 0L12.78 6.95a.75.75 0 0 0-1.06-1.06L8 9.61 4.28 5.89a.75.75 0 0 0-1.06 1.06z"/></svg>
```

- Menu opens with a short scale/fade animation (`test-dropdown-open`).
- Menu closes on outside click and `Escape`.
- Selected option uses the answer/theme color with white text.
- Trigger width follows the same rules as other answer boxes:
  - media desktop layouts: match the media answer column width
  - no-media desktop: stretch to the card/content width
  - mobile: match the standard mobile answer width

Styling locations:

- `src/components/test/test-player.css` - base custom dropdown styles and animation.
- `src/components/test/question-media.css` - qmedia/theme-specific dropdown overrides.
- `src/components/test/test-builder-preview.css` - builder preview overrides.
- `src/styles/reading.css` - public preview shell overrides.

Do not style custom dropdowns only with `.test-dropdown-answer`; that class is
shared with older native dropdown/input sizing rules. Always include
`.test-custom-dropdown` or child classes when targeting the custom menu.

### Rating

- Stars must be clickable.
- Unselected stars are outline.
- Selected stars render filled yellow: `#f59e0b`.
- Theme answer color must not override selected yellow stars.

### Opinion Scale

- With media: two-row layout is acceptable to avoid cramped columns.
- Without media: use one row when there is enough desktop width.
- Number must be centered horizontally and vertically inside each box.
- Low/High labels align to scale edges.

### Fill Blanks

- Blank boxes match answer length where possible.
- Blank radius default: `1px`.
- Blank has underline/bottom border like the answer input style.

## Theme Rules

- Theme colors are applied through CSS variables:
  - `--test-theme-background`
  - `--test-theme-question`
  - `--test-theme-answer`
  - `--test-theme-button`
  - `--test-theme-button-text`
  - `--test-theme-answer-radius`
- Theme final passes in `question-media.css`, `test-player.css`, and
  `test-builder-preview.css` can override inline styles.
- When a selected state must ignore theme color, add a more specific rule after
  the final theme pass.

Example:

```css
.qmedia-layout.qmedia-layout .test-rating button[data-selected="true"] {
  color: #f59e0b !important;
}
```

## Timer And Logo

- Logo and timer should sit at a fixed visual height independent of question
  content height.
- If logo is aligned right, timer should move left to avoid overlap.
- Timer should not consume vertical space inside the question content.

## Navigation

- Public mobile nav is fixed at the bottom.
- The test content must scroll high enough so the last answer is not blocked.
- The bottom nav contains:
  - `Questions`
  - `current / total`
  - `Next` / `Submit`
- `Questions` opens the question navigator modal.
- Navigator modal contains separate blocks:
  - time remaining
  - scrollable fixed-width question number grid
  - full-width finish test button

## Common Gotchas

- No-media questions do not have `.qmedia-layout`.
- Builder preview and public preview are different surfaces.
- `?preview=1` has additional frame rules in `reading.css`.
- Theme CSS often overrides inline styles because it uses final `!important` passes.
- `safe center` may fall back to top alignment; use `center` only when overflow is
  acceptable and card scroll handles the content.
- Mobile wallpaper/background media can jitter on real mobile browsers when tied
  to viewport height or URL bar collapse.
- Do not fix one layout by using broad selectors that affect mobile and desktop
  at the same time. Split rules by:
  - media vs no media
  - mobile vs desktop
  - builder preview vs public player vs preview shell
  - question type where needed

## Verification Checklist

For any styling change, verify at least:

- Builder desktop preview.
- Builder mobile preview.
- Public desktop player.
- Public mobile player.
- Public preview shell if the URL has `?preview=1`.
- A question with media and a question without media.
- Multiple choice, match, rating, opinion scale, dropdown, short/long answer if
  the change touches shared answer styles.
