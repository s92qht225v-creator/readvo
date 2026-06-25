# Component & Layout Reference

## Key Features

### Toggle Controls
- **Header controls**: Language toggle (3-way cycle: UZ→RU→EN→UZ, button shows current language label), font size (A-/A+)
- **Lesson bottom nav toggles**: Pinyin and Translation (Tarjima) buttons in the center of the fixed bottom navigation bar
- **Story bottom bar toggles**: Three buttons in order: Tarjima, Fokus, Pinyin. Slim fixed bar at bottom (stories don't use lesson bottom nav)
- **Translation panel**: Fixed panel below header showing translation of tapped sentence. Page has permanent extra `1em` top padding to prevent panel from overlapping content (padding does NOT change when panel toggles)
- **Grey backgrounds**: Header, lesson bottom nav, and story bottom bar all use `rgba(245, 245, 245, 0.97)` to distinguish from page content

### Audio Playback
- **Tap-to-play**: Tapping a sentence with `audio_url` auto-plays its audio (no per-sentence play buttons)
- **Playing indicator**: Active sentence text turns blue (`color: var(--color-accent)`) via `.sentence--playing`
- **Cursor**: Sentences with audio show `cursor: pointer` via `.sentence--has-audio`
- Section-level "Play All" button next to instruction text
- **Floating Play FAB**: When the section's "Play All" button scrolls behind the header, a floating action button (48x48, blue circle) appears at bottom-right (`position: fixed`, `bottom: 80px`, `right: 24px`, `z-index: 80`). FAB disappears when the section's sentence content scrolls out of view.
- Instruction row and play button are always visible (independent of translation toggle)
- Loading state with animated spinner (`@keyframes spin`)
- Singleton player (only one audio at a time)
- Audio files stored in Supabase Storage (`/audio/` bucket)

### Textbook Images
- Original textbook scans displayed above dialogue sections
- Images stored in Supabase Storage (`/images/` bucket)
- Left-aligned, max-width 500px
- Section's `image_url` field for Supabase URLs

### Flashcard Practice (spaced repetition)
- **Flashcards tab** (`/chinese/flashcards`, `FlashcardsCatalog.tsx`) now shows **only topic deck cards** (a search box + a "N cards due today" banner). The HSK-level pills, per-lesson HSK decks, and the 汉字↔native direction toggle (`FlashcardModeBar`) were **removed from the tab UI**. The reader routes `/chinese/flashcards/[level]/[lessonId]` and `/chinese/flashcards/mix` still exist but are **unlinked** (orphaned, not in the sitemap).
- `FlashcardDeck.tsx` runs a **spaced-repetition session** via the SM-2 scheduler in `src/lib/srs.ts` (`newCardState` / `schedule` / `isDue`). The session = the user's **due** cards + capped **new** cards (`NEW_PER_SESSION = 20`), built **once on mount** (guarded with `builtRef` so re-renders don't rebuild + wipe the queue).
- **Grading**: three full-width buttons labelled by outcome + live next-interval — **I know** (green, "+N days"), **Easy** (blue, "+M days"), **I don't know** (red, "repeat this session" → re-queued to the back). No swipe. Tap the card to flip (front = 汉字 + pinyin, back = translation); flip is the only animation.
- **Persistence** (server-authoritative): `GET/POST /api/flashcards/reviews` (JWT auth) → Supabase `flashcard_reviews` (`user_id, card_id, ease, interval_days, reps, lapses, due_at, last_grade`, PK `(user_id, card_id)`, RLS service-role-only). `card_id = ${deck.id}:${word.id}`; the POST re-schedules via the shared `srs` lib.
- Pinyin toggle, UZ/RU/EN translations, optional per-card TTS audio. Deck JSON from `content/flashcards/{bookId}.json`; topic decks from `content/flashcards/topics/*.json`.

### Dialogue Reader
- Accessible from Language Page → Matn tab → Dialoglar card → `/chinese/hsk1/dialogues`
- Dialogues are short A/B conversations using vocabulary from the corresponding HSK level
- **Reuses StoryReader component** with `listPath` prop for correct back navigation
- **Dialogue detection**: StoryReader checks if any sentence has a `speaker` field (`isDialogue` flag)
- **Dialogue layout** (when `isDialogue` is true):
  - Each sentence renders as its own block (`.story__dialogue-line`) instead of inline flowing text
  - Speaker label (A/B) in blue on the left (`.story__speaker`) with `：` suffix via CSS `::after`
  - Text on the right (`.story__dialogue-text`)
  - Ruby pinyin with blue color, `padding-bottom: 0.15em` for spacing
