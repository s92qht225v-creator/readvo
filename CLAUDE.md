# Blim - Interactive Language Textbook Reader

## Before Making Changes
Always read the relevant CLAUDE.md file(s) before modifying any code. Check which subdirectory CLAUDE.md files apply to the files you're about to change:
- Editing `content/` files → read `content/CLAUDE.md`
- Editing `content/english/` files → also read `content/english/CLAUDE.md`
- Editing `src/components/` files → read `src/components/CLAUDE.md`
- Editing `src/styles/` files → read `src/styles/CLAUDE.md`

## Project Overview
Blim (formerly ReadVo/Kitobee) is a DOM-based interactive reading system for language textbooks, designed for Uzbek, Russian, and English-speaking students. It supports multiple languages and books (starting with HSK Chinese). It provides sentence-by-sentence audio playback, pinyin/translation toggles, and a clean, textbook-like UI.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS (reading.css) with CSS custom properties
- **Font**: Noto Sans (via `next/font/google`, subsets: latin, cyrillic)
- **i18n**: next-intl ^4.8.3 (URL-based locale routing, `localePrefix: 'always'`)
- **State Management**: React hooks (useState, useCallback, useMemo)
- **Speech-to-Text**: Groq API (`whisper-large-v3`) for Chinese speech recognition
- **AI Grading**: OpenAI API (`gpt-4o-mini`) for borderline answer evaluation
- **Storage**: Supabase Storage (images and audio files)
- **Database**: Supabase (project: miruwaeplbzfqmdwacsh)

## URL Structure
All routes are locale-prefixed (`/{locale}/...`). Unprefixed URLs auto-redirect to `/uz/...` (default locale).
```
/                                           # Redirects to /uz (default locale)
/{locale}                                   # Landing (unauthenticated) or redirect to /{locale}/chinese
/{locale}/chinese                           # Language page - tabbed catalog (6 tabs)
/{locale}/chinese?tab=[tabId]               # Language page with specific tab pre-selected
/{locale}/chinese/hsk1/lesson/[lessonId]/page/[pageNum]  # Lesson page
/{locale}/chinese/hsk1/flashcards           # Flashcard list page (per-lesson cards)
/{locale}/chinese/hsk1/flashcards/[lessonId] # Flashcard practice for specific lesson
/{locale}/chinese/hsk1/dialogues            # Dialogues list page
/{locale}/chinese/hsk1/dialogues/[dialogueId] # Dialogue reader page (uses StoryReader)
/{locale}/chinese/hsk1/karaoke/[songId]     # Karaoke player page
/{locale}/chinese/hsk1/writing/[setId]      # Writing practice page (per character set)
/{locale}/chinese/hsk1/grammar/[slug]       # Grammar page (20 slugs)
/{locale}/chinese/hsk2/flashcards/[lessonId] # HSK 2 flashcard practice
/{locale}/chinese/hsk3/flashcards/[lessonId] # HSK 3 flashcard practice
/{locale}/login                             # Login page
/{locale}/payment                           # Payment page
/{locale}/blog                              # Blog list
/{locale}/blog/[slug]                       # Blog post
```

Example routes:
- `/uz` - Landing page in Uzbek
- `/en/chinese` - Chinese language page with tabs (English UI)
- `/ru/chinese?tab=flashcards` - Language page with Flashcards tab active (Russian UI)
- `/uz/chinese/hsk1/lesson/1/page/1` - Lesson 1, Page 1
- `/en/chinese/hsk1/flashcards/1` - Flashcard practice for lesson 1
- `/uz/chinese/hsk1/dialogues/hsk1-dialogue1` - Dialogue reader
- `/en/chinese/hsk1/writing/hsk1-set1` - Writing practice for character set 1
- `/en/blog/hsk-1-sozlar-royxati` - Blog post in English

