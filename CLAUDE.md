# Kitobee - Interactive Language Textbook Reader

## Project Overview
Kitobee is a DOM-based interactive reading system for language textbooks, designed for Uzbek-speaking students. It supports multiple languages and books (starting with HSK Chinese). It provides sentence-by-sentence audio playback, pinyin/translation toggles, and a clean, textbook-like UI.

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
```

Example routes:
- `/` - Home page with language categories
- `/chinese/hsk1` - HSK 1 book with lesson list
- `/chinese/hsk1/lesson/1/page/1` - Lesson 1, Page 1

## Project Structure
```
/Users/ali/Kitobee/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page (language selection)
│   │   └── chinese/
│   │       └── hsk1/
│   │           ├── page.tsx   # Book page (lesson list)
│   │           └── lesson/[lessonId]/page/[pageNum]/page.tsx
│   ├── components/             # React components
│   │   ├── Page.tsx           # Top-level page container
│   │   ├── Section.tsx        # Groups sentences by type
│   │   ├── Sentence.tsx       # Atomic unit with words, audio
│   │   ├── LessonHeader.tsx   # Lesson banner (1 DARS format)
│   │   ├── ReaderLayout.tsx   # Layout with fixed header/footer
│   │   └── ReaderControls.tsx # Pinyin/translation/font controls
│   ├── hooks/                  # Custom React hooks
│   │   └── useAudioPlayer.ts  # Singleton audio player
│   ├── services/               # Data loading
│   │   └── content.ts         # Loads JSON from /content
│   ├── styles/
│   │   └── reading.css        # All styles
│   ├── types/
│   │   └── schema.ts          # TypeScript interfaces
│   └── validation/             # Content validation
├── content/                    # JSON lesson data (HSK 1)
│   ├── lesson1-page1.json
│   ├── lesson1-page2.json
│   └── ...
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
- `objectives` - Learning goals with checkboxes
- `text` - Main dialogue/reading with context narration
- `vocabulary` - Word lists with pinyin and translation
- `exercise` - Practice activities with checkboxes
- `tip` - Helper tips (小语助力)
- `grammar` - Grammar explanations
- `instruction` - Meta-text instructions

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

### Home Page Structure
```
main.home (max-width container + padding)
├── header.home__hero (red gradient banner, rounded corners)
├── section.home__content
│   ├── h2.home__section-title
│   ├── div.home__lessons
│   │   └── article.lesson-card (per lesson)
│   └── div.home__stats
└── footer.home__footer
```

### Lesson Page Structure
```
div.reader
├── header.reader__header (fixed, full-width background)
│   └── div.reader__header-inner (constrained width)
│       ├── Link.reader__home ("Kitobee")
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

### Key CSS Classes
- `.home` - Home page container (matches `.page` width)
- `.page` - Lesson content container
- `.reader__header` - Fixed header (full-width background)
- `.reader__header-inner` - Header content (constrained to match page width)
- `.reader__bottom-nav` - Fixed bottom nav (full-width background)
- `.reader__bottom-nav-inner` - Bottom nav content (constrained to match page width)
- `.lesson-card` - Home page lesson card

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
