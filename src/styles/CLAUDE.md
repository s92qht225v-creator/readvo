# CSS Reference

All styles live in `src/styles/reading.css` **EXCEPT**:

- **Test builder / player answer-type styling** lives in
  `src/components/test/tq-options.css` under `--<type>-*` device
  tokens. See `src/components/test/TOKENS.md` for the full reference.
  Do NOT add `.test-*` answer-type rules to `reading.css` — they're
  parallel chains that will get out of sync.
- `reading.css` still owns the test player **frame chrome**
  (`.test-preview-shell--{mobile,desktop}`, the `@media (max-width:640px)`
  card chrome) but those rules don't touch any answer-type internals.
  Scroll-mode coexistence: several card-mode rules are deliberately
  **split** so they apply only to non-scroll cards, letting scroll
  items inherit the shared chrome but override conflicting
  declarations via specificity alone (no `!important` escalation):
  - `.test-preview-shell--{desktop,mobile} .test-player__card:not(.test-scroll__item)
    { height; overflow-y }` — preview shell pins card-mode card height
    + internal scroll; scroll items aren't pinned (grow with content).
  - `.test-player__card:not(.test-scroll__item) { display: block !important }`
    in test-player.css mobile @media — card-mode mobile keeps block
    layout; scroll items use `display: flex` from their own rule.
  - `min-height: auto !important` was REMOVED from the mobile
    `.test-player__card` rule (redundant — the desktop min-height is
    `@media (min-width: 641px)`-scoped, never applied on mobile
    anyway). Removal lets mobile scroll items set their own
    viewport-tall min-height.
  See `src/components/test/CLAUDE.md` → "Scroll mode" for full reasoning.
  Card mode behaviour is byte-for-byte unchanged.

## Key CSS Classes

### Home & Banner
- `.home` - Home/book/language page container (matches `.page` width, no top padding, `background: #f5f5f5`)
- `.home__hero` - Full-width red banner (`background: #dc2626`, `width: 100vw`, `transform: translateX(-50%)`, `z-index: 10`)
- `.home__hero-inner` - Banner content wrapper (constrained `max-width` matching `.home`, `display: flex; flex-direction: column` so tabs push to bottom via `margin-top: auto`)
- `.home__hero-top-row` - Flex row: logo, language selectors, hamburger menu (`min-height: 66px` for consistent banner height across all pages)
- `.home__hero-logo-img` - White logo (`height: 80px`, mobile: `64px`). Uses `/logo.svg` (white text)
- `.home__lang-selectors` - Flex container for language dropdowns (`gap: clamp(24px, 5vw, 48px)`)
- `.home__lang-selector` - Dropdown column (`position: relative`, `align-items: flex-start` for left-aligned labels/buttons)
- `.home__lang-select-btn` - Dropdown trigger button (transparent, white text, `min-height: 44px`, `padding: 8px 0`)
- `.home__lang-dropdown` - Custom dropdown menu (`position: absolute`, `top: 100%`, centered, `border-radius: 8px`, `max-width: calc(100vw - 32px)` to prevent viewport clipping)