## Project Structure
```
/Users/ali/ReadVo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx         # Root layout (html, font, analytics)
│   │   ├── [locale]/          # Locale-prefixed routes
│   │   │   ├── layout.tsx     # Locale layout (NextIntlClientProvider + AuthProvider)
│   │   │   ├── page.tsx       # Landing page / home
│   │   │   ├── error.tsx      # Error boundary
│   │   │   ├── not-found.tsx  # 404 page
│   │   │   ├── login/page.tsx # Login page
│   │   │   ├── payment/page.tsx # Payment page
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx       # Blog list
│   │   │   │   └── [slug]/page.tsx # Blog post
│   │   │   └── chinese/
│   │   │       ├── page.tsx       # Language page (tabbed catalog)
│   │   │       └── hsk1/
│   │   │           ├── flashcards/
│   │   │           │   ├── page.tsx       # Flashcard list page
│   │   │           │   └── [lessonId]/page.tsx  # Flashcard practice
│   │   │           ├── dialogues/
│   │   │           │   ├── page.tsx       # Dialogues list page
│   │   │           │   └── [dialogueId]/page.tsx  # Dialogue reader
│   │   │           ├── karaoke/
│   │   │           │   └── [songId]/page.tsx   # Karaoke player
│   │   │           ├── writing/
│   │   │           │   └── [setId]/
│   │   │           │       ├── page.tsx              # Writing practice (server)
│   │   │           │       └── WritingPracticePage.tsx # Writing practice (client)
│   │   │           └── grammar/[slug]/page.tsx # Grammar pages (20 slugs)
│   │   │       ├── hsk2/
│   │   │       │   └── flashcards/
│   │   │       │       └── [lessonId]/page.tsx  # HSK 2 flashcard practice
│   │   │       └── hsk3/
│   │   │           └── flashcards/
│   │   │               └── [lessonId]/page.tsx  # HSK 3 flashcard practice
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── route.ts       # Admin data + actions (GET/POST)
│   │   │   │   └── check/route.ts # Admin password verification
│   │   │   ├── payment/
│   │   │   │   ├── route.ts       # Payment submission (POST)
│   │   │   │   └── status/route.ts # Payment status (GET)
│   │   │   ├── subscription/route.ts # Active subscription (GET)
│   │   │   ├── progress/route.ts  # User progress (GET/POST)
│   │   │   ├── corrections/route.ts # Correction reports via Telegram (POST)
│   │   │   ├── transcribe/route.ts # Speech-to-text + AI grading (POST)
│   │   │   ├── stars/route.ts     # Star progress read/write (GET/POST)
│   │   │   ├── flashcards/
│   │   │   │   ├── hsk1/route.ts          # HSK 1 flashcard data (GET)
│   │   │   │   └── topic/[topicId]/route.ts # Topic flashcard data (GET)
│   │   │   └── auth/
│   │   │       ├── telegram/
│   │   │       │   ├── init/route.ts     # Telegram Widget auth URL (GET)
│   │   │       │   └── callback/route.ts # HMAC verify + user create + session (POST)
│   │   │       ├── register-nonce/route.ts # Session nonce registration (POST)
│   │   │       └── session-check/route.ts # Session nonce validation (POST/DELETE)
│   │   └── auth/telegram/complete/page.tsx  # Telegram login completion (outside [locale])
│   ├── components/             # React components (see src/components/CLAUDE.md)
│   │   ├── Page.tsx           # Top-level page container
│   │   ├── PageReader.tsx     # Page reader wrapper
│   │   ├── Section.tsx        # Groups sentences by type
│   │   ├── Sentence.tsx       # Atomic unit with words, audio
│   │   ├── LessonHeader.tsx   # Lesson banner (1 DARS format)
│   │   ├── ReaderLayout.tsx   # Layout with fixed header/footer
│   │   ├── ReaderControls.tsx # Header controls (focus, language, font)
│   │   ├── HomePage.tsx       # Home page (language selection cards)
│   │   ├── PageFooter.tsx    # Shared footer: correction button + "Blim — ..." text
│   │   ├── BannerMenu.tsx    # Shared hamburger menu for all banner pages
│   │   ├── LanguagePage.tsx   # Language page (tabbed: Dialog, Yozish, Flesh, KTV, Tika, Test)
│   │   ├── HanziWriterPractice.tsx  # Writing tab: Leitner SRS character practice (home/practice/done views)
│   │   ├── HanziCanvas.tsx          # Canvas-based hanzi stroke engine (retina, grading, hints, reveal)
│   │   ├── BookPage.tsx       # Book page (lesson list with banner+tabs, reusable for English)
│   │   ├── DialoguesPage.tsx   # Dialogues list page (HSK level tabs)
│   │   ├── StoryReader.tsx    # Dialogue reader with ruby pinyin, translation panel, audio bar
│   │   ├── FlashcardListPage.tsx # Flashcard lesson list with banner+tabs
│   │   ├── FlashcardDeck.tsx  # Flashcard session manager (client)
│   │   ├── FlashcardCard.tsx  # Flashcard with 3D flip animation
│   │   ├── KaraokePlayer.tsx  # Karaoke player with synced lyrics, ruby pinyin, controls
│   │   ├── MatchingExercise.tsx      # Image-word matching
│   │   ├── FillBlankExercise.tsx     # Dropdown fill-in-the-blank
│   │   ├── MultipleChoiceExercise.tsx # Multiple choice questions
│   │   ├── ImageDescribeExercise.tsx  # Image description with typed input
│   │   ├── TableFillExercise.tsx      # Table-based activity exercises
│   │   ├── TypedFillBlankExercise.tsx # Typed fill-in-blank (English exercises)
│   │   ├── ErrorCorrectionExercise.tsx # Error correction (English exercises)
│   │   ├── WordChoiceExercise.tsx     # Word choice / circle correct word (English exercises)
│   │   ├── TextErrorExercise.tsx      # Text error / find & correct errors in passage (English exercises)
│   │   ├── SpeakingMashq.tsx         # Speaking practice with AI grading (Groq + OpenAI)
│   │   ├── DialogueRolePlay.tsx     # Dialogue role-play speaking quiz (2 rounds, A/B roles)
│   │   ├── WritingTest.tsx           # Writing test with HanziCanvas + star scoring
│   │   ├── CoachMark.tsx             # Tooltip coach marks + multi-step tours
│   │   ├── RubyText.tsx              # Shared ruby pinyin component (<ruby>/<rt>)
│   │   ├── DialogueReader.tsx        # Dialogue reader (dialog/vocab/grammar/practice tabs, coach tour)
│   │   ├── DialoguesPage.tsx         # Dialogues list page (HSK level tabs)
│   │   ├── FlashcardListPage.tsx     # Flashcard lesson list with banner+tabs
│   │   ├── FlashcardCard.tsx         # Flashcard with 3D flip animation
│   │   ├── BookPage.tsx              # Book page (lesson list with banner+tabs)
│   │   ├── LoginPage.tsx             # Login page (Telegram auth button)
│   │   ├── BlogList.tsx              # Blog list page
│   │   ├── BlogPostView.tsx          # Blog post viewer
│   │   ├── YandexPageView.tsx        # Yandex Metrica page view tracker
│   │   ├── MetaPageView.tsx          # Meta (Facebook) Pixel page view tracker
│   │   ├── AdminPanel.tsx            # Admin panel (payments + users management)
│   │   ├── PaymentPage.tsx           # Payment page (plan selection + screenshot upload)
│   │   └── Paywall.tsx               # Paywall overlay (trial expired)
│   ├── i18n/
│   │   ├── request.ts         # next-intl server config (reads locale from URL)
│   │   ├── routing.ts         # Locale routing config (locales, defaultLocale, localePrefix)
│   │   └── navigation.ts      # createNavigation exports (Link, redirect, usePathname, useRouter)
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudioPlayer.ts  # Singleton audio player
│   │   ├── useLanguage.ts     # UZ/RU/EN language toggle (wraps useLocale + useRouter from @/i18n/navigation)
│   │   ├── useAuth.tsx        # Telegram auth provider + context
│   │   ├── useRequireAuth.ts  # Auth guard (redirects to / if not logged in)
│   │   ├── useTrial.ts       # Trial/subscription status hook
│   │   └── useStars.ts       # Star progress read/write hook (speaking practice)
│   ├── lib/                      # Supabase clients & utilities
│   │   ├── supabase.ts        # Supabase helpers (getImageUrl, uploadImage)
│   │   ├── supabase-client.ts # Browser client (anon key, respects RLS)
│   │   ├── supabase-server.ts # Server client (service role, bypasses RLS)
│   │   ├── jwt.ts             # Local JWT decode (getUserIdFromJWT, getUserFromJWT)
│   │   └── transcribe/          # Speech transcription & scoring
│   │       ├── whisper.ts     # Groq + OpenAI Whisper fallback (3s timeout)
│   │       └── scorer.ts      # Levenshtein + GPT-4o mini judge
│   ├── utils/                    # Utility functions
│   │   ├── rubyText.ts        # Pinyin-to-character alignment for ruby annotations
│   │   ├── jsonLd.ts          # JSON-LD structured data helpers (breadcrumb, grammar term, etc.)
│   │   ├── calculateStars.ts  # Star rating calculation from speaking quiz scores
│   │   ├── shuffle.ts         # Fisher-Yates array shuffle
│   │   └── analytics.ts       # Unified analytics (Meta Pixel, Yandex Metrica, GA4)
│   ├── services/               # Data loading
│   │   ├── index.ts           # Service exports
│   │   ├── content.ts         # Loads JSON from /content
│   │   ├── dialogues.ts     # Loads dialogue JSON from /content/dialogues
│   │   ├── flashcards.ts     # Loads flashcard decks from /content/flashcards
│   │   ├── karaoke.ts        # Loads karaoke song JSON from /content/karaoke
│   │   ├── writing.ts        # Writing practice sets data (WRITING_SETS through WRITING_SETS_HSK6, HanziWord type)
│   │   ├── blog.ts           # Blog posts data loading
│   │   └── english-content.ts # Loads English content from /content/english
│   ├── styles/
│   │   └── reading.css        # All styles (see src/styles/CLAUDE.md)
│   ├── types/
│   │   ├── schema.ts          # TypeScript interfaces
│   │   └── ui-state.ts        # UI state type definitions
│   └── validation/             # Content validation
├── content/                    # JSON lesson data (see content/CLAUDE.md)
│   ├── lesson1-page1.json     # Lessons 1-15 (3 pages each, 45 total)
│   ├── ...
│   ├── lesson15-page3.json
│   ├── flashcards/
│   │   └── hsk1.json          # HSK 1 flashcard word list
│   ├── dialogues/
│   │   └── hsk1/
│   │       └── dialogue1.json # Dialogue content files (uses StoryReader format)
│   ├── karaoke/
│   │   └── yueliang.json      # Karaoke song data (per-character timestamps + pinyin)
│   └── english/               # English content (see content/english/CLAUDE.md)
│       └── destination-b1/
│           └── unit1-page1.json  # English grammar content (Destination B1)
├── messages/                   # next-intl translation files (22 namespaces, ~348 lines each)
│   ├── uz.json                # Uzbek UI translations
│   ├── ru.json                # Russian UI translations
│   └── en.json                # English UI translations
├── .env.local                  # Supabase + Telegram + Groq + OpenAI credentials
└── public/
    ├── logo.svg               # White text logo (for dark backgrounds: banner, karaoke)
    ├── logo-blue.svg          # Blue text logo #71a3da (for light backgrounds: landing nav)
    ├── logo-red.svg           # Red text logo #dc2626 (for grey backgrounds: reader headers)
    └── audio/                  # Local MP3 audio files (legacy)
```

