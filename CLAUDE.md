# Kitobee - Interactive Language Textbook Reader

## Project Overview
ReadVo (originally Kitobee) is a DOM-based interactive reading system for language textbooks, designed for Uzbek-speaking students. It supports multiple languages and books (starting with HSK Chinese). It provides sentence-by-sentence audio playback, pinyin/translation toggles, and a clean, textbook-like UI.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS (reading.css) with CSS custom properties
- **State Management**: React hooks (useState, useCallback, useMemo)
- **Storage**: Supabase Storage (images and audio files)
- **Database**: Supabase (project: miruwaeplbzfqmdwacsh)

## URL Structure
```
/                                           # Home - language/book selection
/[language]/[book]                          # Book page - lesson list
/[language]/[book]/lesson/[lessonId]/page/[pageNum]  # Lesson page
/[language]/[book]/flashcards               # Flashcard practice page
```

Example routes:
- `/` - Home page with language categories
- `/chinese/hsk1` - HSK 1 book with lesson list
- `/chinese/hsk1/lesson/1/page/1` - Lesson 1, Page 1
- `/chinese/hsk1/flashcards` - HSK 1 flashcard practice

## Project Structure
```
/Users/ali/Kitobee/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page (language selection)
│   │   ├── error.tsx          # Error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   └── chinese/
│   │       └── hsk1/
│   │           ├── page.tsx   # Book page (lesson list)
│   │           ├── flashcards/page.tsx  # Flashcard practice page
│   │           └── lesson/[lessonId]/page/[pageNum]/page.tsx
│   ├── components/             # React components
│   │   ├── Page.tsx           # Top-level page container
│   │   ├── PageReader.tsx     # Page reader wrapper
│   │   ├── Section.tsx        # Groups sentences by type
│   │   ├── Sentence.tsx       # Atomic unit with words, audio
│   │   ├── LessonHeader.tsx   # Lesson banner (1 DARS format)
│   │   ├── ReaderLayout.tsx   # Layout with fixed header/footer
│   │   ├── ReaderControls.tsx # Pinyin/translation/font controls
│   │   ├── HomePage.tsx       # Home page (language/book selection)
│   │   ├── BookPage.tsx       # Book page (lesson list with pages)
│   │   ├── FlashcardDeck.tsx  # Flashcard session manager (client)
│   │   ├── FlashcardCard.tsx  # Flashcard with 3D flip animation
│   │   ├── MatchingExercise.tsx      # Image-word matching
│   │   ├── FillBlankExercise.tsx     # Dropdown fill-in-the-blank
│   │   ├── MultipleChoiceExercise.tsx # Multiple choice questions
│   │   ├── ImageDescribeExercise.tsx  # Image description with typed input
│   │   └── TableFillExercise.tsx      # Table-based activity exercises
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudioPlayer.ts  # Singleton audio player
│   │   └── useLanguage.ts     # UZ/RU language toggle (localStorage)
│   ├── services/               # Data loading
│   │   ├── index.ts           # Service exports
│   │   ├── content.ts         # Loads JSON from /content
│   │   └── flashcards.ts     # Loads flashcard decks from /content/flashcards
│   ├── styles/
│   │   └── reading.css        # All styles
│   ├── types/
│   │   ├── schema.ts          # TypeScript interfaces
│   │   └── ui-state.ts        # UI state type definitions
│   └── validation/             # Content validation
├── content/                    # JSON lesson data (HSK 1)
│   ├── lesson1-page1.json     # Lessons 1-6: complete (3 pages each)
│   ├── ...                    # Lesson 7: page 1 complete
│   ├── lesson7-page1.json
│   └── flashcards/
│       └── hsk1.json          # HSK 1 flashcard word list
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
- `objectives` - Learning goals with checkboxes (目标)
- `text` - Main dialogue/reading with context narration (课文)
- `dialogue` - Conversational exchanges
- `vocabulary` - Word lists with pinyin and translation (生词)
- `grammar` - Grammar explanations
- `tip` - Helper tips (小语助力)
- `exercise` - Practice activities with checkboxes
- `instruction` - Meta-text instructions
- `activity` - Classroom activities (课堂活动) → `TableFillExercise`
- `tonguetwister` - Tongue twisters (跟读绕口令)
- `matching` - Image-word matching (热身) → `MatchingExercise`
- `fillblank` - Fill-in-the-blank with dropdowns (选词填空) → `FillBlankExercise`
- `multiplechoice` - Multiple choice questions (选择正确答案) → `MultipleChoiceExercise`
- `imagedescribe` - Image description with typed input (看图填空) → `ImageDescribeExercise`
- `bonus` - Bonus content with video player (小语的彩蛋)

## Key Features

### Toggle Controls (in fixed header)
- **Pinyin toggle**: Shows/hides pinyin for all Chinese text
- **Translation toggle**: Shows/hides Uzbek translations
- **Font size**: A-/A+ buttons for accessibility

### Audio Playback
- Sentence-level audio with play/pause toggle (button appears after Chinese text)
- Section-level "Play All" button next to instruction text (e.g., "朗读对话。Read the dialogue aloud.")
- Loading state with spinner
- Singleton player (only one audio at a time)
- Audio files stored in Supabase Storage (`/audio/` bucket)

### Textbook Images
- Original textbook scans displayed above dialogue sections
- Images stored in Supabase Storage (`/images/` bucket)
- Left-aligned, max-width 500px
- Section's `image_url` field for Supabase URLs

### Flashcard Practice
- Standalone page at `/chinese/hsk1/flashcards`
- Cards show Chinese + pinyin (front) → translation (back) with CSS 3D flip animation
- Self-grading: "Bilaman" (Know) / "Bilmayman" (Don't Know) buttons appear after flip
- Session progress bar, completion screen with stats (known vs unknown count)
- Restart options: all cards or only unknown cards (reshuffled)
- Pinyin toggle: hide/show pinyin on front face
- UZ/RU language toggle for translations
- Optional audio playback button per card (uses `useAudioPlayer` singleton)
- Cards shuffled on mount via `useEffect` to avoid hydration mismatch
- Data loaded from `content/flashcards/{bookId}.json`

### Styling Conventions
- Section headers: Red gradient tab with rounded top corners
- Section content: Colored background based on type
- Pinyin: Accent color (blue), italic
- Translation: Secondary text color, italic

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
  "heading": "课文 1",
  "subheading": "Text 1",
  "subheading_ru": "Текст 1",
  "context": "开学第一天，在办公室里...",
  "contextPinyin": "Kāixué dì yī tiān...",
  "contextTranslation": "O'quv yilining birinchi kuni...",
  "contextTranslation_ru": "В первый день учёбы...",
  "instruction": "朗读对话。Read the dialogue aloud.",
  "instruction_ru": "朗读对话。Прочитайте диалог вслух.",
  "audio_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201%201%201.mp3",
  "image_url": "https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/images/HSK-1-1-1.jpg",
  "sentences": [...]
}
```