### Hamburger Menu
- `.home__menu` - Hamburger menu wrapper (`position: relative`). Shared via `BannerMenu.tsx` component.
- `.home__menu-btn` - Hamburger button (`44px`, `border-radius: 8px`, semi-transparent white on red banner)
- `.home__menu-dropdown` - Right-aligned dropdown (`position: absolute`, `right: 0`, white bg, shadow, `min-width: 180px`)
- `.home__menu-section-label` - Section label in menu (uppercase grey, e.g., "Til", "Язык", "Language")
- `.home__menu-lang-row` - Flex row for language selector (`gap: 6px`, `padding: 6px 16px 10px`)
- `.home__menu-lang-select` - Native `<select>` dropdown for 3-language selection (O'zbekcha / Русский / English). No custom CSS class in reading.css — uses browser-default `<select>` styling.
- `.home__menu-lang-btn` / `--active` - Language buttons (used for 中文 target language link, `flex: 1`, active = red `#dc2626` bg)
- `.home__menu-item` - Menu item button (`min-height: 44px`, full-width, hover `#f5f5f5`)
- `.home__menu-user` - User info display (name + email, non-clickable, `#f9f9f9` bg)
- `.home__menu-divider` - Thin separator line (`1px solid #e5e5e5`)

### Tabs & Cards
- `.lang-page__tabs` - Folder tabs container inside banner (`display: flex`, `gap: 4px`, `margin-top: auto` pushes tabs flush to banner bottom)
- `.lang-page__tab` - Folder tab button (`border-radius: 3px 3px 0 0`, `background: rgba(255,255,255,0.35)`, `color: #fff`, no hover/transition, `-webkit-tap-highlight-color: transparent`)
- `.lang-page__tab--active` - Active tab (`background: #f5f5f5`, `color: #dc2626`, `margin-bottom: -2px`). Also has inline `style` override in LanguagePage.tsx for reliable mobile rendering.
- `.lang-page__books` - Responsive grid for cards (`clamp()` sizing, stacks on mobile ≤600px)
- `.lang-page__book-card` / `--disabled` - Level card with optional "Tez kunda" badge
- `.lang-page__book-level` - Big red text (`clamp(1.8rem, 4vw, 2.5rem)`, `color: #dc2626`)
- `.lang-page__book-level-label` - "HSK" prefix inside level (same size/color, `font-size: 1em`)
- `.lang-page__book-pinyin` - Pinyin on karaoke cards (blue italic)
- `.lang-page__book-subtitle` - Grey subtitle text
- `.lang-page__placeholder` - Centered placeholder for empty tabs
- `.lesson-card` - Lesson card on book page (number badge 36px/8px radius + translation, no Chinese title/pinyin)

### Reader
- `.reader__home-logo` - Logo image in reader headers (64px height). Uses `/logo-red.svg` (`#dc2626`) on grey reader headers, `/logo.svg` (white) on karaoke
- `.page` - Lesson content container (permanent `1em` extra top/bottom padding for translation panel space)
- `.page__translation-panel` - Fixed translation panel below header (z-index 99)
- `.page__audio-fab` - Floating play button (48x48, red circle, `bottom: 80px`, `right: 24px`, `z-index: 80`). All play FABs (lesson, story, flashcard) share same size/position.
- `.page__audio-fab--playing` - Stays red (`var(--color-accent)`) when audio playing
- `.reader__header` - Fixed header (full-width, grey background `rgba(245, 245, 245, 0.97)`)
- `.reader__header-inner` - Header content (constrained to match page width)
- `.reader__bottom-nav` - Fixed bottom nav (full-width, grey background `rgba(245, 245, 245, 0.97)`)
- `.reader__bottom-nav-inner` - Bottom nav content (constrained to match page width)
- `.reader__nav-toggles` - Pinyin/Tarjima toggle button container in bottom nav
- `.reader__nav-toggle` / `--active` - Toggle buttons (`border-radius: 4px`, active = blue bg)
- `.sentence--has-audio` - `cursor: pointer` on tappable audio sentences
- `.sentence--playing .sentence__text` - Blue text color for currently playing sentence

### Flashcards
- `.flashcard-page` - Flashcard page container
- `.flashcard__card` - 3D flip card (`transform-style: preserve-3d`, `aspect-ratio: 3/4`)
- `.flashcard__face` - Card face (`backface-visibility: hidden`)
- `.flashcard__front-content` - Centers Chinese + audio + pinyin vertically on front
- `.flashcard__audio-btn` - Circular audio play button on card front

### Story Reader
- `.story` - Story content container (independent from `.page`, own max-width/padding)
- `.story--with-panel` - Extra top padding when translation panel is visible
- `.story--with-audio` - Extra bottom padding when audio bar is visible
- `.story__sentence` - Clickable sentence span (cursor pointer)
- `.story__sentence--active` - Blue color for tapped/active sentence
- `.story__sentence--playing` - Blue color for audio-synced sentence
- `.story__translation-panel` - Fixed translation panel below header (z-index 99)
- `.story__bottom-bar` - Fixed bottom toggle bar (grey bg, backdrop blur, z-index 90)
- `.story__bottom-bar-inner` - Flex container for toggle buttons (Tarjima, Fokus, Pinyin)
- `.story__play-fab` - Floating action button (56px blue circle, above bottom bar). Normal mode only: play/pause full-story audio.
- `.story__focus` - Focus mode container (flex column, centered, `gap: 16px`)
- `.story__focus-text` - Centered sentence text (`font-size: 1.5em`, `min-height: 35vh`, `justify-content: center`)
- `.story__focus-nav` - Button row: prev, play, next (flex, centered, gap 16px)
- `.story__focus-nav-btn` - Prev/next buttons (48px grey circle, no border, SVG chevrons)
- `.story__focus-play-btn` - Inline play/pause button (44px blue circle, toggles ▶/⏸)
- `.story__focus-counter` - Sentence counter label below nav ("9 / 30"). `font-size: 13px` (absolute px, deliberately NOT em, so A+/A- font control doesn't scale it)
- `.story__word` - Pressable word span (cursor pointer, border-radius 2px)
- `.story__word--active` - Blue background highlight for pressed word
- `.story__word-hsk` - HSK level/lesson badge in translation panel (small pill-shaped tag)
- `.story__paragraph--dialogue` - Dialogue mode paragraph (flex column, gap 0.5em)
- `.story__dialogue-line` - Single dialogue line (flex row: speaker + text, cursor pointer)
- `.story__speaker` - Speaker label (bold, blue, min-width 2.5em, `::after` adds `：`)
- `.story__dialogue-text` - Dialogue text container (flex: 1, ruby pinyin with blue color)
- `.story__focus-speaker` - Speaker label in focus mode (bold, blue, smaller font above sentence)
- `.story--focus .story__sentence:not(.story__sentence--active)` - Dimmed non-active sentences (opacity 0.35)

### Dialogue Reader (DialogueReader)
Speaker turns are white cards with a coloured left strip — the old `A:` / `B:` `.dr-line-speaker` labels were removed; colour alone identifies the speaker (every strip is on the left).
- `.dr-lines` - Turn list (flex column)
- `.dr-line` - One turn: white card, `border-left: 3px solid var(--dr-speaker, #378add)`, `border-radius: 0 8px 8px 0`, `box-shadow`, `margin-bottom: 14px`, `padding: 8px 12px`, `cursor: pointer`
- `.dr-line--spa` / `--spb` / `--spc` - Speaker hue via `--dr-speaker`: `#dc2626` (red, A) / `#378add` (blue, B) / `#ef9f27` (amber, C). Colour only — the strip stays on the left for all speakers
- `.dr-line-chars` - Char row (flex wrap, `column-gap: 0.18em`; collapses to `0` when pinyin hidden via `:not(:has(.dr-char-py))`)
- `.dr-char-py` - Per-char progressive pinyin (`font-size: 0.69em`, `color: #dc2626`, `margin-bottom: 4px`)
- `.dr-char-py--empty` - `visibility: hidden` placeholder (component fills it with a non-breaking space so below-level words still reserve the pinyin-row height, keeping line heights even)

### Dictation (`.dr-dict__*`)
Pinyin-syllable / hanzi dictation keyboard. Base tile `.dr-dict__tile` (`min-width: 46px`, `height: 50px`, `font-size: 24px`).
- `.dr-dict__tile--py` - Pinyin syllable key (`min-width: 52px`, `height: 58px`, `font-size: 21px`, `padding: 0 18px`)
- `.dr-dict__tile--back` - Backspace key (`min-width: 88px`; height NOT set — inherits its row: 58px on the syllable board, 50px on the char board)
- `.dr-dict__tile.dr-dict__tile--used` - Used key dims in place (`opacity: 0.3`, grey bg; double class beats `:disabled`)
- `.dr-dict__answer--text` - Pinyin answer line, one compact text field (`font-size: 23px`)
- `.dr-dict__answer--han` - Character answer line (`font-size: 28px`, `letter-spacing: 1px`) — answer reads larger than the keys feeding it

### My Vocabulary (VocabularyReview, `.vr-*`)
Saved-word flip-card review deck at `/chinese/vocabulary`.
- `.dr-flip__save` / `--done` - Save "+"/"✓" button on dialogue Words-tab flip cards (34px circle, red `#dc2626` border/text; `--done` fills red bg with white ✓ to match theme). Replaces the old audio btn
- `.vocab-review` - Page container (`max-width: 900px`, centered)
- `.vr-header` / `.vr-title` / `.vr-back` - Header row, title, back button (40px)
- `.vr-deck` / `.vr-counter` - Deck column + "n / N" counter
- `.vr-card` - Flip card, **square** (`aspect-ratio: 1/1`, `max-width: 380px`, `perspective: 1200px`)
- `.vr-card--flipped .vr-card__inner` - `rotateY(180deg)` flip; `.vr-card__inner` holds preserve-3d transform
- `.vr-card__face` - Both faces (absolute, `backface-visibility: hidden`, white, `border-radius: 16px`, centered flex). `.vr-card__back` = `rotateY(180deg)` (no separate `__front` class — the front is the untransformed face)
- `.vr-card__py` / `.vr-card__zh` / `.vr-card__meaning` / `.vr-card__hint` - Front centres the 字 (`__zh` 52px) with pinyin (`__py`) absolutely floated above it (red italic); `__meaning` (26px) on the back; `__hint` tap hint pinned bottom
- `.vr-controls` / `.vr-nav` - Prev/next control row + 52px circular nav buttons (`:disabled` → dim)
- `.vr-remove` - Remove-word pill (red text, `border-radius: 999px`)
- `.vr-empty` / `.vr-cta` / `.vr-spinner` - Empty state, red CTA link, loading spinner

### Section Cards
- `.section--objectives .section__sentences` - Single white card container (border-radius 16px, shadow)
- `.section--objectives .sentence__text` - Red accent strip via `border-left: 6px solid #C43A35` + `padding-left: 16px`
- `.section--objectives .sentence__translation-inline` - Aligned to Chinese text (`padding-left: 22px`)
- `.section--text .section__context` - Floating white card with shadow for context narration
- `.section--text .section__context-translation` - Divider above translation + flex layout for inline play button
- `.section__audio-btn--inline` - Play button positioned inline at end of context translation text
- `.section--exercise .section__sentences` - White floating card (border-radius 16px, shadow)
- `.section--exercise .section__instruction-row` - Indented (`padding-left: var(--spacing-md)`) to align with card content
- `.section__instruction-checkbox` - Blue ■ with `flex-start` alignment and `margin-top: 0.1em` to align with Chinese text
- `.section--tonguetwister` - Transparent background, no header/subheading
- `.section--tonguetwister .section__sentences` - White floating card (border-radius 16px, shadow, padding 20px)

### Footer & Correction
- `.home__footer` - Shared footer (`text-align: center`, `padding: var(--spacing-sm) var(--spacing-lg)`, `padding-bottom: calc(80px + var(--spacing-sm) + env(safe-area-inset-bottom))` to clear fixed bottom bars)
- `.correction-inline` - Wrapper for correction button/form (`margin-bottom: 12px`)
- `.correction-inline__btn` - Trigger button (`inline-flex`, border pill, muted grey, pencil icon + text)
- `.correction-inline__form` - Expandable form (`max-width: 340px`, centered)
- `.correction-inline__select` - Reason dropdown (full width, 6 options)
- `.correction-inline__textarea` - Optional message input (max 500 chars)
- `.correction-inline__submit` - Red submit button (`background: #dc2626`)
- `.correction-inline__success` - Green checkmark + "Yuborildi!" confirmation

### Hanzi Writing Practice
- `.hanzi-home` — flex column, gap 16px, max-width 480px, margin auto, padding 24px
- `.hanzi-home__stats-row` — flex row, gap 12px
- `.hanzi-home__stat-card` — white card, shadow, border `#f0f0f0`, flex column center, padding 16px, flex 1
- `.hanzi-home__stat-value` — 28px bold red (`#dc2626`)
- `.hanzi-home__stat-label` — 12px `#888`
- `.hanzi-home__start-btn` — red gradient (`#dc2626 → #b91c1c`), white text, full width, min-height 52px, border-radius 8px
- `.hanzi-home__start-btn:disabled` — grey bg
- `.hanzi-home__nothing-due` — centered text in white card
- `.hanzi-home__reset-btn` — tiny, text-decoration underline, color `#ccc`, no bg
- `.hanzi-done` — flex column center, gap 16px, text-align center, padding 40px 24px
- `.hanzi-done__title` — 22px bold
- `.hanzi-done__stats` — 14px `#888`
- `.hanzi-done__restart-btn` — red gradient, same as start btn
- `.hanzi-practice` — padding 24px, max-width 900px, margin auto
- `.hanzi-practice__session-progress` — centered, 13px, color `#aaa`, margin-bottom 16px
- `.hanzi-practice__layout` — flex row, gap 40px; `@media ≤768px` flex-column, align-items center
- `.hanzi-practice__canvas-panel` — flex-shrink 0, flex column, gap 12px, align-items center
- `.hanzi-practice__grid-wrapper` — position relative (wraps `HanziCanvas`)
- `.hanzi-practice__action-btn` — white bg, border `#e0e0e0`, border-radius 6px, padding 8px 20px, min-height 36px; hover: border `#dc2626`, color `#dc2626`
- `.hanzi-practice__info-panel` — flex column, gap 12px, padding-top 20px, flex 1
- `.hanzi-practice__char-display` — font-size 96px, font-weight 300, line-height 1, color `#1a1a1a`
- `.hanzi-practice__pinyin` — 24px, color `#999`, italic
- `.hanzi-practice__meaning` — 18px, color `#555`
- `.hanzi-practice__stroke-count` — 14px, color `#aaa`
- `.hanzi-practice__grade-btns` — flex row, gap 12px, margin-top 8px
- `.hanzi-practice__grade-btn` — min-height 48px, font-size 16px, font-weight 700, border-radius 8px, flex 1
- `.hanzi-practice__grade-btn--forgot` — `background: #fee2e2; color: #dc2626; border: none`
- `.hanzi-practice__grade-btn--gotit` — green gradient (`#16a34a → #15803d`), white text, border none

### Karaoke
- `.karaoke` - Light-themed container (`background: #f5f5f5`, flex column, `max-width: 900px`)
- `.karaoke__lyrics` - Scrollable lyrics area (`flex: 1`, `overflow-y: auto`, `padding: 48px 0`, `padding-bottom: 220px`)
- `.karaoke__line` - Centered line (`font-size: 1.8em`, `line-height: 2`, `color: rgba(0,0,0,0.2)`)
- `.karaoke__line--active` - Darker text for current line (`rgba(0,0,0,0.55)`)
- `.karaoke__line--past` - Faded for past lines (`rgba(0,0,0,0.12)`)
- `.karaoke__char` - Ruby element per character (`margin: 0 0.08em` for spacing)
- `.karaoke__char--singing` - Gold color (`#ffd54f`) with text shadow glow for currently singing character
- `.karaoke__char--sung` - Green color (`#66bb6a`) for already sung characters in active line
- `.karaoke__rt` - Pinyin annotation (`font-size: 0.5em`, italic, `color: rgba(0,0,0,0.3)`)
- `.karaoke__rt--hidden` - `visibility: hidden` (toggle pinyin without layout shift)
- `.karaoke__controls` - Fixed controls panel (above bottom bar, z-index 91, border-top)
- `.karaoke__controls::after` - Separator line pseudo-element (`bottom: 3px`)
- `.karaoke__progress` - Clickable seek bar (4px height, `margin-top: 20px`)
- `.karaoke__progress-bar` - Blue fill bar (`#4fc3f7`)
- `.karaoke__playback-row` - Flex row for skip/play buttons (centered, gap 24px)
- `.karaoke__play-btn` - Play/pause button (56px blue circle)
- `.karaoke__skip-btn` - Rewind/forward 15s button (44px, transparent bg, circular arrow icon)
- `.karaoke__skip-label` - "15" text overlay on skip buttons (8px, absolute centered)
- `.karaoke .story__translation-panel` - Sticky below hero (`position: sticky; top: 0; margin-bottom: -45px`) — no layout shift
- `.dr-font-controls` - Fixed right pill (`position: fixed; right: 16px; top: 58%`). Transparent + `opacity: 0.35` by default; on hover: `opacity: 1`, white bg, box-shadow
- `.dr-font-btn` - Font size button (40×44px, transparent bg, `color: #555`)
- `.dr-font-divider` - Divider between A+/A- (transparent by default, `#e5e5e5` on hover)

## Padding
- Page side padding: `var(--spacing-xl)` (32px)
- Header inner padding: `var(--spacing-md) var(--spacing-xl)` (16px 32px)
- Bottom nav inner padding: `var(--spacing-md) var(--spacing-xl)` (16px 32px)

## Mobile Responsive (≤600px)
- **Page background**: `#f5f5f5` (grey) so white cards stand out
- **Touch targets**: All interactive buttons have `min-height: 44px` (`.page__toggle-btn`, `.page__lang-btn`, `.page__font-btn`, `.reader__nav-toggle`, `.reader__nav-btn`, `.home__lang-select-btn`, `.home__lang-dropdown-item`, `.lang-page__tab`)
- **Side padding**: `.home` uses `padding: 0 12px var(--spacing-lg)` at ≤600px (reduced from 32px)
- **Banner inner**: `.home__hero-inner` uses `padding: 12px 12px 0` at ≤600px
- **Hero override at ≤480px**: `.home__hero` uses `padding: 0` to avoid doubled padding with hero-inner
- **Tabs**: `flex: 1` for equal width, `justify-content: center`, `font-size: 1rem`, `gap: 3px`, `min-height: 36px`
- **Banner logo**: 64px height at ≤600px (desktop: 80px)
- **Reader header logo**: 64px height
- **Landing nav logo**: 64px height
- **Language selector labels**: `font-size: 0.85rem` at ≤600px
- **Language selectors gap**: 16px at ≤600px (down from `clamp(24px, 5vw, 48px)`)
- **Card border radius**: 8px at ≤600px
- **Story reader**: `padding-left/right: var(--spacing-md)` at ≤600px
- **Dropdown close**: Both `mousedown` and `touchstart` listeners for iOS Safari compatibility

## Reader Button Sizes (NEVER change without asking user)
These sizes apply across ALL reader pages (lessons, stories, dialogues, karaoke):
- `.reader__nav-toggle`: `padding: 4px 12px; min-height: 32px` (Pinyin/Tarjima/Fokus toggles)
- `.page__lang-btn`: `padding: 4px 10px; min-height: 32px; background: #dc2626; color: #fff` (3-way language cycle toggle UZ→RU→EN→UZ, shows next language label: RU/EN/UZ, red with white text, no hover change)
- `.page__font-btn`: `padding: 4px 8px; min-height: 32px` (A-/A+ font size buttons)
- Karaoke inherits these base sizes (no karaoke-specific size overrides needed)
