# Blim - Interactive Language Textbook Reader

## Project Overview
Blim (formerly ReadVo/Kitobee) is a DOM-based interactive reading system for language textbooks, designed for Uzbek-speaking students. It supports multiple languages and books (starting with HSK Chinese). It provides sentence-by-sentence audio playback, pinyin/translation toggles, and a clean, textbook-like UI.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS (reading.css) with CSS custom properties
- **Font**: Noto Sans (via `next/font/google`, subsets: latin, cyrillic)
- **State Management**: React hooks (useState, useCallback, useMemo)
- **Storage**: Supabase Storage (images and audio files)
- **Database**: Supabase (project: miruwaeplbzfqmdwacsh)

## URL Structure
```
/                                           # Home/landing page (redirects logged-in users to /chinese)
/[language]                                 # Language page - tabbed catalog (Kitoblar, Matn, Fleshkartalar, Karaoke, Testlar)
/[language]?tab=[tabId]                     # Language page with specific tab pre-selected
/[language]/[book]                          # Book page - lesson list
/[language]/[book]/lesson/[lessonId]/page/[pageNum]  # Lesson page
/[language]/[book]/flashcards               # Flashcard list page (per-lesson cards)
/[language]/[book]/flashcards/[lessonId]    # Flashcard practice for specific lesson
/[language]/[book]/stories                  # Stories list page
/[language]/[book]/stories/[storyId]        # Story reader page
/[language]/[book]/karaoke/[songId]         # Karaoke player page
```

Example routes:
- `/` - Landing page (logged-in users auto-redirect to `/chinese`)
- `/chinese` - Chinese language page with tabs (Kitoblar, Matn, Fleshkartalar, Karaoke, Testlar)
- `/chinese?tab=flashcards` - Language page with Flashcards tab active
- `/chinese/hsk1` - HSK 1 book with lesson list
- `/chinese/hsk1/lesson/1/page/1` - Lesson 1, Page 1
- `/chinese/hsk1/flashcards` - HSK 1 flashcard list (per-lesson cards with word counts)
- `/chinese/hsk1/flashcards/1` - Flashcard practice for lesson 1
- `/chinese/hsk1/stories` - HSK 1 stories list
- `/chinese/hsk1/stories/hsk1-story1` - Story reader

## Project Structure
```
/Users/ali/ReadVo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page (language selection)
│   │   ├── error.tsx          # Error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   └── chinese/
│   │       ├── page.tsx       # Language page (tabbed catalog)
│   │       └── hsk1/
│   │           ├── page.tsx   # Book page (lesson list)
│   │           ├── flashcards/
│   │           │   ├── page.tsx       # Flashcard list page (per-lesson cards)
│   │           │   └── [lessonId]/page.tsx  # Flashcard practice for lesson
│   │           ├── stories/
│   │           │   ├── page.tsx       # Stories list page
│   │           │   └── [storyId]/page.tsx  # Story reader page
│   │           ├── karaoke/
│   │           │   └── [songId]/page.tsx   # Karaoke player page
│   │           └── lesson/[lessonId]/page/[pageNum]/page.tsx
│   ├── components/             # React components
│   │   ├── Page.tsx           # Top-level page container
│   │   ├── PageReader.tsx     # Page reader wrapper
│   │   ├── Section.tsx        # Groups sentences by type
│   │   ├── Sentence.tsx       # Atomic unit with words, audio
│   │   ├── LessonHeader.tsx   # Lesson banner (1 DARS format)
│   │   ├── ReaderLayout.tsx   # Layout with fixed header/footer
│   │   ├── ReaderControls.tsx # Header controls (focus, language, font)
│   │   ├── HomePage.tsx       # Home page (language selection cards)
│   │   ├── LanguagePage.tsx   # Language page (tabbed: HSK, Stories, Flashcards, Tests)
│   │   ├── BookPage.tsx       # Book page (lesson list with pages)
│   │   ├── StoriesPage.tsx     # Stories list page
│   │   ├── StoryReader.tsx    # Story reader with ruby pinyin, translation panel, audio bar
│   │   ├── FlashcardListPage.tsx # Flashcard lesson list with banner+tabs
│   │   ├── FlashcardDeck.tsx  # Flashcard session manager (client)
│   │   ├── FlashcardCard.tsx  # Flashcard with 3D flip animation
│   │   ├── KaraokePlayer.tsx  # Karaoke player with synced lyrics, ruby pinyin, controls
│   │   ├── MatchingExercise.tsx      # Image-word matching
│   │   ├── FillBlankExercise.tsx     # Dropdown fill-in-the-blank
│   │   ├── MultipleChoiceExercise.tsx # Multiple choice questions
│   │   ├── ImageDescribeExercise.tsx  # Image description with typed input
│   │   └── TableFillExercise.tsx      # Table-based activity exercises
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudioPlayer.ts  # Singleton audio player
│   │   └── useLanguage.ts     # UZ/RU language toggle/set (localStorage)
│   ├── utils/                    # Utility functions
│   │   └── rubyText.ts        # Pinyin-to-character alignment for ruby annotations
│   ├── services/               # Data loading
│   │   ├── index.ts           # Service exports
│   │   ├── content.ts         # Loads JSON from /content
│   │   ├── stories.ts        # Loads story JSON from /content/stories
│   │   ├── flashcards.ts     # Loads flashcard decks from /content/flashcards
│   │   └── karaoke.ts        # Loads karaoke song JSON from /content/karaoke
│   ├── styles/
│   │   └── reading.css        # All styles
│   ├── types/
│   │   ├── schema.ts          # TypeScript interfaces
│   │   └── ui-state.ts        # UI state type definitions
│   └── validation/             # Content validation
├── content/                    # JSON lesson data (HSK 1)
│   ├── lesson1-page1.json     # Lessons 1-15: complete (3 pages each)
│   ├── ...
│   ├── lesson15-page3.json
│   ├── flashcards/
│   │   └── hsk1.json          # HSK 1 flashcard word list
│   ├── stories/
│   │   └── hsk1/
│   │       └── story1.json    # Story content files
│   └── karaoke/
│       └── yueliang.json      # Karaoke song data (per-character timestamps + pinyin)
├── .env.local                  # Supabase credentials
└── public/
    └── audio/                  # Local MP3 audio files (legacy)
```

