# Blim - Interactive Language Textbook Reader

## Before Making Changes
Always read the relevant CLAUDE.md file(s) before modifying any code. Check which subdirectory CLAUDE.md files apply to the files you're about to change:
- Editing `content/` files → read `content/CLAUDE.md`
- Editing `content/english/` files → also read `content/english/CLAUDE.md`
- Editing `src/components/` files → read `src/components/CLAUDE.md`
- Editing `src/styles/` files → read `src/styles/CLAUDE.md`

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
/[language]                                 # Language page - tabbed catalog (Kitob, Matn, Flesh, KTV, Test)
/[language]?tab=[tabId]                     # Language page with specific tab pre-selected
/[language]/[book]                          # Book page - lesson list
/[language]/[book]/lesson/[lessonId]/page/[pageNum]  # Lesson page
/[language]/[book]/flashcards               # Flashcard list page (per-lesson cards)
/[language]/[book]/flashcards/[lessonId]    # Flashcard practice for specific lesson
/[language]/[book]/dialogues                # Dialogues list page
/[language]/[book]/dialogues/[dialogueId]  # Dialogue reader page (uses StoryReader)
/[language]/[book]/stories                  # Stories list page
/[language]/[book]/stories/[storyId]        # Story reader page
/[language]/[book]/karaoke/[songId]         # Karaoke player page
/[language]/[book]/writing/[setId]          # Writing practice page (per character set)
```

Example routes:
- `/` - Landing page (logged-in users auto-redirect to `/chinese`)
- `/chinese` - Chinese language page with tabs (Kitob, Matn, Flesh, KTV, Test)
- `/chinese?tab=flashcards` - Language page with Flashcards tab active
- `/chinese/hsk1` - HSK 1 book with lesson list
- `/chinese/hsk1/lesson/1/page/1` - Lesson 1, Page 1
- `/chinese/hsk1/flashcards` - HSK 1 flashcard list (per-lesson cards with word counts)
- `/chinese/hsk1/flashcards/1` - Flashcard practice for lesson 1
- `/chinese/hsk1/dialogues` - HSK 1 dialogues list
- `/chinese/hsk1/dialogues/hsk1-dialogue1` - Dialogue reader
- `/chinese/hsk2/stories` - HSK 2 stories list
- `/chinese/hsk2/stories/hsk2-story1` - Story reader
- `/chinese?tab=writing` - Writing tab (Hanzi character set selection)
- `/chinese/hsk1/writing/hsk1-set1` - Writing practice for character set 1

## Project Structure
```
/Users/ali/ReadVo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Home page (language selection)
│   │   ├── error.tsx          # Error boundary
│   │   ├── not-found.tsx      # 404 page
│   │   ├── chinese/
│   │   │   ├── page.tsx       # Language page (tabbed catalog)
│   │   │   └── hsk1/
│   │   │       ├── flashcards/
│   │   │       │   ├── page.tsx       # Flashcard list page (per-lesson cards)
│   │   │       │   └── [lessonId]/page.tsx  # Flashcard practice for lesson
│   │   │       ├── dialogues/
│   │   │       │   ├── page.tsx       # Dialogues list page
│   │   │       │   └── [dialogueId]/page.tsx  # Dialogue reader (uses StoryReader)
│   │   │       ├── stories/
│   │   │       │   ├── page.tsx       # Stories list page
│   │   │       │   └── [storyId]/page.tsx  # Story reader page
│   │   │       ├── karaoke/
│   │   │       │   └── [songId]/page.tsx   # Karaoke player page
│   │   │       ├── writing/
│   │   │       │   └── [setId]/
│   │   │       │       ├── page.tsx              # Writing practice (server component)
│   │   │       │       └── WritingPracticePage.tsx # Writing practice (client component)
│   │   │       └── grammar/[slug]/page.tsx # Grammar pages (shi/you/zai/de/bu/ma)
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
│   │   │   └── auth/
│   │   │       ├── telegram/
│   │   │       │   ├── init/route.ts     # Telegram Widget auth URL (GET)
│   │   │       │   └── callback/route.ts # HMAC verify + user create + session (POST)
│   │   │       └── session-check/route.ts # Session nonce validation (POST/DELETE)
│   │   ├── auth/telegram/complete/page.tsx  # Telegram login completion (client)
│   │   └── payment/page.tsx       # Payment page
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
│   │   ├── StoriesPage.tsx     # Stories list page (banner+HSK tabs)
│   │   ├── StoryReader.tsx    # Story/dialogue reader with ruby pinyin, translation panel, audio bar
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
│   │   ├── AdminPanel.tsx            # Admin panel (payments + users management)
│   │   ├── PaymentPage.tsx           # Payment page (plan selection + screenshot upload)
│   │   └── Paywall.tsx               # Paywall overlay (trial expired)
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAudioPlayer.ts  # Singleton audio player
│   │   ├── useLanguage.ts     # UZ/RU language toggle/set (localStorage)
│   │   ├── useAuth.tsx        # Telegram auth provider + context
│   │   ├── useRequireAuth.ts  # Auth guard (redirects to / if not logged in)
│   │   └── useTrial.ts       # Trial/subscription status hook
│   ├── lib/                      # Supabase clients
│   │   ├── supabase-client.ts # Browser client (anon key, respects RLS)
│   │   └── supabase-server.ts # Server client (service role, bypasses RLS)
│   ├── utils/                    # Utility functions
│   │   └── rubyText.ts        # Pinyin-to-character alignment for ruby annotations
│   ├── services/               # Data loading
│   │   ├── index.ts           # Service exports
│   │   ├── content.ts         # Loads JSON from /content
│   │   ├── stories.ts        # Loads story JSON from /content/stories
│   │   ├── dialogues.ts     # Loads dialogue JSON from /content/dialogues
│   │   ├── flashcards.ts     # Loads flashcard decks from /content/flashcards
│   │   ├── karaoke.ts        # Loads karaoke song JSON from /content/karaoke
│   │   ├── writing.ts        # Writing practice sets data (WRITING_SETS, HanziWord type)
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
│   ├── stories/
│   │   └── hsk2/
│   │       └── story1.json    # Story content files
│   ├── karaoke/
│   │   └── yueliang.json      # Karaoke song data (per-character timestamps + pinyin)
│   └── english/               # English content (see content/english/CLAUDE.md)
│       └── destination-b1/
│           └── unit1-page1.json  # English grammar content (Destination B1)
├── .env.local                  # Supabase credentials
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
- Section headings: **Empty** (all Chinese headings removed — `heading` field is `""`)
- Subheadings: Uzbek/Russian only (e.g., "Yangi so'zlar", "Новые слова")
- Instructions: Uzbek/Russian only — **NO Chinese text** in any `instruction`/`instruction_ru` fields
- Lesson badge: "1 DARS" format (number on top, label below)
- Button tooltips: Uzbek
- Translations: Uzbek (default) and Russian (toggle with language button)
- Tab labels (UZ): Dialog | Yozish | Flesh | KTV | Tika | Test
- Tab labels (RU): Диалог | Письмо | Флеш | KTV | Грамм | Тесты
- Tab IDs: `dialogues` | `writing` | `flashcards` | `karaoke` | `grammar` | `tests`
- Language toggle: Inside hamburger menu on banner pages (O'zbekcha/Русский toggle buttons under "Til" label, 中文 under "Men o'rganaman" label). Lesson/story reader headers still use UZ/RU toggle button.

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
- **Paid content** (require active trial or subscription): Lessons 2-15, all stories, all dialogues, all karaoke songs, flashcards 2+
- **Trial status**: `{ daysLeft, isTrialActive, isTrialExpired, hasSubscription, subscriptionDaysLeft }`
- **Subscription takes priority**: If valid subscription exists, `isTrialActive = true`
- **Paywall component**: `src/components/Paywall.tsx` — shown when `trial.isTrialExpired && !isFreeContent`
- **Paywall locations**: ReaderLayout, StoryReader, FlashcardDeck, KaraokePlayer
- **Subscription API**: `GET /api/subscription` — returns active subscription (ends_at > now)
- **BannerMenu display**: Active subscription shows "Obuna: N kun qoldi", expired shows "Sinov muddati tugadi" (red), trial shows "Sinov: N kun qoldi" (yellow)

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

## SEO & Metadata
- **`<html lang="uz">`** — primary audience is Uzbek-speaking
- **Title template**: `%s | Blim` — set in root `layout.tsx`, all page titles auto-append "| Blim"
- **Per-page metadata**: Every `page.tsx` exports `metadata` or `generateMetadata` with `title` + `description`
- **OpenGraph / Twitter Cards**: Configured in root layout. Dynamic OG image via `src/app/opengraph-image.tsx` (edge runtime)
- **Sitemap**: `src/app/sitemap.ts` — auto-generates all lesson, story, dialogue, karaoke, flashcard, and English unit URLs
- **robots.txt**: `public/robots.txt` — allows all, blocks `/api/` and `/*admin*`, includes `Sitemap:` directive
- **JSON-LD**: `WebApplication` structured data in root layout
- **Icons**: Dynamic favicon (`src/app/icon.tsx`) and Apple touch icon (`src/app/apple-icon.tsx`) via edge runtime
- **`next/image`**: All logo `<img>` tags use `next/image` `<Image>`. Remote patterns configured in `next.config.js` for Supabase and flagcdn.
- **Env var**: `NEXT_PUBLIC_SITE_URL` — defaults to `https://blim.uz`, used by sitemap and `metadataBase`

## Correction Reporting System
- **Component**: `src/components/PageFooter.tsx` — shared footer on ALL pages
- **Button**: Inline text button "Xato haqida xabar berish" with pencil icon, above "Blim — Interaktiv til darsliklari" footer text
- **Visibility**: Only for logged-in users (`!user` hides it), hidden on home page (`pathname === '/'`)
- **Form**: Expandable inline — reason dropdown (6 options: pinyin/translation/audio/grammar/image/other) + free text textarea
- **API**: `POST /api/corrections` — JWT auth (Bearer token), sends Telegram message to admin chat with user info, page URL, reason, and optional message
- **Bilingual**: All labels support UZ/RU via `useLanguage()` hook
- **CSS classes**: `.correction-inline__*` in reading.css
- **Used in**: Every page component — LanguagePage, BookPage, StoriesPage, FlashcardListPage, DialoguesPage, HomePage, all Grammar pages, DialogueReader, FlashcardDeck, StoryReader, KaraokePlayer, ReaderLayout, WritingPracticePage

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
