# Blim Flutter Mobile App — Design Spec

## Overview

Native Android app for Blim (blim.uz), a Chinese language learning platform currently serving ~27 users via a Next.js web app. The Flutter app provides the same learning experience with offline support, native performance, and Play Store distribution.

**Three components:**
- **Flutter app** (Dart) — UI, bundled content, offline-first
- **TypeScript API** (Node.js) — business logic, auth, transcription, payments
- **Supabase** — shared database with the existing web app

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌──────────┐
│ Flutter App  │──────▶│  TS API      │──────▶│ Supabase │
│ (Dart)       │       │  (Node.js)   │       │ (DB/Auth)│
└─────────────┘       └──────────────┘       └──────────┘
                             │
                      ┌──────┴──────┐
                      │ OpenAI/Groq │
                      │ Google Play │
                      │ Telegram Bot│
                      └─────────────┘
```

Flutter talks **only** to the TS API. Never directly to Supabase or third-party services.

---

## 1. Authentication

### Google Sign-In (primary)
- Flutter `google_sign_in` package
- Send Google ID token to TS API → API verifies with Google → creates/finds Supabase user → returns JWT
- Standard Android flow, no WebView needed

### Telegram OAuth (secondary)
- Open Telegram Login Widget URL in an in-app WebView (`flutter_inappwebview`)
- Capture redirect callback with `tgAuthResult` hash fragment
- Send auth data to TS API → API verifies HMAC (same as web) → creates/finds Supabase user → returns JWT

### Session management
- JWT stored securely via `flutter_secure_storage`
- Refresh token flow handled by the API
- Single-device enforcement: same `active_sessions` table as web. Mobile login kicks web session and vice versa.

### User identity
- Google and Telegram logins can map to the same Supabase user if the email matches
- Synthetic email for Telegram users without email: `tg_{telegramId}@telegram.blim` (same as web)

---

## 2. Features

All features from the web app, minus the removed English content:

### 2.1 Dialogues
- 47 HSK 1 dialogues with audio, pinyin, translation
- Speaker labels (A/B) in chat-style layout
- Tap sentence to play audio, tap to see translation
- Pinyin toggle, translation toggle
- Focus mode (one sentence at a time with prev/next navigation)
- Full-dialogue audio playback with sentence-level sync

### 2.2 Flashcards
- Per-lesson decks + 28 topic collections
- 3D card flip animation
- Self-grading: Know / Don't Know
- Session progress, completion screen with stats
- Repeat unknown cards
- Pinyin toggle on front face
- UZ/RU/EN translation toggle
- Audio per card

### 2.3 Grammar Pages
- 10 HSK 1 grammar patterns (shi, ma, de, shei, shenme, na, ne, ji, shuzi, duoda)
- Speaking exercises with AI grading (see section 5)
- Star ratings (0-3) per grammar topic
- Interactive quizzes

### 2.4 Karaoke
- 8 synced songs with per-character timestamp highlighting
- Character states: dimmed → active line → currently singing (gold) → already sung (green)
- Auto-scroll to active line
- Pinyin toggle, translation panel
- Audio controls: play/pause, seek bar, skip 15s forward/back
- Adjustable font size

### 2.5 Writing Practice
- Hanzi stroke practice with canvas-based drawing
- Stroke validation (start/end proximity, direction, shape)
- Wrong stroke feedback: ghost outline after 1 mistake, traveling dot hint after 2
- Leitner SRS (5-box system) stored locally on device
- 6 sets of 10 characters (HSK 1)
- Writing test with star scoring

### 2.6 Speaking Exercises
- Embedded in grammar pages + dialogue role-play
- Record audio (max 6s) → send to API → transcription + grading
- Results: correct (green) / close (amber) / wrong (red) / no_speech
- Two attempts: first wrong → retry with hint, second wrong → shadowing mode
- Daily limit: 100 requests/user/day
- Dialogue role-play: 2-round quiz (learner plays A then B)

### 2.7 Lessons (HSK 1)
- 15 lessons, 3 pages each (45 total)
- Section types: objectives, text, dialogue, vocabulary, grammar, tip, exercise, instruction, activity, tonguetwister, matching, fillblank, multiplechoice, imagedescribe, bonus
- Sentence-level audio playback
- Pinyin and translation toggles
- Textbook images from Supabase storage

---

## 3. Content Strategy

### Bundled content (shipped in APK)
- All dialogue JSON files (47 files)
- All flashcard JSON files (per-lesson + 28 topics)
- All karaoke JSON files (8 songs)
- All grammar page data (10 pages)
- Writing practice data (character sets, stroke order)
- Lesson JSON files (45 files)
- UI translations (UZ/RU/EN)

**Estimated size:** ~3-5MB for all text/JSON content.

### Cached on demand
- Audio files (Supabase storage) — downloaded and cached on first play
- Textbook images (Supabase storage) — downloaded and cached on first view

### From API only (requires internet)
- Speech transcription and grading
- Auth (login/logout)
- Payment processing
- Progress sync (star ratings, lesson visits, dialogue progress)
- Subscription status checks

---

## 4. TypeScript API

Standalone Node.js server. Deployed separately from the Next.js web app.

### Endpoints

#### Auth
- `POST /auth/google` — verify Google ID token, create/find user, return JWT
- `POST /auth/telegram` — verify Telegram HMAC, create/find user, return JWT
- `POST /auth/refresh` — refresh JWT
- `POST /auth/logout` — delete active session
- `POST /auth/session-check` — validate session nonce (single-device enforcement)

#### Transcription
- `POST /transcribe` — audio blob + expected text → transcription + grading
  - Pipeline: GPT-4o Transcribe (primary) → Groq whisper-large-v3 (fallback)
  - Post-correction for homophones
  - Levenshtein scoring + GPT-4o mini judge for borderline cases
  - Daily limit enforcement (100/user/day)

#### Progress
- `GET /progress` — retrieve user progress (lesson visits)
- `POST /progress` — save lesson page visit
- `GET /stars` — retrieve star ratings
- `POST /stars` — save star rating
- `GET /dialogue-progress` — retrieve dialogue role-play scores
- `POST /dialogue-progress` — save dialogue score

#### Payment
- `POST /payment/google` — verify Google Play purchase receipt
- `POST /payment/screenshot` — upload payment screenshot (same as web flow)
- `GET /payment/status` — current payment request status
- `GET /subscription` — active subscription check

#### Content (optional, for future OTA updates)
- `GET /content/version` — check if bundled content is outdated
- `GET /content/update` — download content delta (future feature)

### Ported from Next.js
Most API logic is directly ported from existing Next.js routes:
- `src/lib/transcribe/whisper.ts` → transcription pipeline
- `src/lib/transcribe/scorer.ts` → scoring pipeline
- `src/app/api/auth/telegram/callback/route.ts` → Telegram auth
- `src/app/api/stars/route.ts` → star progress
- `src/app/api/progress/route.ts` → lesson progress
- `src/app/api/payment/route.ts` → screenshot payment
- `src/app/api/subscription/route.ts` → subscription check

### New logic
- Google Sign-In verification (new)
- Google Play billing receipt verification (new)
- JWT issuing and refresh (replacing Supabase session management)

---

## 5. Payment System

### Google Play Billing (primary)
- Flutter `in_app_purchase` package
- Same plans: 1 month, 3 months, 6 months, 12 months
- User purchases in Play Store → receipt sent to API → API verifies with Google Play Developer API → activates subscription in Supabase
- Google takes 15% cut (first $1M/year revenue)

### Screenshot Payment (fallback)
- Same flow as web: select plan → transfer money → upload screenshot → admin approves
- Useful for users who prefer local payment methods (Uzcard, Humo, Click, Payme)
- Screenshot uploaded to API → stored in Supabase storage → Telegram notification to admin

### Subscription sharing
- Same `subscriptions` table in Supabase
- A subscription purchased on web works on mobile and vice versa
- API checks subscription status from the shared table

---

## 6. Navigation Structure

```
App Launch
├── Login Screen (Google Sign-In button + Telegram button)
└── Home Screen (after auth)
    ├── Chinese (main tab — same as web's LanguagePage)
    │   ├── Dialogues tab → Dialogue list → Dialogue reader
    │   ├── Writing tab → Writing sets → Writing practice
    │   ├── Flashcards tab → Lesson/topic list → Flashcard deck
    │   ├── KTV tab → Song list → Karaoke player
    │   ├── Grammar tab → Grammar list → Grammar page (with speaking exercises)
    │   └── Tests tab → Test list → Test page
    ├── Progress (stats, streak, star overview)
    └── Settings (language, account, subscription, logout)
```

Bottom navigation: **Chinese | Progress | Settings** (3 tabs)

The main Chinese tab replicates the web's 6-tab layout (Dialogues, Writing, Flashcards, KTV, Grammar, Tests) as a horizontal tab bar within the screen.

---

## 7. Offline Behavior

| Feature | Offline | Online required |
|---|---|---|
| Read dialogues | Yes | No |
| Play cached audio | Yes | First play needs internet |
| Flashcard practice | Yes | No |
| Grammar pages | Yes | No |
| Karaoke (cached songs) | Yes | First play needs internet |
| Writing practice | Yes | No |
| Speaking exercises | No | Always (API call) |
| Login/logout | No | Always |
| Payment | No | Always |
| Progress sync | Queued | Syncs when online |

Progress changes made offline are queued locally and synced when connectivity returns.

---

## 8. Trilingual UI

Same three UI languages as web: Uzbek (default), Russian, English.

- All UI strings in UZ/RU/EN
- Content translations: `text_translation` (UZ), `text_translation_ru` (RU), `text_translation_en` (EN)
- Language preference stored locally, persisted to user profile via API
- Language toggle accessible from Settings and within readers

---

## 9. Tech Stack Summary

### Flutter App
- **Framework:** Flutter 3.x (latest stable)
- **Language:** Dart
- **State management:** Riverpod (or Provider — decide during implementation)
- **Local storage:** Hive or SharedPreferences (SRS data, settings, offline queue)
- **Secure storage:** `flutter_secure_storage` (JWT tokens)
- **HTTP:** `dio` (interceptors for auth, retry, offline queue)
- **Audio playback:** `just_audio`
- **Audio recording:** `record` package
- **Canvas drawing:** Flutter `CustomPainter` (for Hanzi writing)
- **Auth:** `google_sign_in` + `flutter_inappwebview` (Telegram)
- **Payments:** `in_app_purchase`
- **Caching:** `flutter_cache_manager` (audio files, images)

### TypeScript API
- **Runtime:** Node.js
- **Framework:** Express or Fastify
- **Language:** TypeScript
- **Database:** Supabase JS client (`@supabase/supabase-js`)
- **Auth:** Custom JWT (jsonwebtoken)
- **AI:** OpenAI SDK, Groq SDK
- **Payments:** Google Play Developer API (`googleapis`)
- **File upload:** Multer (payment screenshots)
- **Deployment:** Vercel / Railway / VPS

### Shared
- **Database:** Supabase (project: miruwaeplbzfqmdwacsh) — same instance as web
- **Storage:** Supabase Storage (audio, images, payment screenshots)
- **Notifications:** Telegram Bot API (admin payment alerts)

---

## 10. What's NOT in v1

- iOS version (Flutter supports it, but Play Store first)
- Push notifications (can add later)
- Offline speaking exercises (requires on-device model)
- Content OTA updates (bundled content is sufficient for now)
- Social features (leaderboards, friends)
- HSK 2-6 full content (only HSK 2-3 flashcards exist currently)
- Blog (not needed in mobile app)