## Subdirectory CLAUDE.md Files
- **`content/CLAUDE.md`** — Content JSON formats, authoring conventions, formatting standards
- **`content/english/CLAUDE.md`** — English (Destination B1) content guide: grammar tables, tips, exercises
- **`src/components/CLAUDE.md`** — Component behavior, layout structures, feature details
- **`src/styles/CLAUDE.md`** — CSS class reference, padding specs, mobile responsive, button sizes

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
- `typedfillblank` - Typed fill-in-blank → `TypedFillBlankExercise` (English exercises)
- `errorcorrection` - Error correction → `ErrorCorrectionExercise` (English exercises)
- `wordchoice` - Word choice (circle correct word/phrase) → `WordChoiceExercise` (English exercises)
- `texterror` - Text error (find & correct errors in passage) → `TextErrorExercise` (English exercises)

## UI Text Language
- **Three UI languages**: Uzbek (uz), Russian (ru), English (en)
- **Default language**: English (`DEFAULT_LANGUAGE = 'en'` in `ui-state.ts`)
- Section headings: **Empty** (all Chinese headings removed — `heading` field is `""`)
- Subheadings: Trilingual (e.g., "Yangi so'zlar" / "Новые слова" / "New Words")
- Instructions: Trilingual — **NO Chinese text** in any `instruction`/`instruction_ru`/`instruction_en` fields
- Lesson badge: "1 DARS" format (number on top, label below)
- Button tooltips: Language-dependent (Uzbek/Russian/English)
- Translations: Uzbek (default), Russian, or English (toggle with language button)
- Tab labels (UZ): Dialog | Yozish | Flesh | KTV | Tika | Test
- Tab labels (RU): Диалог | Письмо | Флеш | KTV | Грамматика | Тесты
- Tab labels (EN): Dialogue | Writing | Flash | KTV | Grammar | Tests
- Tab IDs: `dialogues` | `writing` | `flashcards` | `karaoke` | `grammar` | `tests`
- Language selector: Inside hamburger menu on banner pages (`<select>` dropdown with O'zbekcha/Русский/English options under "Til"/"Язык"/"Language" label, 中文 under "Men o'rganaman"/"Я изучаю"/"I'm learning" label). Lesson/dialogue reader headers use 3-way cycle toggle button (UZ→RU→EN→UZ, showing the CURRENT language label: UZ/RU/EN).
- **Content translations**: All lesson content has trilingual translations via `text_translation` (UZ), `text_translation_ru` (RU), `text_translation_en` (EN). Components should use `_en` when language is English, falling back to Uzbek if `_en` field is missing.

## Trilingual Content
The **UI** and **lesson content** both support three languages (Uzbek, Russian, English). All 45 lesson JSON files (lessons 1-15, 3 pages each) have full trilingual translations:
- `text_translation` / `text_translation_ru` / `text_translation_en` - sentence translations
- `contextTranslation` / `contextTranslation_ru` / `contextTranslation_en` - context translations
- `instruction` / `instruction_ru` / `instruction_en` - instruction text
- `subheading` / `subheading_ru` / `subheading_en` - section subheadings
- `tip.translation` / `tip.translation_ru` / `tip.translation_en` - tip translations
- `titleTranslation` / `titleTranslation_ru` / `titleTranslation_en` - lesson header titles (page 1)

### Trilingual Content (Blog & Dialogues)
Some content types support full trilingual translations with optional `_en` fields:
- **Blog posts**: `title_en`, `description_en`, `intro_en`, section `heading_en` / `body_en` — all optional, fallback to Uzbek
- **Dialogue titles**: `titleTranslation_en` — English subtitle for all 47 dialogue JSONs
- **Blog service**: `src/services/blog.ts` — `BlogPost` and `BlogSection` interfaces include optional `_en` fields
- **Dialogue service**: `src/services/dialogues.ts` — `DialogueInfo` and `DialoguePage` include `titleTranslation_en?`

### Internationalization (i18n) Architecture
- **Library**: next-intl ^4.8.3 with URL-based locale routing (`localePrefix: 'always'`)
- **Locales**: `['uz', 'ru', 'en']`, default: `'uz'`
- **URL pattern**: `/{locale}/...` (e.g. `/uz/chinese`, `/en/blog`). Unprefixed URLs auto-redirect to `/uz/...`
- **Routing config**: `src/i18n/routing.ts` — `defineRouting()` with locales, defaultLocale, localePrefix
- **Navigation**: `src/i18n/navigation.ts` — `createNavigation(routing)` exports `{ Link, redirect, usePathname, useRouter }`. All components use these instead of `next/link` and `next/navigation`.
- **Middleware**: `src/middleware.ts` — wraps `createMiddleware(routing)` with custom logic to redirect invalid 2-letter locale prefixes (e.g. `/fr/chinese` → `/uz/chinese`)
- **Server-side**: `src/i18n/request.ts` uses `getRequestConfig()` from next-intl, reads locale from URL
- **Root layout**: `src/app/layout.tsx` — minimal shell: `<html>`, font, analytics. Dynamic `<html lang>` from `getLocale()`
- **Locale layout**: `src/app/[locale]/layout.tsx` — `NextIntlClientProvider` + `AuthProvider` + `setRequestLocale()`
- **Message files**: `messages/uz.json`, `messages/ru.json`, `messages/en.json` — 22 namespaces, ~348 lines each
- **Current usage**: Message files exist but are **NOT yet consumed by components**. All ~48 components use inline trilingual objects: `({ uz: '...', ru: '...', en: '...' } as Record<string, string>)[language]`. Future migration will replace with `useTranslations()`.
- **useLanguage hook**: Thin wrapper around `useLocale()` + `useRouter().replace(pathname, { locale })` from `@/i18n/navigation`. URL is single source of truth. Returns `[Language, toggle, set]`.
- **Language type**: `Language = 'uz' | 'ru' | 'en'` (defined in `src/types/ui-state.ts`)
- **LANGUAGES constant**: `[{ code: 'uz', label: 'Uzbek', nativeLabel: "O'zbek" }, { code: 'ru', label: 'Russian', nativeLabel: 'Русский' }, { code: 'en', label: 'English', nativeLabel: 'English' }]`
- **Auth callback**: `src/app/auth/telegram/complete/page.tsx` lives outside `[locale]`, reads locale from localStorage to construct redirect URL
- **Metadata**: All pages use `generateMetadata()` with trilingual titles/descriptions and `alternates.languages` for hreflang

## Commands
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Authentication & User Management
- **Provider**: Telegram Login Widget (HMAC-SHA256 verification with bot token)
- **Hook**: `src/hooks/useAuth.tsx` — `AuthProvider` wraps entire app in `layout.tsx`
- **Auth guard**: `src/hooks/useRequireAuth.ts` — redirects unauthenticated users to `/`. Used in all content page components.
- **Auth flow**:
  1. User clicks "Telegram orqali kirish" → `loginWithTelegram()` calls `/api/auth/telegram/init`
  2. Browser redirects to Telegram OAuth Widget URL
  3. Telegram redirects back to `/auth/telegram/complete#tgAuthResult=...`
  4. `complete/page.tsx` decodes auth data, POSTs to `/api/auth/telegram/callback`
  5. Callback verifies HMAC hash, creates/finds Supabase user, generates session via `generateLink` + `verifyOtp`
  6. Client stores session nonce in localStorage, then calls `supabase.auth.setSession()`
  7. `onAuthStateChange` picks up the session, redirects to `/chinese`
- **User object**: `{ id, email, name, avatar_url, created_at }` from `user_metadata`
- **Synthetic email**: `tg_{telegramId}@telegram.blim` (Telegram users may not have email)
- **Methods**: `loginWithTelegram()`, `logout()`, `getAccessToken()` (JWT for API calls)
- **Supabase clients**:
  - Client (anon key): `src/lib/supabase-client.ts` — for browser, respects RLS
  - Server (service role): `src/lib/supabase-server.ts` — singleton `getSupabaseAdmin()`, bypasses RLS. Created with `autoRefreshToken: false` and `persistSession: false` (critical — prevents singleton from stealing refresh tokens via `verifyOtp` side effects). All API routes use this shared singleton for admin operations (admin, payment, subscription, auth). Per-request anon-key clients are still created inline for RLS-scoped queries with user JWT tokens.
- **User lookup**: Callback tries `createUser` first. If user already exists, it proceeds directly to `generateLink` + `verifyOtp`, then gets `userId` from `sessionData.session.user.id`. No `listUsers()` call (it only returns first ~50 users and breaks at scale). Metadata is always updated via `updateUserById` after session creation.
- **API routes**:
  - `GET /api/auth/telegram/init` — returns Telegram Widget auth URL
  - `POST /api/auth/telegram/callback` — verifies HMAC, creates user, generates session, upserts nonce to `active_sessions` table
  - `POST /api/auth/session-check` — validates session nonce against `active_sessions` table
  - `DELETE /api/auth/session-check` — deletes `active_sessions` row on manual logout (fire-and-forget from client)
- **Env vars**: `TELEGRAM_PAYMENT_BOT_TOKEN` (used for both payment notifications and login HMAC verification)

### Single-Device Session Enforcement
Only one device can be logged in at a time. New login kicks previous session.
- **How it works**: Each login generates a random nonce (`crypto.randomBytes(16)`), stored in both `active_sessions` DB table and client localStorage (`blim-session-nonce`). Every 30 seconds, the client sends its nonce to `/api/auth/session-check` which compares against the DB. Mismatch → local sign out.
- **Database table**: `active_sessions` (user_id UUID PK, session_nonce TEXT, updated_at TIMESTAMPTZ). One row per user, upserted on each login. Deleted on manual logout.
- **Sign out scope**: Kicked devices use `supabase.auth.signOut({ scope: 'local' })` — critical to avoid revoking the new device's session (Supabase default `scope: 'global'` revokes ALL sessions server-side).
- **Login grace period**: 60-second grace period after `SIGNED_IN` event where session checks are skipped, preventing race conditions during login.
- **Nonce write order**: In `complete/page.tsx`, nonce is written to localStorage BEFORE `setSession()` because `setSession` triggers `onAuthStateChange` which starts the session-check interval.

## Trial & Subscription System
- **Hook**: `src/hooks/useTrial.ts`
- **Trial duration**: 7 days from `user.created_at`
- **Free content** (always accessible): Lesson 1 (all pages), Flashcards lesson 1
- **Paid content** (require active trial or subscription): Lessons 2-15, all dialogues, all karaoke songs, flashcards 2+
- **Trial status**: `{ daysLeft, isTrialActive, isTrialExpired, hasSubscription, subscriptionDaysLeft }`
- **Subscription takes priority**: If valid subscription exists, `isTrialActive = true`
- **Paywall component**: `src/components/Paywall.tsx` — shown when `trial.isTrialExpired && !isFreeContent`
- **Paywall locations**: ReaderLayout, StoryReader, FlashcardDeck, KaraokePlayer
- **Subscription API**: `GET /api/subscription` — returns active subscription (ends_at > now)
- **BannerMenu display**: Active subscription shows "Obuna: N kun qoldi" / "Subscription: N days left", expired shows "Sinov muddati tugadi" / "Trial period expired" (red), trial shows "Sinov: N kun qoldi" / "Trial: N days left" (yellow)

## Payment System
- **Component**: `src/components/PaymentPage.tsx`
- **Route**: `/payment` (`src/app/payment/page.tsx`)
- **Plans**: 1 month (50,000 so'm), 3 months (129,000, -14%), 6 months (229,000, -24%), 12 months (399,000, -33%)
- **Flow**: User selects plan → uploads payment screenshot → screenshot stored in Supabase `/payments` bucket → `payment_requests` record created with `status: 'pending'` → Telegram notification sent to admin → admin approves/rejects in admin panel
- **API endpoints**:
  - `POST /api/payment` — accepts FormData (plan, amount, screenshot), uploads to Supabase, creates payment request, sends Telegram notification
  - `GET /api/payment/status` — returns user's most recent payment request
- **Status screens**: Active subscription, pending payment, rejected payment, success confirmation
- **Database tables**:
  - `payment_requests`: user_id, user_email, plan, amount, screenshot_url, status ('pending'|'approved'|'rejected'|'cancelled'), created_at
  - `subscriptions`: user_id, user_email, plan, starts_at, ends_at, created_at

## Telegram Integration
- **Payment bot**: Sends notification to admin chat when user submits payment screenshot
- **Message format**: Yangi to'lov! + email, plan label, formatted amount, screenshot URL
- **Env vars**: `TELEGRAM_PAYMENT_BOT_TOKEN`, `TELEGRAM_PAYMENT_CHAT_ID`
- **Called in**: `/api/payment` route immediately after payment request creation
- **Error handling**: Logs to console if Telegram API fails, doesn't block payment creation

## Admin Panel
- **Component**: `src/components/AdminPanel.tsx`
- **Access**: `/?admin=true` → password login via `POST /api/admin/check`
- **API**: `src/app/api/admin/route.ts` (GET: fetch data, POST: perform actions)
- **Auth**: Password verified via `x-admin-password` header, uses shared `getSupabaseAdmin()` singleton
- **User listing**: Paginates `listUsers({ page, perPage: 1000 })` in a loop to fetch all users (default returns only ~50)

### Payments Tab
- Lists all `payment_requests` with email, plan, amount, status, screenshot
- Filter by email search
- Screenshot preview overlay
- Actions: Approve (creates subscription + updates status), Reject (updates status)

### Users Tab
- Lists all Supabase auth users with name, email, signup date
- Shows active subscription status with days remaining
- Actions: +Kun (add days), -Kun (remove days), Bekor qilish (cancel), Obuna berish (grant N-day subscription)

### Dashboard Stats
- Total users, active subscriptions, total revenue, pending payments count

## User Progress Tracking
- **API**: `src/app/api/progress/route.ts` (GET: retrieve, POST: save)
- **Auto-saved**: ReaderLayout `useEffect` records page visit on load
- **Database**: `user_progress` table — `user_id, lesson_id, page_num, completed, last_visited_at`
- **Upsert**: Creates or updates on conflict `(user_id, lesson_id, page_num)`

## Speaking Practice (Speaking Mashq)
- **Component**: `src/components/SpeakingMashq.tsx` — AI-powered speaking quiz embedded in grammar pages
- **API route**: `POST /api/transcribe` — accepts audio blob + expected Chinese text, returns grading result
- **Architecture** (modular, 3 files):
  - `src/lib/transcribe/whisper.ts` — Groq (primary, 3s timeout) + OpenAI (fallback) transcription
  - `src/lib/transcribe/scorer.ts` — Levenshtein distance + GPT-4o mini judge for borderline cases
  - `src/app/api/transcribe/route.ts` — route handler with JWT auth + daily usage limit
- **Transcription pipeline** (`whisper.ts`):
  1. **Groq** (`whisper-large-v3-turbo`, 3s AbortController timeout, `verbose_json` format) — primary, fast. Returns `noSpeechProb` (avg of segment `no_speech_prob` values).
  2. **OpenAI** (`whisper-1`, no timeout, plain JSON) — fallback on Groq 429/500+/timeout. `noSpeechProb` = 0 (not available).
  3. Audio buffered as `ArrayBuffer` first, FormData rebuilt for each provider (never reused)
- **Scoring pipeline** (`scorer.ts`):
  - Normalize: trim, lowercase, remove Chinese punctuation + spaces + digits (`\d`)
  - **CRITICAL_CHARS check**: Before Levenshtein thresholds, checks if a meaning-changing character (我你他她它这那有没不是很都也吗呢吧啊) was substituted/dropped. If so, skips straight to GPT judge (prevents e.g. 我→你 from being auto-accepted at dist 1).
  - Short (≤4 chars): exact → correct, else → GPT judge
  - Normal (5–8 chars): dist 0–1 → correct, 2–4 → GPT, 5+ → wrong
  - Long (9+ chars): dist 0–1 → correct, 2–4 → GPT, 5+ → wrong
  - GPT-4o mini judge: temperature 0, max 80 tokens, explicit language enforcement (`IMPORTANT: feedback MUST be in ${langLabel} language only`), returns `{ result, feedback }`. Falls back to Levenshtein on failure.
- **Daily usage limit**: 100 requests/user/day. Table `transcription_usage` (user_id, date, count, PK (user_id, date)). Checked before transcription, incremented after success via upsert.
- **Auth**: JWT Bearer token required. Client sends via `getAccessToken()` from `useAuth()`.
- **Grading results**: `correct` (green) | `close` (amber, distinct UI phase) | `wrong` (red) | `no_speech` (neutral, doesn't consume attempt)
- **Error responses**: 401 (no auth), 429 `limit_reached`, 503 `transcription_failed`
- **Limit reached UI**: Both `SpeakingMashq` and `DialogueRolePlay` show a dismiss/Next button when daily limit is hit (prevents user from being stuck)
- **Flow**: User sees translation prompt → speaks Chinese → audio recorded (max 6s) → transcribed → graded → feedback shown
- **Two attempts**: First wrong → retry with hint. Second wrong → shadowing mode (listen + repeat). No-speech doesn't count as attempt.
- **Shadowing mode**: Plays correct audio, user repeats. Tracked via `shadowingUsedRef` (affects star rating).
- **Audio playback**: Local grammar audio files (`/audio/hsk1/grammar/{text}.mp3`) with Web Speech API TTS fallback
- **Traditional→Simplified**: `TRAD_TO_SIMP` map normalizes Whisper output (Whisper sometimes returns traditional characters)
- **Silence detection**: Client-side (blob < 3KB) + server-side (empty text after normalization OR `noSpeechProb > 0.6` from Groq `verbose_json`)
- **Trilingual UI**: All 40+ UI strings in UZ/RU/EN via inline `Record<Language, string>` pattern
- **Used in 6 grammar pages**: GrammarShiPage (是), GrammarMaPage (吗), GrammarDePage (的), GrammarSheiPage (谁), GrammarShenmePage (什么), GrammarNaPage (哪)
- **Question format**: `{ uz: string; zh: string; pinyin: string }` — each grammar page defines its own `speakingQuestionsData` array
- **Env vars**: `GROQ_API_KEY` (speech recognition), `OPENAI_API_KEY` (answer grading)

### Dialogue Role-Play Quiz
- **Component**: `src/components/DialogueRolePlay.tsx` — 2-round dialogue speaking quiz with chat-style layout
- **Props**: `lines: DialogueLine[]`, `dialogueId: string`, `accentColor: string`, `language: Language`, `onComplete: (stars: number) => void`
- **Data type**: `DialogueLine = { speaker: 'A' | 'B', zh: string, pinyin: string, uz: string, audio_url?: string }`
- **Integrated in**: `DialogueReader.tsx` as the 4th tab ("Mashq" / "Практика" / "Practice"). Lines extracted from dialogue sentences with `speaker` field.
- **Test unit splitting**: Long lines (>15 chars per sentence) split on `。？！` into individual `TestUnit`s. Each `TestUnit` tracks `originalIndex` for bubble state mapping.
- **UI layout**: Full dialogue visible as chat bubbles throughout quiz. A lines left-aligned (light blue bg), B lines right-aligned (white bg). Answered learner lines show ✓/✗ with Chinese text. Future lines show muted Uzbek. Active line highlighted with accent border. Mic area sits below the chat, not inline.
- **Auto-scroll**: Active bubble scrolls into view via `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- **Round logic**:
  - Round 1: learner = B, app = A. App plays A line audio first → learner speaks B line → API grading
  - Round 2: learner = A, app = B. Learner speaks A line first → API grading → app plays B response audio
- **App line audio**: Round 1: plays automatically before learner speaks (app initiates). Round 2: plays after learner answers correctly (app responds). Speak button disabled during playback.
- **Attempt logic**: First wrong → retry (no answer revealed). Second wrong → reveal answer + shadowing step → advance.
- **Audio**: Uses dialogue sentence `audio_url` (Supabase) when available, falls back to `/audio/hsk1/grammar/{text}.mp3`, then `speechSynthesis` TTS
- **Screens**: permission → quiz (round 1) → between (recap + start round 2) → quiz (round 2) → complete (stars + recap)
- **Star calculation**: 3★ = all correct + no shadowing, 2★ = max 1 wrong + no shadowing, 1★ = at least 1 correct
- **API**: Reuses existing `POST /api/transcribe` (same auth, daily limit, Groq/OpenAI pipeline)
- **Supabase table**: `dialogue_progress` (user_id UUID, dialogue_id TEXT, stars INT, completed_at TIMESTAMPTZ) — saves only if new stars > existing
- **CSS classes**: `.drp`, `.drp__chat`, `.drp__bubble`, `.drp__bubble--a`, `.drp__bubble--b`, `.drp__mic-area`, `.drp__prompt`, `.drp__btn`

### Star Rating System
- **Hook**: `src/hooks/useStars.ts` — reads/writes star progress per section type
- **Calculation**: `src/utils/calculateStars.ts` — 0-3 stars based on scores + shadowing usage
  - 3 stars: all correct, no shadowing
  - 2 stars: max 1 wrong, no shadowing
  - 1 star: at least 1 correct
  - 0 stars: no correct answers
- **API**: `GET/POST /api/stars` — JWT auth, upserts to `star_progress` table
- **Database table**: `star_progress` — `user_id UUID, section_type TEXT, section_id TEXT, stars INT (0-3), completed_at TIMESTAMPTZ`, PK `(user_id, section_type, section_id)`
- **Display**: Grammar cards on Language Page show star ratings (★★★) fetched via `useStars('grammar')`
- **Optimistic updates**: Stars saved locally immediately, persisted to server async (silent failure OK)

## Supabase Storage
- **Project URL**: https://miruwaeplbzfqmdwacsh.supabase.co
- **Images bucket**: `/images/` - original textbook scans (HSK-1-1-1.jpg, HSK-1-2-1.jpg, etc.)
- **Audio bucket**: `/audio/` - all lesson audio under `HSK 1/` parent folder
- URL format: `https://miruwaeplbzfqmdwacsh.supabase.co/storage/v1/object/public/audio/HSK%201/HSK%20{lesson}-{page}/{filename}.mp3`

### Audio URL Patterns
All HSK 1 lesson audio lives under a single parent folder `HSK 1/` in Supabase Storage.
Subfolder structure: `HSK 1/HSK {lesson}-{page}/`
- **Section dialogue audio**: `dialogue.mp3` — full dialogue playback
- **Per-sentence dialogue audio**: `dialogue1.mp3`, `dialogue2.mp3`, etc. — individual sentence playback
- **Vocabulary word audio**: `{pinyin}.mp3` — pinyin stripped of tones/spaces, lowercase (e.g., `nihao.mp3`, `laoshi.mp3`)
- **Tongue twister audio**: `tongue.mp3`
- **No vocab section "Play All" audio**: Vocabulary sections do not have section-level `audio_url` (no `vocab.mp3` files exist). Individual word audio works via per-sentence URLs.
- Example: Lesson 5, Page 2 dialogue sentence 3 → `HSK 1/HSK 5-2/dialogue3.mp3`
- Example: Lesson 8, Page 1 vocab word 学校 (xuéxiào) → `HSK 1/HSK 8-1/xuexiao.mp3`
- **Grammar speaking audio**: `/audio/hsk1/grammar/{chinese_text}.mp3` — local files in `public/audio/`, with Web Speech API TTS fallback

## SEO & Metadata
- **`<html lang="{locale}">`** — dynamic, set to current locale from `getLocale()` (uz/ru/en)
- **Title template**: `%s | Blim` — set in root `layout.tsx`, all page titles auto-append "| Blim". **IMPORTANT**: Pages must NOT include "| Blim" in their own title (causes double "| Blim | Blim")
- **Per-page metadata**: Every `page.tsx` exports `metadata` or `generateMetadata` with `title` + `description`
- **OpenGraph / Twitter Cards**: Configured in root layout. Dynamic OG image via `src/app/opengraph-image.tsx` (edge runtime)
- **Sitemap**: `src/app/sitemap.ts` — auto-generates URLs for all content pages (lessons, dialogues, karaoke, flashcards, topic flashcards, writing sets, grammar, blog). **IMPORTANT**: When adding new content types or pages, always update `sitemap.ts` to include the new URLs. Topic flashcards are discovered automatically from `content/flashcards/topics/*.json`; writing sets from `WRITING_SETS` in `services/writing.ts`.
- **robots.txt**: `public/robots.txt` — allows all, blocks `/api/` and `/*admin*`, includes `Sitemap:` directive
- **JSON-LD**: Structured data on all pages via `src/utils/jsonLd.ts` shared helpers (`breadcrumbJsonLd()`, `jsonLdScript()`, `grammarTermJsonLd()`, `GRAMMAR_TERMS`). Uses `@graph` array pattern. Homepage has WebSite + Organization (root layout). Inner pages: BreadcrumbList on all, plus Course on `/chinese`, DefinedTerm on grammar pages, Article on blog posts, LearningResource on dialogues. All locale-aware (trilingual labels, locale-prefixed URLs).
- **Payment noindex**: `/{locale}/payment` has `robots: { index: false, follow: true }`. Excluded from sitemap.
- **Icons**: Dynamic favicon (`src/app/icon.tsx`) and Apple touch icon (`src/app/apple-icon.tsx`) via edge runtime
- **`next/image`**: All logo `<img>` tags use `next/image` `<Image>`. Remote patterns configured in `next.config.js` for Supabase and flagcdn.
- **Env var**: `NEXT_PUBLIC_SITE_URL` — defaults to `https://blim.uz`, used by sitemap and `metadataBase`

## Correction Reporting System
- **Component**: `src/components/PageFooter.tsx` — shared footer on ALL pages (except karaoke)
- **Button**: Inline text button "Xato haqida xabar berish" with pencil icon, above "Blim — Interaktiv til darsliklari" footer text
- **Visibility**: All users (logged-in and anonymous), hidden on home page (`pathname === '/'`). Unauthenticated submissions return 401 error.
- **Form**: Expandable inline — reason dropdown (6 options: pinyin/translation/audio/grammar/image/other) + free text textarea
- **API**: `POST /api/corrections` — JWT auth (Bearer token), sends Telegram message to admin chat with user info, page URL, reason, and optional message
- **Trilingual**: All labels support UZ/RU/EN via `useLanguage()` hook
- **CSS classes**: `.correction-inline__*` in reading.css
- **Footer spacing**: `padding-bottom: calc(80px + ...)` to clear fixed bottom bars (dialogue/lesson). Karaoke excluded due to full-screen player layout with fixed controls.
- **Used in**: Every page component — LanguagePage, BookPage, FlashcardListPage, DialoguesPage, HomePage, all Grammar pages, DialogueReader, FlashcardDeck, StoryReader, ReaderLayout, WritingPracticePage. **Not in KaraokePlayer** (fixed controls conflict).

## Writing Test
- **Component**: `src/components/WritingTest.tsx` — timed writing quiz using `HanziCanvas`
- **Flow**: Ready screen → write each character → results screen with star rating
- **Grading**: Per-character `mistakes` count. Fail threshold: 2+ wrong strokes per character
- **Star calculation**: 3★ = all passed, 2★ = max 1 fail, 1★ = at least 1 passed, 0★ = none
- **Star persistence**: Uses `useStars('writing')` hook → `star_progress` table (same as speaking)
- **Audio**: Per-character audio playback via `getWritingAudioUrl()` (same URL generation as flashcard pages)
- **Props**: `words: HanziWord[]`, `lang`, `setId`, `onDone` callback
- **Writing sets**: HSK 3.0 Level 1 (`WRITING_SETS`, `hsk1-*`), HSK 2.0 Levels 1-6 (`WRITING_SETS_HSK2` through `WRITING_SETS_HSK6`). HSK 6 has 25 sets (6 with data, 19 "coming soon" placeholders with empty `words[]` and `chars: ''`).
- **Coming soon sets**: Rendered as non-clickable `<div>` cards (not `<Link>`) with 🔒 icon, "Tez kunda"/"Скоро"/"Coming soon" subtitle, dimmed opacity (0.55), no star ratings
- **Back button routing** (`WritingPracticePage.tsx`): Each HSK level routes back to the correct writing tab with version/level params. HSK 3.0 sets → `?tab=writing&version=3.0`, HSK 2.0 sets → `?tab=writing&version=2.0&hsk={level}`
- **Flashcard back buttons**: HSK 2/3 flashcard pages pass `backHref="/chinese?tab=flashcards&flashhsk={level}"`. LanguagePage reads `flashhsk` URL param to restore correct HSK pill on return.

## Coach Marks & Tours
- **Component**: `src/components/CoachMark.tsx` — tooltip-based onboarding hints
- **Single tip**: `CoachMark` — positions tooltip near a target element, shown once (localStorage `blim-tips-seen`)
- **Multi-step**: `CoachMarkTour` — sequential steps with "Next" / counter / "Got it" on last step
- **Positioning**: Auto above/below target based on viewport space, arrow follows target center
- **Dismissal**: "Tushundim"/"Понятно"/"Got it" button or "Don't show again" skip link. Persisted in localStorage.
- **Used in**: `DialogueReader.tsx` for first-time user onboarding tour
- **CSS classes**: `.coach-backdrop`, `.coach-tooltip`, `.coach-tooltip__arrow`, `.coach-tooltip__btn`

## Analytics
- **Utility**: `src/utils/analytics.ts` — `trackAll(meta, yandex, ga, params)` fires events to all 3 platforms
- **Platforms**: Meta Pixel (`fbq`), Yandex Metrica (ID: `107194604`), Google Analytics 4 (`gtag`)
- **Page trackers**: `YandexPageView.tsx` (Yandex), `MetaPageView.tsx` (Meta Pixel) — mounted in root layout
- **Safe**: All calls check `typeof window !== 'undefined'` and SDK existence before firing

## JWT Utilities
- **File**: `src/lib/jwt.ts` — local JWT decoding without remote API calls
- **`getUserIdFromJWT(token)`**: Decodes Supabase JWT payload locally (~0ms vs ~1-2s for `admin.auth.getUser`). Returns `sub` (user_id). Checks expiration by default, optional `skipExpiration` flag.
- **`getUserFromJWT(token)`**: Returns `{ id, email, user_metadata }` from JWT payload
- **Used by**: `/api/stars`, `/api/subscription`, `/api/auth/session-check`, `/api/progress` — all low-risk read endpoints where local decode is sufficient

## Security Hardening
- **HTTP security headers** (`next.config.js` `headers()`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (2yr, preload), `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: on`, `Permissions-Policy` (camera/mic/geo disabled). Applied to all routes via `source: '/(.*)'`.
- **Payment upload validation** (`/api/payment`): File extension allowlist (`jpg, jpeg, png, webp, heic`), MIME type check, 10MB size limit. Validated server-side before Supabase upload.
- **Admin rate limiting** (`/api/admin/check`): In-memory IP-based rate limiter. Max 5 failed password attempts per IP, 15-minute lockout window. Uses `x-forwarded-for` header.
- **Error sanitization** (`/api/admin`): Invalid action responses return generic `"Invalid action"` without echoing user input (prevents reflected XSS / fingerprinting).
- **Paywall enforcement**: All content components (ReaderLayout, StoryReader, FlashcardDeck, KaraokePlayer) use early-return `<Paywall />` pattern — paid content is never rendered to DOM when locked. Server-side content (JSON files) is loaded at build time, not fetched client-side.
- **Known limitations**:
  - Payment screenshots are publicly accessible in Supabase storage (would need private bucket + signed URLs to fix)
  - No server-side bounds validation on admin `add_days`/`remove_days`/`grant_subscription` days parameter
  - Next.js 15.x has known DoS CVEs (fixed in 16.x, breaking upgrade required)