- **Focus mode**: Shows speaker label above the sentence text (`.story__focus-speaker`)
- **Stories are unaffected** — the dialogue layout only activates when sentences have `speaker` fields
- Data loaded from `content/dialogues/{bookId}/dialogue{N}.json` via `src/services/dialogues.ts`
- **Tabs**: Dialog · Words (`So'zlar`) · **Dictation** (`Diktant`) · Practice (`Mashq`). The Grammar tab was **replaced by Dictation** (grammar lives in its own top-level Grammar section on the language page).
- **Words tab** (`DialogueVocab.tsx`): a vertical stack of **flip-cards** (one per word). Tap a card → it 3D-rotates to the other side; only one is open at a time (tapping another flips the previous back). A **direction toggle** sits above the stack (segmented pill, `.dr-vocab-dir`): **汉字 → native** (front = pinyin + 字 + 🔊audio, back = meaning) and **native → 汉字** (front = meaning, back = pinyin + 字 + 🔊audio — recall the Chinese, flip to check); switching direction closes any open card. Both faces share one CSS-grid cell (`.dr-flip__face { grid-area: 1/1 }`) so each card sizes to its **taller** face → identical height in both directions. No practice mode, no Know/Don't-know, no examples. Self-contained — NOT the test engine or flashcard-deck flow. Vocab comes from the dialogue's `vocab[]` (whole **words/phrases** — 打电话, 怎么办, 别着急 — never bare characters, so polysemy like 打 is avoided), falling back to auto-extract from per-sentence `words[]`. Per-word audio via `resolveTtsUrl`. **Vocab entry shape**: `{ zh, py, uz, ru, en }`. **Translations now live in the Supabase `glossary` table, not in the dialogue JSONs.** Each dialogue's `vocab[]` is a **reference list** — bare `"汉字"` strings, or `{ zh, py }` for homographs, or `{ zh, py?, uz?, ru?, en? }` to override a gloss for that dialogue's context. The dialogue page resolves refs server-side via `resolveDialogueVocab()` → `resolveVocab()` (`src/services/glossary.ts`, cached under the `glossary` tag) and passes resolved `{ zh, py, uz, ru, en }[]` into `DialogueReader` (unchanged). Edit the words in the admin **Glossary tab** (`/api/admin/glossary`), which `revalidateTag('glossary')`s so edits go live without a deploy. Unresolved refs are dropped → auto-extract fallback from per-sentence `words[]`. **Note:** the HSK 4/6 dialogues still need `vocab[]` reference lists (+ glossary rows) added.
- **Dictation tab** (`DialogueDictation.tsx`, sibling of `DialogueRolePlay`): a listening exercise — Start → hears a line (text hidden, audio via the dialogue's `audioUrl`/`resolveTtsUrl`) → reproduces it → reveals the line (zh + pinyin + translation) → Next → score (`first-try correct / total`). One item per sentence with ≥2 Han chars. **Two input modes** gated by the dialogue `level` prop (passed from `DialogueReader` as `meta.level`):
  - **tiles** (HSK 1–4 default): rebuild by tapping its **Han CHARACTERS** into order (punctuation excluded) → placed tiles can be **dragged to reorder** (dnd-kit sortable, `rectSortingStrategy`; PointerSensor 6px activation + a `draggedRef` guard so a drag doesn't fire the tap-to-remove click) → auto-checks when full (and re-checks after every reorder).
  - **type** (HSK 5/6 default, `level >= 5`): type the line with a Chinese IME → Check → Han-only, trad→simp **lenient exact match** (shared `src/utils/hanziNormalize.ts` — `normalizeHan`/`hanChars`, also strips spaces/punctuation) → wrong attempts render a per-character green/red diff (`.dr-dict__diff-ok/-bad`). A **session-level fallback link** ("⌨️ can't type? arrange instead") toggles to the tile UI and persists across lines (`mode` state, only shown when `level >= 5`; `switchMode` resets the line's answer but keeps the mistake count).
  Both modes share the same two-attempt + `Show answer` reveal + scoring. **Bespoke, self-contained — does NOT use the test engine**; styled with `.dr-dict*` in reading.css. No setState-in-effect (line-init in Start/Next/Restart handlers; the full-tile check runs inside the tap handler, the typed check inside the Check handler).
- **DialoguesPage** (`src/components/DialoguesPage.tsx`): List page with HSK level tabs, same pattern as StoriesPage
- **TTS audio fallback** (dialogues with no recorded `audio_url`, e.g. HSK 2): `resolveTtsUrl` (`utils/ttsAudio.ts`) → MiMo `/api/tts`. DialogueReader prefetches on mount (warms cache so a tap stays in the user gesture for iOS), `playSentence()` uses `audio_url` else TTS, and a sequential "play all" FAB (`handlePlayAll`/`playSeqFrom`) walks sentences when there's no single recording. HSK 1 (has recordings) makes zero TTS calls.

### Story Reader
- Accessible from Language Page → Matn tab → Hikoyalar card → `/chinese/hsk2/stories`
- Stories are graded reading texts using vocabulary from the corresponding HSK level
- **Ruby pinyin**: Each pinyin syllable appears directly above its corresponding Chinese character using HTML `<ruby>/<rt>/<rp>` tags
- **Pinyin-character alignment**: `src/utils/rubyText.ts` splits compound pinyin (e.g., "Jīntiān" → "Jīn" + "tiān") and maps syllables to CJK characters
- **Erhua handling**: Characters like 玩儿 and 点儿 are merged under one ruby element with pinyin "wánr"/"diǎnr". Works in compound words too (e.g., "Yǒudiǎnr" → ["Yǒu", "diǎnr"])
- **Pinyin quote stripping**: `stripPunct()` removes leading `"'"(` and trailing `.,!?:;"""''()` from pinyin tokens before splitting, so quotes in pinyin like `"Jiālǐ` don't get attached to syllables
- **Pinyin toggle stability**: When pinyin is toggled off, `<ruby>` tags remain but `<rt>` gets `visibility: hidden` to prevent layout shift
- **Tap-to-translate**: Tapping a sentence changes its color to blue (`color: var(--color-accent)`) and shows its translation in a fixed panel below the header
- **Translation panel**: Fixed position below header (`z-index: 99`), only visible when a sentence is active and translation toggle is on
- **No inline translations**: Unlike lessons, story translations only appear in the panel (not inline below text)
- **Sentence spacing**: A space character is inserted between adjacent sentence `<span>`s in the same paragraph to prevent quotes/punctuation from visually merging
- **Independent CSS**: Stories use `.story` class (not `.page`), completely independent from lesson page styles
- **Per-sentence audio**: Sentences can have individual `audio_url` fields. Tapping a sentence plays its audio via `useAudioPlayer` singleton. Starting per-sentence audio stops full-story audio and vice versa.
  - Per-sentence URLs: `HSK%201%20stories/{storyNum}/line{N}.mp3`
  - Full-story URL: `HSK%201%20stories/{storyNum}/story.mp3`
- **Bottom toggle bar**: Fixed slim bar at the bottom of the story reader with Pinyin and Tarjima toggle buttons (`.story__bottom-bar`). Stories don't use the lesson bottom nav, so toggles live here instead. Grey background (`rgba(245, 245, 245, 0.97)`) with backdrop blur.
- **Full-story audio FAB** (normal mode only, hidden in focus mode):
  - Play/pause FAB (56px blue circle) at bottom-right, positioned above the bottom toggle bar
  - Toggles between play (▶) and pause (⏸) SVG icons
  - No skip buttons, no progress bar — just a simple play/pause toggle
  - Uses direct `HTMLAudioElement` via `useRef` (not `useAudioPlayer` hook)
- **Audio-text sync**: When sentences have `start`/`end` timestamps (in seconds), the currently playing sentence is automatically highlighted during audio playback
  - `audioSentenceId` is derived via `useMemo` from `currentTime` — finds which sentence's `start ≤ time < end`
  - Audio-synced highlight takes priority over manual tap highlight (`displaySentenceId = audioSentenceId ?? activeSentenceId`)
  - When audio starts playing, manual tap selection is cleared (`setActiveSentenceId(null)`)
  - Translation panel shows the currently playing sentence's translation
  - Timestamps are optional — stories without `start`/`end` work exactly as before (tap-only)
- **One sentence per JSON entry**: Each tappable sentence must be its own entry in the `sentences` array (don't combine two sentences in one `text_original`)
- **Press-and-hold word translation**: Long-press (300ms) on a Chinese word shows its individual pinyin + translation in the translation panel (overrides sentence translation)
  - Word data stored in `words[]` array per sentence with compact format: `{ i: [start, end], p, t, tr, h?, l? }`
  - `i`: character index range in `text_original` (exclusive end), `p`: pinyin, `t`: Uzbek, `tr`: Russian
  - `h`: HSK level (1-6), `l`: lesson number where word's **contextual meaning** was first introduced
  - Translation panel shows: **字** pinyin — translation `[HSK 1]` `[10-dars]` (two separate badge spans)
  - Panel shows regardless of translation toggle when a word is pressed (always useful for learners)
  - Audio pauses during word press, resumes on release
  - Words wrapped in `<span class="story__word">` with `story__word--active` highlight (background, not color)
- **Focus mode**: Shows one sentence at a time, centered. Toggled via Fokus button in bottom bar.
  - Sentence text area has `min-height: 35vh; justify-content: center` to vertically center text on screen
  - Navigation row: ‹ (prev) | ▶/⏸ (play/pause) | › (next) — three symmetric buttons. SVG chevrons for nav, blue circle for play.
  - Counter below nav buttons: "9 / 30" (small centered label)
  - Prev/next navigation auto-plays the target sentence's audio
  - Entering focus mode auto-plays the current (or first) sentence's audio
  - Play button replays/pauses the current sentence's audio (not full-story audio)
  - Full-story audio FAB is hidden in focus mode
  - Entering focus mode stops any playing full-story audio
  - CSS: `.story__focus-nav-btn` (48px grey circle, no border), `.story__focus-play-btn` (44px blue circle)
- Data loaded from `content/stories/{bookId}/{storyN}.json` via `src/services/stories.ts`

### Karaoke Player
- Accessible from Language Page → KTV tab → song card → `/chinese/hsk1/karaoke/[songId]`
- Per-character synced lyrics with timestamp-based highlighting (characters light up as they're sung)
- **Light theme**: Page uses `#f5f5f5` background with red hero banner. Text colors are `rgba(0,0,0,...)`.
- **Ruby pinyin**: Each character gets `<ruby>/<rt>/<rp>` pinyin annotation. Pinyin uses `0.5em` font size, italic, `rgba(0,0,0,0.3)`. Punctuation characters skip pinyin automatically.
- **Character spacing**: `margin: 0 0.08em` on each `ruby` element for visual separation between characters
- **Pinyin toggle**: Hides pinyin via `visibility: hidden` on `<rt>` (no layout shift)
- **Tap-to-translate**: Tapping a lyrics line shows its translation in the panel (like stories). Tapping again deselects. Audio-synced line (`audioLineIdx`) takes priority over tapped line (`tappedLineIdx`). Tapped selection is cleared when audio starts playing.
- **No focus mode**: Karaoke doesn't need focus mode — per-character sync and auto-scroll already provide the focused experience.
- **Translation panel**: Reuses `story__translation-panel` (`position: sticky; top: 0; margin-bottom: -45px`). Shows active line's UZ/RU translation (from audio sync or tap). The negative margin prevents lyrics from shifting when panel appears/disappears.
- **Character highlight states**:
  - Default: `rgba(0, 0, 0, 0.2)` (dimmed)
  - Active line: `rgba(0, 0, 0, 0.55)` (darker)
  - Past lines: `rgba(0, 0, 0, 0.12)` (faded)
  - Currently singing character: `#ffd54f` (gold) with text shadow glow
  - Already sung character (active line): `#66bb6a` (green)
- **No CSS transitions on lines**: `.karaoke__line` has no `transition` property — instant color changes prevent flickering when active line changes (transitions caused visible flicker between states)
- **Auto-scroll**: Active line auto-scrolls to center via `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- **Font size**: Adjustable via A-/A+ floating pill (`.dr-font-controls`, fixed right at `top: 58%`). Transparent + faded by default, visible on hover. Lyrics container uses inline `fontSize` percentage. Line font size uses `em` (not `rem`) to inherit from parent.
- **Audio system**: Direct `HTMLAudioElement` via `useRef`. Lazy-loaded (`preload: 'none'`), src set on first play. `requestAnimationFrame` loop for smooth time tracking.
- **Controls panel** (fixed, above bottom bar, z-index 91):
  - Progress/seek bar (clickable, blue `#4fc3f7` fill)
  - Time display (current / duration)
  - Playback row: rewind 15s | play/pause (56px blue circle) | forward 15s
  - Skip buttons: circular arrow SVG icons with "15" label overlay
  - Separator line via `::after` pseudo-element (`bottom: 3px`)
  - `border-top: 1px solid rgba(255, 255, 255, 0.1)` at top edge
- **Bottom bar**: Reuses `story__bottom-bar` with Tarjima + Pinyin toggles.
- **Header**: Red hero banner (`.dr-hero`) with back button, hamburger menu, song title/pinyin/translation.
- **Fixed element stacking** (bottom to top): bottom bar (z-index 90) → controls (z-index 91) → header (z-index 100)
- **Lyrics padding**: Top `padding: 48px 0`. Bottom `padding-bottom: 220px` clears fixed controls.
- **Songs**: yueliang, pengyou, tonghua. Listed in `karaokeItems` array in `LanguagePage.tsx`. Service auto-discovers from `content/karaoke/*.json`.
- Data loaded from `content/karaoke/{songId}.json` via `src/services/karaoke.ts`

### PageFooter (Shared Footer)
- **Component**: `src/components/PageFooter.tsx` — used on all pages except karaoke
- Renders `<footer className="home__footer">` with:
  - Inline correction button ("Xato haqida xabar berish") — visible to all users (logged-in and anonymous), hidden on `/`
  - Expandable form: reason dropdown (6 options) + textarea
  - "Blim — Interaktiv til darsliklari" trilingual footer text
- **API**: `POST /api/corrections` — JWT auth, sends Telegram message to admin. Unauthenticated submissions return 401.
- **Footer spacing**: `padding-bottom: calc(80px + ...)` clears fixed bottom bars on reader/story/dialogue pages
- **Not in KaraokePlayer**: Excluded due to full-screen layout with fixed controls that overlap the footer
- Replaces all individual `<footer className="home__footer">` blocks across the codebase

### Hanzi Writing Practice
- Accessible from Language Page → Yozish/Письмо tab (`?tab=writing`) → card links to `/chinese/hsk1/writing/[setId]`
- Dedicated page: `WritingPracticePage.tsx` (client) + `page.tsx` (server with `generateStaticParams`)
- Data: `src/services/writing.ts` — shared `WRITING_SETS` data + `HanziWord` type
- Two core components: `HanziWriterPractice.tsx` (SRS session manager) + `HanziCanvas.tsx` (stroke drawing engine)
- **No external CDN** — stroke data fetched from `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/{char}.json`; module-level `strokeCache` Map avoids re-fetching on revisit
- **SRS**: Leitner 5-box system, localStorage key `'blim-hanzi-progress'`, value `Record<char, {box:1|2|3|4|5, nextReviewDate:string}>` (ISO date). Box intervals: `{1:0, 2:1, 3:3, 4:7, 5:14}` days. Missing entry = always due.
- **Word list**: 6 sets of 10 characters each in `WRITING_SETS` array. Supports multi-char words (e.g., 我们, 什么, 怎么). Subtabs: Yozish/Ierogliflar (UZ), Письмо/Иероглифы (RU).
- **View state machine**: `'home'` → Start button → `'practice'` → all cards graded → `'done'` → restart → `'home'`
- **Home view**: stat cards (due count, mastery %, total); Start button (disabled if 0 due); reset link with `confirm()` dialog
- **Practice view**: `HanziCanvas` (left panel) + info panel (right); Erase/Show buttons below canvas; grade buttons (Esimda yo'q / Bilaman!) appear after quiz complete; session progress counter
- **Done view**: Barakalla!/Отлично!, cards reviewed + mistakes count, restart button
- **`HanziWriterPractice` receives `lang: 'uz'|'ru'|'en'` as prop from `LanguagePage`** — does NOT call `useLanguage()` inside
- **`revealAll`**: `number` prop on `HanziCanvas`; increment to trigger show-all animation. `showAnswer` state is a counter, not boolean.

#### HanziCanvas Engine
- Three stacked canvases (`position: absolute`): `bgRef` (background/outline/crosshair), `displayRef` (completed strokes), `inputRef` (live drawing + animations)
- **Retina**: All canvases scaled by `devicePixelRatio` (capped at 3×). CSS `width/height = canvasSize`, physical size = `canvasSize × dpr`.
- **Canvas size**: 400px desktop, 300px mobile (≤480px), via `window.innerWidth` `useEffect` + resize listener
- **Coordinate system**: hanzi-writer-data uses 1024-wide × 900-tall y-up space. Transformed to canvas via `scale = size/1024`, `yOffset = (size - 900*scale)/2 + size*(-0.03)` (slight upward shift to prevent bottom clipping)
- **Stroke grading** (`gradeStroke`): validates start/end proximity (tolerance `0.15 × size`), direction dot product (threshold 0.45), shape at 25%/50%/75% along path. Rejects strokes shorter than `0.04 × size`.
- **Wrong stroke**: user stroke fades out in red; ghost outline of correct next stroke shown after 1 mistake; traveling dot hint along median after 2 mistakes
- **Out-of-order stroke**: detected by checking all later strokes; correct next stroke briefly highlighted in blue
- **Correct stroke**: canonical stroke slides into place from user's start position (easeOutQuart, 200ms). On all-strokes-complete: scale-up + color-to-red animation → calls `onComplete(totalMistakes)`.
- **Input blocking**: `animatingRef` blocks pointer input during slide animation (200ms + 100ms safety). Reduced from 600→350→200ms to minimize dead zone for fast writers.
- **Single-point dot**: `drawTaperedStroke` handles `points.length === 1` by drawing a small circle (radius `canvasSize * 0.008`), giving immediate visual feedback on touch.
- **Show button** (revealAll): animates each remaining stroke in sequence — traveling dot along median (1000ms) then slide-in (500ms). Calls `onComplete(mistakes + penaltyStrokes)` after all revealed.
- **`onComplete(mistakes: number)`**: called when all strokes done (naturally or via Show). `HanziWriterPractice` adds mistakes to session total and sets `quizComplete = true` after 800ms delay.
- **Erase** (`resetKey` increment on `HanziCanvas` key): remounts canvas, resets all state. `showAnswer` reset to 0.

### Branding & Colors
- **Banner**: Red `#dc2626`
- **Accent color** (`--color-accent`): `#dc2626`
- **Active tab text**: `#dc2626` (on white `#f5f5f5` background)
- **Inactive tab text**: White (`#fff`) on red banner
- **Book level text / Lesson number badge**: `#dc2626`
- **Logo (dark)**: `/public/logo.svg` — dark letterforms with red accents (play triangle + "m" chevron). Used on banner, karaoke, landing hero.
- **Logo (blue)**: `/public/logo-blue.svg` — `#71a3da` variant, used on light backgrounds (landing nav)
- **Logo (red)**: `/public/logo-red.svg` — `#dc2626` variant, used on grey reader headers (lesson, story, flashcard)
- **Border-radius**: Globally reduced — 16→10, 12→8, 8→6, 6→4, 4→3px. Circles (50%) unchanged.
- **Tab labels (UZ)**: Dialog | Yozish | Flesh | KTV | Tika | Test
- **Tab labels (RU)**: Диалог | Письмо | Флеш | KTV | Грамм | Тесты
- **Tab labels (EN)**: Dialogue | Writing | Flash | KTV | Grammar | Tests
- **Tab IDs**: `dialogues` | `writing` | `flashcards` | `karaoke` | `grammar` | `tests`

### Styling Conventions
- Section headers: Red gradient tab with rounded top corners (hidden for objectives, text, and tonguetwister sections)
- Section content: Colored background based on type
- Pinyin: Accent color (blue), italic
- Translation: Secondary text color, italic

### Card Design (Objectives, Text, Exercise & Tongue Twister Sections)
Objectives, text, exercise, and tongue twister sections use a modern floating card design:

**Objectives section** (`.section--objectives`):
- Header hidden (`display: none`)
- All sentences in one white card with rounded corners (`border-radius: 16px`) and shadow
- Red accent strip (`border-left: 6px solid #C43A35`) on Chinese text only (`.sentence__text`)
- Uzbek translation aligned with Chinese text (`padding-left: 22px`)
- Translations always visible (no toggle needed), pinyin hidden
- No checkboxes, no dividers between sentences

**Text section** (`.section--text`):
- Header hidden (`display: none`)
- Context block styled as floating white card with shadow and rounded corners
- Subtle divider (`border-top: 1px solid #e5e5e5`) between Chinese text and translation
- Translation always visible in context card (no toggle needed)
- Instruction rendered above the context card (without play button)
- Play button moved inside the context card, inline at end of translation text (`.section__audio-btn--inline`)
- Non-text sections keep the original layout (instruction with play button below context)

**Exercise section** (`.section--exercise`):
- Sentences in white floating card (`background: #fff`, `border-radius: 16px`, `box-shadow`, `padding: var(--spacing-sm) var(--spacing-md)`)
- Instruction uses section-level `instruction` field (not a sentence with `isCheckbox`)
- Instruction row indented (`padding-left: var(--spacing-md)`) to align ■ with card content

**Tongue twister section** (`.section--tonguetwister`):
- Header hidden (`display: none`), no subheading displayed
- White floating card (`border-radius: 16px`, `box-shadow`, `padding: 20px`)
- All tongue twister lines merged into a single sentence entry
- Instruction + play button rendered above the card (non-text section layout)
- Font size 18px, font-weight 500, line-height 1.7

## Dialogue Layout
- Speaker names in left column (grid layout, min-width 3em)
- Dialogue text in right column (no per-sentence audio buttons — tap sentence to play)
- Pinyin below text (when visible)
- Translation below pinyin (when visible)
- Grid ensures speaker names align vertically across all dialogue lines
- Vocabulary and dialogue use the same font size and weight (`font-weight: 400`, base font size)

## Layout & Width Specifications

### Page Width
All pages use consistent max-width with responsive breakpoints:
- **Default**: `max-width: 900px`
- **≥1200px viewport**: `max-width: 1000px`
- **≥1600px viewport**: `max-width: 1100px`

This applies to:
- `.home` (home page container)
- `.page` (lesson page container)
- `.reader__header-inner` (header content)

### Home Page Structure (HomePage.tsx — language selection)
```
main.home (max-width container + padding)
├── Landing page content (logged-in users redirect to /chinese)
└── footer.home__footer
```

### Language Page Structure (LanguagePage.tsx — tabbed catalog)
```
main.home (reuses home styling, no top padding)
├── header.home__hero (full-width red banner #dc2626, z-index: 10)
│   └── div.home__hero-inner (constrained max-width matching page)
│       ├── div.home__hero-top-row (flex: logo | menu)
│       │   ├── Link.home__hero-logo > img.home__hero-logo-img (logo, 64px)
│       │   └── BannerMenu (shared component, hamburger menu)
│       │       ├── button.home__menu-btn (44px, hamburger icon)
│       │       └── div.home__menu-dropdown (right-aligned dropdown)
│       │           ├── div.home__menu-user (name + email, if logged in)
│       │           ├── div.home__menu-section-label ("Til" / "Язык" / "Language")
│       │           ├── div.home__menu-lang-row > select.home__menu-lang-select (O'zbekcha / Русский / English dropdown)
│       │           ├── div.home__menu-section-label ("Men o'rganaman" / "Я изучаю" / "I'm learning")
│       │           ├── div.home__menu-lang-row (中文 button)
│       │           ├── button.home__menu-item (To'lov / Оплата / Payment)
│       │           └── button.home__menu-item (Chiqish / Выйти / Log out, if logged in)
├── nav.lp__tabs (sticky below hero, red gradient, full-width)
│   └── div.lp__tabs-inner > button.lp__tab (Dialog | Yozish | Flesh | KTV | Tika | Test)
├── div.lp__seg-bar (HSK level pills, hidden for karaoke + writing tabs)
└── section.home__content
    ├── [dialogues tab] search bar + tag chips + bookmark toggle + dialogue cards grid
    ├── [writing tab]   HanziWriterPractice (home/practice/done views, SRS)
    ├── [flashcards tab] topic deck cards only (search + due-today banner)
    ├── [karaoke tab]   KTV song cards
    ├── [grammar tab]   Grammar cards grid (17 items)
    └── [tests tab]     Test cards
└── footer.home__footer
```

### Book Page Structure (BookPage.tsx — lesson list)
```
main.home (reuses home styling)
├── header.home__hero (logo + HSK 1-6 folder tabs)
│   └── div.home__hero-inner
│       ├── div.home__hero-top-row
│       │   └── Link.home__hero-logo > img (links to /chinese)
│       └── div.lang-page__tabs (HSK 1 active, 2-6 disabled)
├── section.home__content
│   ├── div.home__lessons
│   │   └── article.lesson-card (per lesson)
│   │       ├── div.lesson-card__header (number + translation, no Chinese title/pinyin)
│   │       └── div.lesson-card__pages (page links)
│   └── div.home__stats
└── footer.home__footer
```

### Lesson Page Structure
```
div.reader
├── header.reader__header (fixed, full-width background)
│   └── div.reader__header-inner (constrained width)
│       ├── Link.reader__home (logo img)
│       └── ReaderControls (RU/UZ toggle, A-/A+ font controls)
├── div.page__translation-panel (fixed below header, shown when translation on + sentence tapped)
├── article.page (constrained width, permanent 1em extra top padding for panel space)
│   ├── LessonHeader (if present)
│   ├── div.page__content
│   │   └── Section (multiple)
│   └── button.page__audio-fab (floating play button, shown when section play button scrolls away)
└── nav.reader__bottom-nav (fixed, full-width background)
    └── div.reader__bottom-nav-inner (constrained width)
        ├── Link/span.reader__nav-btn (prev)
        ├── div.reader__nav-toggles (Pinyin + Tarjima toggle buttons)
        └── Link/span.reader__nav-btn (next)
```

### Flashcard List Page Structure (FlashcardListPage.tsx)
```
main.home
├── header.home__hero (logo + HSK 1-6 folder tabs)
│   └── div.home__hero-inner
│       ├── div.home__hero-top-row
│       │   └── Link.home__hero-logo > img (links to /chinese?tab=flashcards)
│       └── div.lang-page__tabs (HSK 1 active, 2-6 disabled)
├── section.home__content
│   └── div.home__lessons
│       └── article.lesson-card (per lesson)
│           ├── div.lesson-card__header (number + translation)
│           └── div.lesson-card__pages (word count link → /flashcards/[lessonId])
└── footer.home__footer
```

### Flashcard Practice Page Structure (FlashcardDeck.tsx)
```
main.flashcard-page
├── header.home__hero (logo + HSK 1-6 folder tabs)
│   └── div.home__hero-inner
│       ├── div.home__hero-top-row
│       │   └── Link.home__hero-logo > img (links to /[book]/flashcards)
│       └── div.lang-page__tabs (HSK 1 active, 2-6 disabled)
├── div.flashcard-page__header (controls: direction + pinyin + lang toggles)
├── div.flashcard__progress (progress bar)
└── FlashcardCard OR div.flashcard__complete
    ├── div.flashcard__card-container (perspective)
    │   └── div.flashcard__card (3D flip via rotateY)
    │       ├── div.flashcard__face--front (Chinese + audio + pinyin)
    │       └── div.flashcard__face--back (translation + reminder)
    └── div.flashcard__actions (know/don't know buttons)
```

### Story Reader Page Structure (StoryReader.tsx)
```
div.reader
├── header.reader__header (fixed, grey bg, reuses lesson header)
│   └── div.reader__header-inner
│       ├── Link.reader__home (logo img, links to /[book]/stories)
│       └── ReaderControls (language/font toggles only)
├── div.story__translation-panel (fixed below header, shown on sentence tap)
│   └── p.story__translation-panel-text
├── article.story (independent container, NOT .page)
│   ├── div.story__focus (focus mode: single sentence view)
│   │   ├── p.story__focus-text (centered, min-height 35vh)
│   │   ├── div.story__focus-nav (← ▶ → buttons row)
│   │   │   ├── button.story__focus-nav-btn (48px grey circle, SVG chevron)
│   │   │   ├── button.story__focus-play-btn (44px blue circle, play/pause)
│   │   │   └── button.story__focus-nav-btn
│   │   └── span.story__focus-counter ("9 / 30")
│   └── div.story__paragraph (normal mode: per section)
│       └── p.story__text
│           └── span.story__sentence (per sentence, clickable, tap-to-play audio)
│               └── span.story__word (per word, long-pressable)
│                   └── ruby > rt (pinyin above each character)
├── button.story__play-fab (normal mode only: play/pause full story audio)
└── nav.story__bottom-bar (fixed, grey bg, Tarjima + Fokus + Pinyin toggles)
    └── div.story__bottom-bar-inner
        └── button.reader__nav-toggle (× 2)
```

### Karaoke Player Page Structure (KaraokePlayer.tsx)
```
div.karaoke (light theme: #f5f5f5 bg, flex column, max-width 900px)
├── div.dr-hero (red gradient banner with back btn, hamburger menu, song title)
├── div.story__translation-panel (sticky below hero, margin-bottom: -45px, no layout shift)
│   └── p.story__translation-panel-text
├── div.karaoke__lyrics (scrollable, flex:1, padding: 48px 0, fontSize% inline style)
│   └── div.karaoke__line (per line, centered text)
│       └── ruby.karaoke__char (per character, timestamp-based highlighting)
│           ├── character text
│           └── rt.karaoke__rt (pinyin, toggleable via visibility)
├── div.dr-font-controls (fixed right pill at top: 58%, transparent by default, visible on hover)
│   ├── button.dr-font-btn (A+)
│   ├── div.dr-font-divider
│   └── button.dr-font-btn (A-)
├── nav (Tarjima + Pinyin toggle buttons, fixed bottom)
├── div.karaoke__controls (fixed, above bottom bar, z-index 91)
│   ├── div.karaoke__progress (clickable seek bar)
│   │   └── div.karaoke__progress-bar (blue fill, width = progress%)
│   ├── div.karaoke__time (current time / duration)
│   ├── div.karaoke__playback-row (flex, centered, gap 24px)
│   │   ├── button.karaoke__skip-btn (rewind 15s)
│   │   ├── button.karaoke__play-btn (56px red circle, play/pause/spinner)
│   │   └── button.karaoke__skip-btn (forward 15s)
│   └── ::after pseudo-element (separator line, bottom: 3px)
└── nav.story__bottom-bar (fixed, z-index 90)
    └── div.story__bottom-bar-inner
        ├── button (Tarjima toggle)
        └── button (Pinyin toggle)
```