## Data Hierarchy
```
Page → Section → Sentence → Word
```

- **Page**: Unit of navigation, contains sections
- **Section**: Groups content by type (objectives, text, vocabulary, exercise, tip)
- **Sentence**: Atomic unit with Chinese text, pinyin, translation, optional audio
- **Word**: Tokenized words for future dictionary lookup

## Section Types
- `objectives` - Learning goals
- `text` - Main dialogue/reading with context narration
- `dialogue` - Conversational exchanges
- `vocabulary` - Word lists with pinyin and translation
- `grammar` - Grammar explanations
- `tip` - Helper tips
- `exercise` - Practice activities with checkboxes
- `instruction` - Meta-text instructions
- `activity` - Classroom activities → `TableFillExercise`
- `tonguetwister` - Tongue twisters (floating white card, single merged sentence)
- `matching` - Image-word matching → `MatchingExercise`
- `fillblank` - Fill-in-the-blank with dropdowns → `FillBlankExercise`
- `multiplechoice` - Multiple choice questions → `MultipleChoiceExercise`
- `imagedescribe` - Image description with typed input → `ImageDescribeExercise`
- `bonus` - Bonus content with video player

## Key Features

### Toggle Controls
- **Header controls**: Language toggle (RU/UZ), font size (A-/A+)
- **Lesson bottom nav toggles**: Pinyin and Translation (Tarjima) buttons in the center of the fixed bottom navigation bar
- **Story bottom bar toggles**: Three buttons in order: Tarjima, Fokus, Pinyin. Slim fixed bar at bottom (stories don't use lesson bottom nav)
- **Translation panel**: Fixed panel below header showing translation of tapped sentence. Page has permanent extra `1em` top padding to prevent panel from overlapping content (padding does NOT change when panel toggles)
- **Grey backgrounds**: Header, lesson bottom nav, and story bottom bar all use `rgba(245, 245, 245, 0.97)` to distinguish from page content

### Audio Playback
- **Tap-to-play**: Tapping a sentence with `audio_url` auto-plays its audio (no per-sentence play buttons)
- **Playing indicator**: Active sentence text turns blue (`color: var(--color-accent)`) via `.sentence--playing`
- **Cursor**: Sentences with audio show `cursor: pointer` via `.sentence--has-audio`
- Section-level "Play All" button next to instruction text (e.g., "朗读对话。Dialogni ovoz chiqarib o'qing.")
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

### Flashcard Practice
- Accessible from Language Page → Flashcards tab → HSK card → `/chinese/hsk1/flashcards` (lesson list) → `/chinese/hsk1/flashcards/[lessonId]` (practice)
- Flashcard list page shows per-lesson cards with word counts (e.g., "27 so'z"). Banner with logo + HSK 1-6 tabs.
- Cards show Chinese + pinyin (front) → translation (back) with CSS 3D flip animation
- Self-grading: "Bilaman" (Know) / "Bilmayman" (Don't Know) buttons appear after flip
- Session progress bar, completion screen with stats (known vs unknown count)
- Restart options: all cards or only unknown cards (reshuffled)
- Pinyin toggle: hide/show pinyin on front face
- UZ/RU language toggle for translations
- Optional audio playback button per card (uses `useAudioPlayer` singleton)
- Cards shuffled on mount via `useEffect` to avoid hydration mismatch
- Data loaded from `content/flashcards/{bookId}.json`

### Story Reader
- Accessible from Language Page → Stories tab (future) or `/chinese/hsk1/stories`
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
  - Sentence text area has fixed `min-height: 9em` to prevent nav buttons from jumping on multi-line sentences
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
- Accessible from Language Page → Karaoke tab → song card → `/chinese/hsk1/karaoke/[songId]`
- Per-character synced lyrics with timestamp-based highlighting (characters light up as they're sung)
- **Dark theme**: Entire page uses `#0a0a0a` background with dark-themed overrides for all shared components (header, translation panel, bottom bar, toggle buttons)
- **Ruby pinyin**: Each character gets `<ruby>/<rt>/<rp>` pinyin annotation. Pinyin uses `0.5em` font size, italic, white with reduced opacity. Punctuation characters skip pinyin automatically.
- **Character spacing**: `margin: 0 0.08em` on each `ruby` element for visual separation between characters
- **Pinyin toggle**: Hides pinyin via `visibility: hidden` on `<rt>` (no layout shift)
- **Tap-to-translate**: Tapping a lyrics line shows its translation in the panel (like stories). Tapping again deselects. Audio-synced line (`audioLineIdx`) takes priority over tapped line (`tappedLineIdx`). Tapped selection is cleared when audio starts playing.
- **No focus mode**: Karaoke doesn't need focus mode — per-character sync and auto-scroll already provide the focused experience.
- **Translation panel**: Reuses `story__translation-panel` (fixed below header). Shows active line's UZ/RU translation (from audio sync or tap). Dark themed (`rgba(10, 10, 10, 0.95)`).
- **Character highlight states**:
  - Default: `rgba(255, 255, 255, 0.25)` (dimmed)
  - Active line: `rgba(255, 255, 255, 0.5)` (brighter)
  - Past lines: `rgba(255, 255, 255, 0.15)` (faded)
  - Currently singing character: `#ffd54f` (gold) with text shadow glow
  - Already sung character (active line): `#66bb6a` (green)
- **No CSS transitions on lines**: `.karaoke__line` has no `transition` property — instant color changes prevent flickering when active line changes (transitions caused visible flicker between states)
- **Auto-scroll**: Active line auto-scrolls to center via `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- **Font size**: Adjustable via A-/A+ buttons in header. Lyrics container uses inline `fontSize` percentage. Line font size uses `em` (not `rem`) to inherit from parent.
- **Audio system**: Direct `HTMLAudioElement` via `useRef`. Lazy-loaded (`preload: 'none'`), src set on first play. `requestAnimationFrame` loop for smooth time tracking.
- **Controls panel** (fixed, above bottom bar, z-index 91):
  - Progress/seek bar (clickable, blue `#4fc3f7` fill)
  - Time display (current / duration)
  - Playback row: rewind 15s | play/pause (56px blue circle) | forward 15s
  - Skip buttons: circular arrow SVG icons with "15" label overlay
  - Separator line via `::after` pseudo-element (`bottom: 3px`)
  - `border-top: 1px solid rgba(255, 255, 255, 0.1)` at top edge
- **Bottom bar**: Reuses `story__bottom-bar` with Tarjima + Pinyin toggles. Dark themed.
- **Header**: Reuses `reader__header` with `ReaderControls` (RU/UZ toggle, A-/A+ font). Logo inverted to white via `filter: brightness(0) invert(1)`. Dark themed.
- **Fixed element stacking** (bottom to top): bottom bar (z-index 90) → controls (z-index 91) → header (z-index 100)
- **Lyrics padding**: Top padding clears fixed header + translation panel (`calc(var(--header-height) + 60px + env(safe-area-inset-top))`). Bottom padding (200px) clears fixed controls.
- Data loaded from `content/karaoke/{songId}.json` via `src/services/karaoke.ts`

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

## Content JSON Format

### Sentence with pinyin
```json
{
  "id": "l1p1-t1-s1",
  "section": "text",
  "text_original": "AI小语，你好！",
  "text_translation": "Salom, AI Xiaoyu!",
  "pinyin": "AI Xiǎoyǔ, nǐ hǎo!",
  "speaker": "王一飞",
  "audio_url": "/audio/l1p1-t1-s1.mp3",
  "words": [...]
}
```

### Section with context, image, and audio
```json
{
  "id": "l1p1-sec-text1",
  "type": "text",
  "heading": "",
  "subheading": "Tekst 1",
  "subheading_ru": "Текст 1",
  "context": "开学第一天，在办公室里...",
  "contextPinyin": "Kāixué dì yī tiān...",
  "contextTranslation": "O'quv yilining birinchi kuni...",
  "contextTranslation_ru": "В первый день учёбы...",
  "instruction": "Dialogni tinglang va ovoz chiqarib o'qing.",
  "instruction_ru": "Послушайте диалог и прочитайте его вслух.",
  "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201/HSK%201-1/dialogue.mp3",
  "image_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/images/HSK%201/HSK-1-1-1.jpg",
  "sentences": [...]
}
```

### Tip with pinyin
```json
{
  "tip": {
    "label": "小语助力",
    "text": "「您」，敬称，对年长者或尊敬的人使用。",
    "pinyin": "「Nín」, jìngchēng, duì niánzhǎng zhě...",
    "translation": "「您」hurmatli olmosh bo'lib..."
  }
}
```

### Flashcard deck JSON
```json
{
  "id": "hsk1-flashcards",
  "title": "HSK 1 So'zlar",
  "title_ru": "HSK 1 Слова",
  "words": [
    {
      "id": "fc-hsk1-001",
      "text_original": "你好",
      "pinyin": "nǐ hǎo",
      "text_translation": "salom",
      "text_translation_ru": "привет",
      "lesson": 1,
      "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/nihao.mp3"
    }
  ]
}
```

### Exercise Data Formats

#### Matching Exercise (`matchingItems[]`)
```json
{
  "type": "matching",
  "matchingItems": [
    {
      "id": "l6p1-m1",
      "image_url": "https://...HSK-6-warmup-word.jpg",
      "word": "茶",
      "pinyin": "chá",
      "translation": "choy",
      "translation_ru": "чай"
    }
  ]
}
```

#### Fill-Blank Exercise (`fillBlankData`)
- Supports single or multiple blanks per sentence
- Single blank: use `correctOptionId`
- Multiple blanks: use `correctOptionIds` array (ordered by blank position)
- Use `"_static"` correctOptionId for non-interactive dialogue lines
```json
{
  "type": "fillblank",
  "fillBlankData": {
    "options": [{"id": "A", "text": "喝"}, {"id": "B", "text": "见"}],
    "sentences": [
      {
        "id": "single-blank",
        "parts": [{"type": "text", "content": "我想"}, {"type": "blank"}],
        "correctOptionId": "A"
      },
      {
        "id": "multi-blank",
        "parts": [{"type": "text", "content": "我们（"}, {"type": "blank"}, {"type": "text", "content": "）下课，下午（"}, {"type": "blank"}, {"type": "text", "content": "）吧。"}],
        "correctOptionId": "A",
        "correctOptionIds": ["A", "B"]
      }
    ]
  }
}
```

#### Multiple Choice Exercise (`multipleChoiceData`)
```json
{
  "type": "multiplechoice",
  "multipleChoiceData": {
    "questions": [{
      "id": "...",
      "question": "...",
      "options": [{"id": "a", "text": "..."}],
      "correctOptionId": "a"
    }]
  }
}
```

#### Image Describe Exercise (`imageDescribeData`)
```json
{
  "type": "imagedescribe",
  "imageDescribeData": {
    "cards": [{
      "id": "l6p1-img-1",
      "image_url": "https://...",
      "parts": [{"type": "text", "content": "他在"}, {"type": "blank", "content": ""}],
      "answers": ["喝茶"]
    }]
  }
}
```

#### Bonus Video
```json
{
  "type": "bonus",
  "video_url": "https://..."
}
```

### Karaoke Song JSON
```json
{
  "id": "yueliang",
  "title": "月亮代表我的心",
  "pinyin": "Yuèliàng Dàibiǎo Wǒ De Xīn",
  "titleTranslation": "Oy mening yuragimni ifodalaydi",
  "titleTranslation_ru": "Луна представляет моё сердце",
  "artist": "邓丽君",
  "artist_ru": "Дэн Лицзюнь",
  "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/karaoke/yueliang.mp3",
  "lines": [
    {
      "id": 0,
      "words": [
        { "id": 0, "text": "你", "p": "nǐ", "timestamp": 13.138, "duration": 0.432 },
        { "id": 1, "text": "问", "p": "wèn", "timestamp": 13.57, "duration": 0.48 }
      ],
      "translation": "Sen meni qanchalik sevishimni so'raysan",
      "translation_ru": "Ты спрашиваешь, как сильно я тебя люблю"
    }
  ]
}
```
- Each `line` contains `words[]` (per-character entries with timestamps)
- Each word/char: `id` (number), `text` (single character), `p` (pinyin, optional), `timestamp` (seconds), `duration` (seconds)
- `translation` / `translation_ru` on each line for panel display
- Song metadata: `title`, `pinyin`, `titleTranslation`, `titleTranslation_ru`, `artist`, `artist_ru`
- Empty lines (no text) are skipped during rendering

### Story JSON
```json
{
  "id": "hsk1-story1",
  "title": "小猫在哪儿？",
  "pinyin": "Xiǎo māo zài nǎr?",
  "titleTranslation": "Mushukcha qayerda?",
  "titleTranslation_ru": "Где котёнок?",
  "level": 1,
  "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201%20stories/1/story.mp3",
  "sections": [
    {
      "id": "s1-sec1",
      "type": "text",
      "heading": "",
      "subheading": "",
      "sentences": [
        {
          "id": "s1-s1",
          "text_original": "我有一个小猫。",
          "pinyin": "Wǒ yǒu yí ge xiǎo māo.",
          "text_translation": "Mening bir mushukcham bor.",
          "text_translation_ru": "У меня есть котёнок.",
          "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201%20stories/1/line1.mp3",
          "start": 0,
          "end": 3,
          "words": [
            { "i": [0, 1], "p": "wǒ", "t": "men", "tr": "я", "h": 1, "l": 2 },
            { "i": [1, 2], "p": "yǒu", "t": "bor", "tr": "иметь", "h": 1, "l": 4 },
            { "i": [2, 4], "p": "yí ge", "t": "bitta", "tr": "один", "h": 1, "l": 4 },
            { "i": [4, 6], "p": "xiǎo māo", "t": "mushukcha", "tr": "котёнок", "h": 1, "l": 8 }
          ]
        }
      ]
    }
  ]
}
```
- Each section represents a paragraph (visual grouping of sentences)
- Each sentence must be a single Chinese sentence (one tappable unit for translation)
- Story-level `audio_url` is optional; when present, the floating audio player appears (normal mode)
- Per-sentence `audio_url` is optional; when present, tapping the sentence plays its audio. URL pattern: `HSK%201%20stories/{storyNum}/line{N}.mp3`
- `start`/`end` are optional timestamps in seconds for audio-text sync (e.g., `"start": 6.5, "end": 10`)
- When timestamps are present, the sentence auto-highlights during audio playback
- Each sentence's `end` should match the next sentence's `start` (no gaps)
- For sentences sharing an audio segment, split the time proportionally
- Sections use `"type": "text"` with empty `heading`/`subheading`

## UI Text Language
- Section headings: **Empty** (all Chinese headings removed — `heading` field is `""`)
- Subheadings: Uzbek/Russian only (e.g., "Yangi so'zlar", "Новые слова")
- Instructions: Uzbek/Russian only — **NO Chinese text** in any `instruction`/`instruction_ru` fields
- Lesson badge: "1 DARS" format (number on top, label below)
- Button tooltips: Uzbek
- Translations: Uzbek (default) and Russian (toggle with language button)
- Language toggle: Custom dropdown selectors on language page banner ("Men bilaman"/"Я знаю" for known language, "Men o'rganaman"/"Я изучаю" for target language). Lesson/story headers still use UZ/RU toggle button.

## Bilingual Support (Uzbek/Russian)
All content supports both Uzbek and Russian translations:
- `text_translation` / `text_translation_ru` - sentence translations
- `contextTranslation` / `contextTranslation_ru` - context translations
- `instruction` / `instruction_ru` - instruction text
- `subheading` / `subheading_ru` - section subheadings
- `tip.translation` / `tip.translation_ru` - tip translations

## Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Supabase Storage
- **Project URL**: https://miruwaeplbzfqmdwacsh.supabase.co
- **Images bucket**: `/images/` - original textbook scans (HSK-1-1-1.jpg, HSK-1-2-1.jpg, etc.)
- **Audio bucket**: `/audio/` - organized by lesson and page
- URL format: `https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%20{lesson}/HSK%20{lesson}-{page}/{filename}.mp3`

### Audio URL Patterns
Folder structure: `HSK {lesson}/HSK {lesson}-{page}/`
- **Section dialogue audio**: `dialogue.mp3` — full dialogue playback
- **Per-sentence dialogue audio**: `dialogue1.mp3`, `dialogue2.mp3`, etc. — individual sentence playback
- **Vocabulary word audio**: `{pinyin}.mp3` — pinyin stripped of tones/spaces, lowercase (e.g., `nihao.mp3`, `laoshi.mp3`)
- **Tongue twister audio**: `tongue.mp3`
- Example: Lesson 5, Page 2 dialogue sentence 3 → `HSK 5/HSK 5-2/dialogue3.mp3`
- Example: Lesson 8, Page 1 vocab word 学校 (xuéxiào) → `HSK 8/HSK 8-1/xuexiao.mp3`

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
├── header.home__hero (full-width red gradient banner, z-index: 10)
│   └── div.home__hero-inner (constrained max-width matching page)
│       ├── div.home__hero-top-row (flex: logo | lang selectors | avatar)
│       │   ├── Link.home__hero-logo > img.home__hero-logo-img (white logo, 32px)
│       │   ├── div.home__lang-selectors (flex, gap between selectors)
│       │   │   ├── div.home__lang-selector ("I know" dropdown — UZ/RU)
│       │   │   └── div.home__lang-selector ("I'm learning" dropdown — Chinese)
│       │   └── button.home__avatar-btn (36px circle, profile icon)
│       └── div.lang-page__tabs (folder tabs on banner)
│           └── button.lang-page__tab (Kitoblar | Matn | Fleshkartalar | Karaoke | Testlar)
├── section.home__content
│   └── div.lang-page__books (responsive grid of cards)
│       └── Link/div.lang-page__book-card (per level, disabled = "Tez kunda" badge)
│           ├── span.lang-page__book-level > span.lang-page__book-level-label + number
│           └── span.lang-page__book-subtitle
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
│   │   ├── p.story__focus-text (centered, min-height 9em)
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
div.karaoke (dark theme: #0a0a0a bg, full viewport flex column)
├── header.reader__header (fixed, dark bg, white logo, z-index 100)
│   └── div.reader__header-inner
│       ├── Link.reader__home > img.reader__home-logo (white via filter invert)
│       └── ReaderControls (RU/UZ toggle, A-/A+ font size)
├── div.story__translation-panel (fixed below header, dark bg, shows active line translation)
│   └── p.story__translation-panel-text
├── div.karaoke__lyrics (scrollable, flex:1, fontSize% inline style)
│   └── div.karaoke__line (per line, centered text)
│       └── ruby.karaoke__char (per character, timestamp-based highlighting)
│           ├── character text
│           └── rt.karaoke__rt (pinyin, toggleable via visibility)
├── div.karaoke__controls (fixed, above bottom bar, z-index 91)
│   ├── div.karaoke__progress (clickable seek bar)
│   │   └── div.karaoke__progress-bar (blue fill, width = progress%)
│   ├── div.karaoke__time (current time / duration)
│   ├── div.karaoke__playback-row (flex, centered, gap 24px)
│   │   ├── button.karaoke__skip-btn (rewind 15s, circular arrow SVG + "15" label)
│   │   ├── button.karaoke__play-btn (56px blue circle, play/pause/spinner)
│   │   └── button.karaoke__skip-btn (forward 15s, circular arrow SVG + "15" label)
│   └── ::after pseudo-element (separator line, bottom: 3px)
└── nav.story__bottom-bar (fixed, dark bg, z-index 90)
    └── div.story__bottom-bar-inner
        ├── button.reader__nav-toggle (Tarjima toggle)
        └── button.reader__nav-toggle (Pinyin toggle)
```

### Key CSS Classes
- `.home` - Home/book/language page container (matches `.page` width, no top padding)
- `.home__hero` - Full-width red gradient banner (`width: 100vw`, `transform: translateX(-50%)`, `z-index: 10`)
- `.home__hero-inner` - Banner content wrapper (constrained `max-width` matching `.home`)
- `.home__hero-top-row` - Flex row: logo, language selectors, avatar
- `.home__hero-logo-img` - White logo (`height: 32px`, `filter: brightness(0) invert(1)`)
- `.home__lang-selectors` - Flex container for language dropdowns (`gap: clamp(24px, 5vw, 48px)`)
- `.home__lang-selector` - Dropdown column (`position: relative` for dropdown positioning)
- `.home__lang-select-btn` - Dropdown trigger button (transparent, white text)
- `.home__lang-dropdown` - Custom dropdown menu (`position: absolute`, `top: 100%`, centered)
- `.home__avatar-btn` - Profile circle (`36px`, `border-radius: 50%`, semi-transparent white)
- `.lang-page__tabs` - Folder tabs container inside banner (`display: flex`, `gap: 4px`)
- `.lang-page__tab` / `.lang-page__tab--active` - Folder tab buttons (`border-radius: 4px 4px 0 0`, active = white bg, inactive = semi-transparent white)
- `.lang-page__books` - Responsive grid for cards (`clamp()` sizing, stacks on mobile ≤600px)
- `.lang-page__book-card` / `--disabled` - Level card with optional "Tez kunda" badge
- `.lang-page__book-level` - Big red text (`clamp(1.8rem, 4vw, 2.5rem)`, `color: #dc2626`)
- `.lang-page__book-level-label` - "HSK" prefix inside level (same size/color, `font-size: 1em`)
- `.lang-page__book-pinyin` - Pinyin on karaoke cards (blue italic)
- `.lang-page__book-subtitle` - Grey subtitle text
- `.lang-page__placeholder` - Centered placeholder for empty tabs
- `.lesson-card` - Lesson card on book page (number badge 36px/8px radius + translation, no Chinese title/pinyin)
- `.reader__home-logo` - Logo image in reader headers (28px height)
- `.page` - Lesson content container (permanent `1em` extra top/bottom padding for translation panel space)
- `.page__translation-panel` - Fixed translation panel below header (z-index 99)
- `.page__audio-fab` - Floating play button (48x48, blue circle, `bottom: 80px`, `right: 24px`, `z-index: 80`)
- `.page__audio-fab--playing` - Green background when audio playing
- `.reader__header` - Fixed header (full-width, grey background `rgba(245, 245, 245, 0.97)`)
- `.reader__header-inner` - Header content (constrained to match page width)
- `.reader__bottom-nav` - Fixed bottom nav (full-width, grey background `rgba(245, 245, 245, 0.97)`)
- `.reader__bottom-nav-inner` - Bottom nav content (constrained to match page width)
- `.reader__nav-toggles` - Pinyin/Tarjima toggle button container in bottom nav
- `.reader__nav-toggle` / `--active` - Toggle buttons (`border-radius: 4px`, active = blue bg)
- `.sentence--has-audio` - `cursor: pointer` on tappable audio sentences
- `.sentence--playing .sentence__text` - Blue text color for currently playing sentence
- `.flashcard-page` - Flashcard page container
- `.flashcard__card` - 3D flip card (`transform-style: preserve-3d`, `aspect-ratio: 3/4`)
- `.flashcard__face` - Card face (`backface-visibility: hidden`)
- `.flashcard__front-content` - Centers Chinese + audio + pinyin vertically on front
- `.flashcard__audio-btn` - Circular audio play button on card front
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
- `.story__focus` - Focus mode container (flex column, centered)
- `.story__focus-text` - Centered sentence text (`font-size: 1.5em`, `min-height: 9em` for stable nav)
- `.story__focus-nav` - Button row: prev, play, next (flex, centered, gap 16px)
- `.story__focus-nav-btn` - Prev/next buttons (48px grey circle, no border, SVG chevrons)
- `.story__focus-play-btn` - Inline play/pause button (44px blue circle, toggles ▶/⏸)
- `.story__focus-counter` - Sentence counter label below nav ("9 / 30")
- `.story__word` - Pressable word span (cursor pointer, border-radius 2px)
- `.story__word--active` - Blue background highlight for pressed word
- `.story__word-hsk` - HSK level/lesson badge in translation panel (small pill-shaped tag)
- `.story--focus .story__sentence:not(.story__sentence--active)` - Dimmed non-active sentences (opacity 0.35)
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
- `.karaoke` - Full-viewport dark container (`#0a0a0a`, flex column)
- `.karaoke__lyrics` - Scrollable lyrics area (`flex: 1`, `overflow-y: auto`, top padding clears header)
- `.karaoke__line` - Centered line (`font-size: 1.8em`, `line-height: 2`, dimmed white)
- `.karaoke__line--active` - Brighter white for current line
- `.karaoke__line--past` - Faded for past lines
- `.karaoke__char` - Ruby element per character (`margin: 0 0.08em` for spacing)
- `.karaoke__char--singing` - Gold color (`#ffd54f`) with text shadow glow for currently singing character
- `.karaoke__char--sung` - Green color (`#66bb6a`) for already sung characters in active line
- `.karaoke__rt` - Pinyin annotation (`font-size: 0.5em`, italic, reduced opacity)
- `.karaoke__rt--hidden` - `visibility: hidden` (toggle pinyin without layout shift)
- `.karaoke__controls` - Fixed controls panel (above bottom bar, z-index 91, dark bg with border-top)
- `.karaoke__controls::after` - Separator line pseudo-element (`bottom: 3px`)
- `.karaoke__progress` - Clickable seek bar (4px height, `margin-top: 20px`)
- `.karaoke__progress-bar` - Blue fill bar (`#4fc3f7`)
- `.karaoke__playback-row` - Flex row for skip/play buttons (centered, gap 24px)
- `.karaoke__play-btn` - Play/pause button (56px blue circle)
- `.karaoke__skip-btn` - Rewind/forward 15s button (44px, transparent bg, circular arrow icon)
- `.karaoke__skip-label` - "15" text overlay on skip buttons (8px, absolute centered)
- `.karaoke .reader__header` - Dark header override (`rgba(10, 10, 10, 0.95)`)
- `.karaoke .reader__home-logo` - White logo via `filter: brightness(0) invert(1)`
- `.karaoke .story__translation-panel` - Dark translation panel override
- `.karaoke .story__bottom-bar` - Dark bottom bar override
- `.karaoke .reader__nav-toggle` - Dark toggle buttons (white text, `rgba(255,255,255,0.1)` bg)
- `.karaoke .reader__nav-toggle--active` - Active toggle (`#4fc3f7` bg, white text)
- `.karaoke .page__lang-btn` - Dark language button override
- `.karaoke .page__font-controls` - Dark font controls override
- `.karaoke .page__font-btn` - Dark font button override

### Padding
- Page side padding: `var(--spacing-xl)` (32px)
- Header inner padding: `var(--spacing-md) var(--spacing-xl)` (16px 32px)
- Bottom nav inner padding: `var(--spacing-md) var(--spacing-xl)` (16px 32px)

## Content Conventions
- Content is loaded from `/content/*.json` files
- Audio/images stored in Supabase Storage (URLs in JSON)
- All pinyin should use tone marks (not numbers)
- Translations should be in Uzbek with proper apostrophes (o', g', etc.)
- Russian translations use standard Cyrillic
- `dialogueNumber` should be plain numbers (e.g., `"1"`, `"2"`) — the component wraps them in parentheses
- All exercise progress bars use `var(--color-accent)` for consistency
- Exercise instructions use section-level `instruction`/`instruction_ru` fields (NOT sentences with `isCheckbox`)
- **NO Chinese in headings**: All `heading` fields are empty (`""`) — Chinese section titles removed
- **NO Chinese in instructions**: All `instruction`/`instruction_ru` fields are Uzbek/Russian only
- **NO Chinese in grammar explanations**: Grammar explanation sentences have no `text_original` (only `text_translation`/`text_translation_ru`)
- Pinyin is ONLY for learning content: Chinese example sentences, vocabulary, dialogues, tongue twisters
- Numbered sentences like `(1) 四口` use inline numbering in `text_original` (not `dialogueNumber`)
- Pinyin/translation for numbered sentences in grammar and exercise sections auto-indent via CSS (`padding-left: 2.2em`)
- For pages with MC listening exercises: split text section into 3 parts: (1) heading+context, (2) MC exercise, (3) instruction+audio+image+dialogue
- **Tongue twisters**: All lines merged into a single sentence entry. Type must be `tonguetwister` (not `text` or `grammar`). Section field must be `tonguetwister`.
- Standard instruction texts:
  - Dialogue: `"Dialogni tinglang va ovoz chiqarib o'qing."` / `"Послушайте диалог и прочитайте его вслух."`
  - MC: `"Dialogni ikki marta tinglab, to'g'ri javobni tanlang."` / `"Прослушайте диалог дважды и выберите правильный ответ."`
  - Fill-blank: `"To'g'ri so'zni tanlab, bo'sh joylarni to'ldiring."` / `"Выберите подходящие слова для заполнения пропусков."`
  - Tongue twister: `"Tez aytishni eshiting va aytishni mashq qiling."` / `"Послушайте скороговорку и потренируйтесь произносить."`

## Content Formatting Standards

### Multiple Choice Questions
- **NEVER** include question numbers like "(1)" or "(2)" in the `content` field of question `parts`
- The `number` field already handles numbering automatically
- Correct format: `"content": "李文问大家("` (no number prefix)
- Incorrect format: `"content": "(1)李文问大家("` (has number prefix)

### Exercise Sentences
- **Keep** numbers in `text_original` with a space: `"(1) 白家月爱吃哪个菜？"`
- **Remove** number prefixes from `pinyin` and translations
- Correct format:
  ```json
  {
    "text_original": "(1) 白家月爱吃哪个菜？",
    "pinyin": "Bái Jiāyuè ài chī nǎge cài?",
    "text_translation": "Bai Jiyayue qaysi taomni yoqtiradi?"
  }
  ```
- Incorrect format: `"pinyin": "(1) Bái Jiāyuè ài chī nǎge cài?"`

### Grammar Example Sentences
- **Must** have `pinyin` field for all example sentences
- **Must NOT** have `dialogueNumber` fields (use inline numbering instead)
- **Must** include inline numbering in `text_original`: `"(1) 我喜欢这个，也喜欢那个。"`
- Correct format:
  ```json
  {
    "text_original": "(1) 我喜欢这个，也喜欢那个。",
    "pinyin": "Wǒ xǐhuan zhège, yě xǐhuan nàge.",
    "text_translation": "Men buni yoqtiraman, uni ham yoqtiraman."
  }
  ```
- Grammar dialogues use `speaker` + `dialogueNumber` fields for A/B exchanges

### Grammar Explanations (no Chinese)
- Grammar explanation sentences have **no `text_original`** and **no `pinyin`** — only translations
- Identified by: `section === 'grammar'` + no `pinyin` field + has `text_translation`
- Validator allows these via `isGrammarExplanation` check
- Sentence.tsx conditionally renders `sentence__text` only when `text_original` exists
- Format:
  ```json
  {
    "id": "l9p2-g3-s2",
    "section": "grammar",
    "text_translation": "\"第\" butun sonlar oldida kelib, tartib sonni bildiradi.",
    "text_translation_ru": "«第» ставится перед целым числом для обозначения порядкового числительного."
  }
  ```

### CSS Auto-Indentation
- Numbered sentences in grammar and exercise sections automatically indent via CSS
- `padding-left: 2.2em` applies to `[data-numbered="true"]` sentences
- Works for both `.section--grammar` and `.section--exercise`

## Story Content Conventions
- Each sentence in a story must be its own entry in `sentences[]` — never combine two sentences in one `text_original`
- Sections represent visual paragraphs; use multiple sections to break the story into readable chunks
- Story IDs follow the pattern `hsk1-story1`, `hsk1-story2`, etc.
- Sentence IDs follow the pattern `s1-s1`, `s1-s2` (or `s1-s8a`, `s1-s8b` when splitting)
- All sentences must have `pinyin` (stories are learning content)
- `words` array contains word-level data for press-and-hold translation (see format below)
- Story-level `audio_url`: one `story.mp3` file for full playback. Per-sentence `audio_url`: individual `line{N}.mp3` files for tap-to-play.
- Audio-text sync: add `start`/`end` (seconds) to each sentence for auto-highlighting during playback
- Ruby text utility (`rubyText.ts`) handles:
  - Compound pinyin splitting: "Jīntiān" → ["Jīn", "tiān"], "xīngqīliù" → ["xīng", "qī", "liù"]
  - Apostrophe-separated syllables: "kě'ài" → ["kě", "ài"]
  - Erhua merging: 玩儿/点儿 with pinyin "wánr"/"diǎnr" renders as one ruby element (works in compounds like "Yǒudiǎnr" too)
  - Quote stripping: leading/trailing `"` `'` `(` `)` stripped from pinyin tokens before splitting
  - Punctuation passthrough: 。，？！ get no pinyin annotation

### Word-Level Data (`words[]`)
Each sentence has a `words` array with compact word entries for press-and-hold translation:
```json
{ "i": [0, 2], "p": "jīntiān", "t": "bugun", "tr": "сегодня", "h": 1, "l": 5 }
```
- `i`: `[startCharIdx, endCharIdx]` — character range in `text_original` (exclusive end)
- `p`: pinyin for this word
- `t`: Uzbek translation
- `tr`: Russian translation
- `h`: HSK level (1-6), currently all `1` for HSK 1 stories
- `l`: lesson number — ONLY when the **exact word** exists in the flashcard deck with the **same meaning**
  - Exact match required: 猫 (in deck) → `"l": 5` ✓ / 小猫 (not in deck) → no `l` ✓
  - No compound inference: 一个, 看看, 星期六, 家里 etc. → no `l` (not exact deck entries)
  - Contextual meaning must match: 贵 as "expensive" → `"l": 10`, NOT `"l": 1` (你贵姓 honorific)
  - Words not in the deck (supplementary vocab like 厨房, 笑, 走, compounds like 小猫) have no `l` field
  - Validate with: `python3 scripts/populate-words.py validate-all`
- Punctuation (。，！？) is excluded — only meaningful Chinese words
- All 3 stories (74 sentences, ~400 words) have complete word data

## CRITICAL: Chinese Quotation Marks in JSON

**NEVER use Chinese curly quotation marks `"..."` inside JSON strings!**

These characters break JSON parsing because they look like the JSON string delimiter `"`.

When Chinese text contains quoted words like `"有"字句` or `"A……，B呢？"`:

1. **In `text_original`**: Escape the quotes → `\"有\"字句` or use corner brackets `「有」字句`
2. **In `pinyin`**: Use single quotes → `'yǒu' zìjù`
3. **In translations**: Use the target language's quotation style:
   - Uzbek: single quotes `'...'`
   - Russian: guillemets `«...»`

**Example:**
```json
{
  "text_original": "能听懂并使用\"有\"字句表达领有。",
  "pinyin": "Néng tīng dǒng bìng shǐyòng 'yǒu' zìjù biǎodá lǐngyǒu.",
  "text_translation": "'有' gap tuzilmasini tushunish.",
  "text_translation_ru": "Понимать предложения с «有»."
}
```

**Always validate JSON after creating content:**
```bash
python3 -c "import json; json.load(open('content/lessonX-pageY.json'))"
```