### Tip with pinyin
```json
{
  "tip": {
    "label": "小语助力 Xiaoyu's Tip",
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
- Only supports ONE `correctOptionId` per sentence
- Use `"_static"` correctOptionId for non-interactive dialogue lines
```json
{
  "type": "fillblank",
  "fillBlankData": {
    "options": [{"id": "opt1", "text": "喝"}],
    "sentences": [{
      "id": "...",
      "parts": [{"type": "text", "content": "我想"}, {"type": "blank"}],
      "correctOptionId": "opt1"
    }]
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

## UI Text Language
- Section headings: Chinese + Uzbek/Russian (e.g., "目标 Maqsadlar", "生词 Yangi so'zlar")
- Lesson badge: "1 DARS" format (number on top, label below)
- Button tooltips: Uzbek
- Translations: Uzbek (default) and Russian (toggle with language button)
- Language toggle: UZ/RU button in header

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
- **Audio bucket**: `/audio/` - sentence and section audio files
- URL format: `https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/{bucket}/{filename}`

## Dialogue Layout
- Speaker names in left column (grid layout, min-width 3em)
- Dialogue text in right column with audio button inline after text
- Pinyin below text (when visible)
- Translation below pinyin (when visible)
- Grid ensures speaker names align vertically across all dialogue lines

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

### Home Page Structure (HomePage.tsx — language/book selection)
```
main.home (max-width container + padding)
├── header.home__hero (red gradient banner, rounded corners)
│   ├── div.home__hero-top (language toggle button)
│   ├── h1.home__logo (📖 ReadVo)
│   └── p.home__tagline
├── section.home__content
│   ├── h2.home__section-title
│   └── div.home__languages
│       └── div.language-group (per language)
│           ├── div.language-group__header (flag + name)
│           └── div.language-group__books
│               └── Link.book-card (per book)
└── footer.home__footer
```

### Book Page Structure (BookPage.tsx — lesson list)
```
main.home (reuses home styling)
├── header.home__hero (with back link + language toggle)
├── section.home__content
│   ├── h2.home__section-title
│   ├── div.home__lessons
│   │   └── article.lesson-card (per lesson)
│   │       └── div.lesson-card__pages (page links)
│   └── Link.home__flashcards-link (flashcard practice)
└── footer.home__footer
```

### Lesson Page Structure
```
div.reader
├── header.reader__header (fixed, full-width background)
│   └── div.reader__header-inner (constrained width)
│       ├── Link.reader__home ("ReadVo")
│       └── ReaderControls (buttons)
├── article.page (constrained width)
│   ├── LessonHeader (if present)
│   └── div.page__content
│       └── Section (multiple)
└── nav.reader__bottom-nav (fixed, full-width background)
    └── div.reader__bottom-nav-inner (constrained width)
        ├── Link/span.reader__nav-btn (prev)
        ├── span.reader__location
        └── Link/span.reader__nav-btn (next)
```

### Flashcard Page Structure
```
main.flashcard-page
├── div.flashcard-page__header (back link + title + toggles)
├── div.flashcard__progress (progress bar)
└── FlashcardCard OR div.flashcard__complete
    ├── div.flashcard__card-container (perspective)
    │   └── div.flashcard__card (3D flip via rotateY)
    │       ├── div.flashcard__face--front (Chinese + audio + pinyin)
    │       └── div.flashcard__face--back (translation + reminder)
    └── div.flashcard__actions (know/don't know buttons)
```

### Key CSS Classes
- `.home` - Home/book page container (matches `.page` width)
- `.language-group` - Language grouping on home page
- `.book-card` - Book card on home page
- `.lesson-card` - Lesson card on book page
- `.page` - Lesson content container
- `.reader__header` - Fixed header (full-width background)
- `.reader__header-inner` - Header content (constrained to match page width)
- `.reader__bottom-nav` - Fixed bottom nav (full-width background)
- `.reader__bottom-nav-inner` - Bottom nav content (constrained to match page width)
- `.flashcard-page` - Flashcard page container
- `.flashcard__card` - 3D flip card (`transform-style: preserve-3d`, `aspect-ratio: 3/4`)
- `.flashcard__face` - Card face (`backface-visibility: hidden`)
- `.flashcard__front-content` - Centers Chinese + audio + pinyin vertically on front
- `.flashcard__audio-btn` - Circular audio play button on card front

### Padding
- Page side padding: `var(--spacing-xl)` (32px)
- Header inner padding: `var(--spacing-md) var(--spacing-xl)` (16px 32px)
- Bottom nav inner padding: `var(--spacing-md) var(--spacing-xl)` (16px 32px)

## Development Notes
- Content is loaded from `/content/*.json` files
- Audio/images stored in Supabase Storage (URLs in JSON)
- All pinyin should use tone marks (not numbers)
- Translations should be in Uzbek with proper apostrophes (o', g', etc.)
- Russian translations use standard Cyrillic

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
