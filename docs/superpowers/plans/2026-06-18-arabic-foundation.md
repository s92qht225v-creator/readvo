# Arabic Foundation + Dialogue Thin Slice — Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.
>
> **No unit-test harness exists in this repo** (no vitest/jest, no `.test.*` files). Do NOT add one. Verification = `npm run build` (routes stay `●` SSG/ISR, never `ƒ`), throwaway `node -e` checks for pure functions, the `preview_*` tools for visual/behaviour checks, and production `curl` for gating. This matches every prior cycle in this codebase.

**Goal:** Stand up the Arabic learning track's foundation — a `ScriptConfig`-driven reader core (Chinese reader untouched) — and prove it with one A1 Arabic dialogue rendered end-to-end: RTL layout, harakat toggle, transliteration toggle, tap-to-play Arabic TTS, login-gated.

**Architecture:** New language-agnostic `ReaderCore` parameterized by a `ScriptConfig` (text direction + how one sentence renders its pronunciation aid). Arabic is consumer #1; a Chinese `ScriptConfig` is authored as a proof artifact but the live `/chinese/` `DialogueReader` is **not** touched. Arabic content is JSON under `content/arabic/`, served by a gated content endpoint mirroring the Chinese one; audio via a new `/api/tts-ar` (OpenAI TTS, cached to Supabase like MiMo).

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl, next/font, Supabase Storage, OpenAI TTS.

**Scope (Plan 1 only):** the dialog reading surface for ONE A1 dialogue. **Deferred to Plan 2:** the `/arabic/dialogues` catalog + CEFR pills, the `/arabic`→catalog redirect, landing "I'm learning" selector, focus mode, play-all FAB, the Words/Dictation/Practice tabs, the `arabic_lexicon` table. **Plan 3:** Stories, Flashcards, content backfill.

---

### Task 0: Branch + baseline

**Files:** none (git only)

- [ ] **Step 1: Create the branch**

```bash
git checkout main && git pull --ff-only origin main
git checkout -b arabic-foundation
```

- [ ] **Step 2: Confirm a clean baseline build**

Run: `npm run build`
Expected: build succeeds; note that `/[locale]/chinese/*` routes render `●`. No Arabic routes yet.

---

### Task 1: Add the Arabic font (Noto Naskh Arabic)

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Import and configure the font**

In `src/app/[locale]/layout.tsx`, add the import next to the existing `Noto_Sans` import (line 2) and configure it after the existing `font` const (line 12):

```tsx
import { Noto_Sans, Noto_Naskh_Arabic } from 'next/font/google';
```

```tsx
const font = Noto_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '700'], variable: '--font-pinyin', display: 'swap', preload: true });
const arabicFont = Noto_Naskh_Arabic({ subsets: ['arabic'], weight: ['400', '500', '700'], variable: '--font-arabic', display: 'swap', preload: false });
```

- [ ] **Step 2: Expose the font variable on `<body>`**

Change the `<body>` className (line 88) to include the Arabic font variable:

```tsx
<body className={`${font.className} ${font.variable} ${arabicFont.variable}`}>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds; no type errors. `--font-arabic` is now a CSS variable available app-wide (unused until the reader uses it).

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/layout.tsx
git commit -m "feat(arabic): add Noto Naskh Arabic font variable"
```

---

### Task 2: ScriptConfig types + harakat utility

**Files:**
- Create: `src/lib/reader/harakat.ts`
- Create: `src/lib/reader/scriptConfig.ts`

- [ ] **Step 1: Write the harakat-strip utility**

`src/lib/reader/harakat.ts`:

```ts
// Arabic tashkeel (vowel/diacritic marks). Stripping these turns fully
// vowelized text into the bare consonantal skeleton, which is what the
// "hide pronunciation aid" toggle shows (mirrors Chinese's hide-pinyin).
const TASHKEEL = /[ً-ْٰ]/g;

/** Remove all harakat (diacritics) from Arabic text. */
export function stripHarakat(text: string): string {
  return text.replace(TASHKEEL, '');
}
```

- [ ] **Step 2: Verify the utility with a throwaway node check**

Run:
```bash
node --input-type=module -e "
const TASHKEEL=/[ً-ْٰ]/g;
const strip=t=>t.replace(TASHKEEL,'');
const vowelled='مَرْحَبًا';            // 'marhaban' fully vowelized
console.log(JSON.stringify(strip(vowelled)), strip(vowelled)==='مرحبا');
"
```
Expected: prints `\"مرحبا\" true` (all marks removed, bare letters remain).

- [ ] **Step 3: Write the ScriptConfig types + the two configs**

`src/lib/reader/scriptConfig.ts`:

```tsx
import React from 'react';
import { alignPinyinToText } from '@/utils/rubyText';
import { stripHarakat } from './harakat';

/** One sentence normalized for the language-agnostic reader core. */
export interface ReaderSentence {
  id: string;
  text: string;          // primary-script text (Arabic vowelized, or Chinese hanzi)
  aid?: string;          // Chinese: source pinyin string for alignment; Arabic: unused
  translit?: string;     // Arabic: Latin transliteration (secondary aid)
  translation: string;   // already resolved to the current UI language by the caller
  speaker?: string;      // 'A' | 'B' for dialogues
  audioText: string;     // text sent to TTS when no recorded audioUrl
  audioUrl?: string;
}

export interface RenderOpts {
  showPrimaryAid: boolean;
  showSecondaryAid: boolean;
}

/** The ONLY language-specific seam: direction + how a sentence renders. */
export interface ScriptConfig {
  dir: 'ltr' | 'rtl';
  fontClass: string;            // CSS class applying the script's font
  primaryAidLabel: string;      // bottom-bar toggle label ('Harakat' / 'Pinyin')
  hasSecondaryAid: boolean;     // is there a transliteration line?
  secondaryAidLabel?: string;   // 'Translit'
  renderSentence: (s: ReaderSentence, opts: RenderOpts) => React.ReactNode;
}

/** Arabic: RTL, harakat in-text (strip when aid off), transliteration line. */
export const arabicScriptConfig: ScriptConfig = {
  dir: 'rtl',
  fontClass: 'reader-core--arabic',
  primaryAidLabel: 'Harakat',
  hasSecondaryAid: true,
  secondaryAidLabel: 'Translit',
  renderSentence: (s, { showPrimaryAid, showSecondaryAid }) => (
    <span className="ar-sentence">
      <span className="ar-text">{showPrimaryAid ? s.text : stripHarakat(s.text)}</span>
      {showSecondaryAid && s.translit && (
        <span className="ar-translit" dir="ltr">{s.translit}</span>
      )}
    </span>
  ),
};

/** Chinese PROOF config — validates the seam against a 2nd script. Not wired
 *  into the live /chinese reader (that stays on DialogueReader.tsx). */
export const chineseScriptConfig: ScriptConfig = {
  dir: 'ltr',
  fontClass: 'reader-core--chinese',
  primaryAidLabel: 'Pinyin',
  hasSecondaryAid: false,
  renderSentence: (s, { showPrimaryAid }) => (
    <span className="zh-sentence">
      {alignPinyinToText(s.text, s.aid ?? '').map((p, i) => (
        <span key={i} className="zh-char">
          {showPrimaryAid && p.pinyin && <span className="zh-py">{p.pinyin}</span>}
          <span className="zh-zh">{p.char}</span>
        </span>
      ))}
    </span>
  ),
};
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: succeeds (files compile; not yet imported by any route).

- [ ] **Step 5: Commit**

```bash
git add src/lib/reader/
git commit -m "feat(arabic): ScriptConfig seam + harakat util + arabic/chinese configs"
```

---

### Task 3: Arabic content types, loader, and one sample A1 dialogue

**Files:**
- Create: `src/services/arabicContent.ts`
- Create: `content/arabic/dialogues/a1/greetings.json`

- [ ] **Step 1: Write the Arabic content service**

`src/services/arabicContent.ts`:

```ts
import fs from 'fs';
import path from 'path';

export interface ArabicSentence {
  id: string;
  ar: string;                 // fully vowelized Arabic
  translit: string;           // Latin transliteration
  text_translation_uz: string;
  text_translation_ru: string;
  text_translation_en: string;
  speaker?: 'A' | 'B';
  audio_url?: string;         // optional recorded audio; else TTS
}

export interface ArabicDialogue {
  id: string;
  level: string;              // 'a1'..'c2'
  title: string;              // Arabic (vowelized)
  translit: string;
  titleTranslation_uz: string;
  titleTranslation_ru: string;
  titleTranslation_en: string;
  sentences: ArabicSentence[];
}

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const ROOT = path.join(process.cwd(), 'content', 'arabic', 'dialogues');

/** Load one Arabic dialogue, or null if missing/invalid. */
export function loadArabicDialogue(level: string, slug: string): ArabicDialogue | null {
  if (!LEVELS.includes(level) || !/^[\w-]+$/.test(slug)) return null;
  const file = path.join(ROOT, level, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as ArabicDialogue;
  } catch {
    return null;
  }
}

/** List every (level, slug) for generateStaticParams. */
export function listArabicDialogues(): { level: string; slug: string }[] {
  const out: { level: string; slug: string }[] = [];
  for (const level of LEVELS) {
    const dir = path.join(ROOT, level);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.json')) out.push({ level, slug: f.replace(/\.json$/, '') });
    }
  }
  return out;
}
```

- [ ] **Step 2: Write the sample A1 dialogue**

`content/arabic/dialogues/a1/greetings.json` (a short 4-line MSA greeting; vowelized + transliteration + trilingual):

```json
{
  "id": "greetings",
  "level": "a1",
  "title": "اَلتَّحِيَّة",
  "translit": "at-tahiyya",
  "titleTranslation_uz": "Salomlashish",
  "titleTranslation_ru": "Приветствие",
  "titleTranslation_en": "Greetings",
  "sentences": [
    { "id": "s1", "speaker": "A", "ar": "اَلسَّلَامُ عَلَيْكُمْ.", "translit": "as-salāmu ʿalaykum.", "text_translation_uz": "Assalomu alaykum.", "text_translation_ru": "Мир вам.", "text_translation_en": "Peace be upon you." },
    { "id": "s2", "speaker": "B", "ar": "وَعَلَيْكُمُ السَّلَام.", "translit": "wa-ʿalaykumu s-salām.", "text_translation_uz": "Va alaykum assalom.", "text_translation_ru": "И вам мир.", "text_translation_en": "And upon you peace." },
    { "id": "s3", "speaker": "A", "ar": "كَيْفَ حَالُكَ؟", "translit": "kayfa ḥāluka?", "text_translation_uz": "Qalaysiz?", "text_translation_ru": "Как дела?", "text_translation_en": "How are you?" },
    { "id": "s4", "speaker": "B", "ar": "أَنَا بِخَيْرٍ، شُكْرًا.", "translit": "anā bi-khayrin, shukran.", "text_translation_uz": "Yaxshi, rahmat.", "text_translation_ru": "Хорошо, спасибо.", "text_translation_en": "I am well, thank you." }
  ]
}
```

- [ ] **Step 3: Verify loader with a throwaway node check**

Run:
```bash
node --input-type=module -e "
import fs from 'fs';
const d=JSON.parse(fs.readFileSync('content/arabic/dialogues/a1/greetings.json','utf8'));
console.log(d.id, d.level, d.sentences.length, d.sentences.every(s=>s.ar&&s.translit&&s.text_translation_en));
"
```
Expected: `greetings a1 4 true`.

- [ ] **Step 4: Verify build + commit**

Run: `npm run build` (expected: succeeds).
```bash
git add src/services/arabicContent.ts content/arabic/
git commit -m "feat(arabic): content types, loader, sample A1 greetings dialogue"
```

---

### Task 4: Arabic TTS route + client resolver

**Files:**
- Create: `src/app/api/tts-ar/route.ts`
- Create: `src/utils/ttsAudioAr.ts`

- [ ] **Step 1: Write the TTS route (OpenAI TTS, Supabase-cached)**

`src/app/api/tts-ar/route.ts` — mirrors `src/app/api/tts/route.ts` (same `blim-auth` cookie gate, hex storage path, cache-first), but Arabic via OpenAI and cached under `audio/ar/`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

const BUCKET = 'audio';
const TTS_PREFIX = 'ar/tts';

function storagePath(text: string): string {
  const hex = Buffer.from(text, 'utf-8').toString('hex');
  return `${TTS_PREFIX}/${hex}.mp3`;
}

function publicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
}

export async function POST(req: NextRequest) {
  // Paid external API + storage write — gate on the same-origin HttpOnly
  // blim-auth cookie, exactly like /api/tts.
  if (req.cookies.get('blim-auth')?.value !== '1') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const path = storagePath(text);

  // 1. Cache hit?
  const { data: existing, error: dlError } = await supabase.storage.from(BUCKET).download(path);
  if (existing && !dlError) {
    return NextResponse.json({ url: publicUrl(path) });
  }

  // 2. Generate via OpenAI TTS (provider is swappable; OPENAI_API_KEY already in env).
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice: 'alloy', input: text, response_format: 'mp3' }),
    });
    if (!res.ok) {
      console.error('OpenAI TTS error:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'TTS request failed' }, { status: res.status });
    }
    const audioBuffer = Buffer.from(await res.arrayBuffer());

    // 3. Cache to Supabase
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, audioBuffer, { contentType: 'audio/mpeg', upsert: true });
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      // Fall back to a data URL so playback still works this session.
      return NextResponse.json({ url: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}` });
    }
    return NextResponse.json({ url: publicUrl(path) });
  } catch (e) {
    console.error('TTS fetch error:', e);
    return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write the client resolver**

`src/utils/ttsAudioAr.ts` — mirrors `resolveTtsUrl` but hits `/api/tts-ar`:

```ts
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

/** Resolve a playable Arabic TTS URL for `text` (Supabase-cached, memoized). */
export async function resolveTtsUrlAr(text: string): Promise<string | null> {
  const key = (text ?? '').trim();
  if (!key) return null;
  const cached = cache.get(key);
  if (cached) return cached;
  const existing = inflight.get(key);
  if (existing) return existing;

  const request = (async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/tts-ar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: key }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.url) { cache.set(key, data.url); return data.url; }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}
```

- [ ] **Step 3: Verify build + commit**

Run: `npm run build` (expected: `ƒ /api/tts-ar` appears as a dynamic API route — APIs are `ƒ`, that's correct).
```bash
git add src/app/api/tts-ar/ src/utils/ttsAudioAr.ts
git commit -m "feat(arabic): /api/tts-ar (OpenAI TTS, Supabase-cached) + client resolver"
```

---

### Task 5: Gated Arabic dialogue content endpoint

**Files:**
- Create: `src/app/api/content/arabic/dialogue/[level]/[slug]/route.ts`

- [ ] **Step 1: Write the endpoint (mirrors the Chinese content route)**

`src/app/api/content/arabic/dialogue/[level]/[slug]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { loadArabicDialogue } from '@/services/arabicContent';

const LEVELS = new Set(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ level: string; slug: string }> },
) {
  const { level, slug } = await params;
  if (!LEVELS.has(level) || !/^[\w-]+$/.test(slug)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) {
    return NextResponse.json({ locked: true }, { status: 401 });
  }

  const { entitled } = await resolveEntitlement(userId);
  if (!entitled) {
    return NextResponse.json({ locked: true }, { status: 402 });
  }

  const dialogue = loadArabicDialogue(level, slug);
  if (!dialogue) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ dialogue }, { headers: { 'Cache-Control': 'no-store, private' } });
}
```

- [ ] **Step 2: Verify build + commit**

Run: `npm run build` (expected: `ƒ /api/content/arabic/dialogue/[level]/[slug]`).
```bash
git add src/app/api/content/arabic/
git commit -m "feat(arabic): gated dialogue content endpoint"
```

---

### Task 6: RTL CSS scaffold for the reader core

**Files:**
- Create: `src/styles/arabic.css`

- [ ] **Step 1: Write the Arabic reader stylesheet**

`src/styles/arabic.css` — uses logical properties so the same core works in both directions; Arabic font + RTL applied via the core container:

```css
/* Language-agnostic reader core chrome (logical properties → direction-safe). */
.reader-core { max-width: 900px; margin-inline: auto; padding-inline: 16px; }
.reader-core__lines { display: flex; flex-direction: column; gap: 14px; padding-block: 16px; }
.reader-core__line { padding-inline-start: 0; }
.reader-core__speaker { font-weight: 700; color: var(--color-accent, #dc2626); margin-inline-end: 6px; }
.reader-core__sentence { cursor: pointer; line-height: 2.2; }
.reader-core__sentence--active { color: var(--color-accent, #dc2626); }

/* Arabic script specifics */
.reader-core--arabic { direction: rtl; text-align: right; font-family: var(--font-arabic), serif; }
.reader-core--arabic .ar-text { font-size: 1.6em; }
.reader-core--arabic .ar-translit { display: block; font-family: var(--font-pinyin), sans-serif; font-size: 0.85em; color: #888; font-style: italic; }

/* Chinese proof config (used only in dev/proof, not the live reader) */
.reader-core--chinese { direction: ltr; }
.reader-core--chinese .zh-char { display: inline-flex; flex-direction: column; align-items: center; margin: 0 1px; }
.reader-core--chinese .zh-py { font-size: 0.6em; color: var(--color-accent, #dc2626); font-style: italic; }
```

- [ ] **Step 2: Commit** (imported by the core in Task 7)

```bash
git add src/styles/arabic.css
git commit -m "feat(arabic): RTL reader-core stylesheet (logical properties)"
```

---

### Task 7: The ScriptConfig-driven ReaderCore + Arabic reader + route

**Files:**
- Create: `src/components/reader/ReaderCore.tsx`
- Create: `src/components/reader/ArabicDialogueReader.tsx`
- Create: `src/app/[locale]/arabic/dialogues/[level]/[slug]/page.tsx`

- [ ] **Step 1: Write the language-agnostic ReaderCore**

`src/components/reader/ReaderCore.tsx`:

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import '@/styles/arabic.css';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { ScriptConfig, ReaderSentence } from '@/lib/reader/scriptConfig';

interface ReaderCoreProps {
  config: ScriptConfig;
  sentences: ReaderSentence[];
  resolveAudio: (s: ReaderSentence) => Promise<string | null>;
  labels: { translation: string };
}

export function ReaderCore({ config, sentences, resolveAudio, labels }: ReaderCoreProps) {
  const [showPrimaryAid, setShowPrimaryAid] = useState(true);
  const [showSecondaryAid, setShowSecondaryAid] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const audio = useAudioPlayer();

  const onSentence = useCallback(async (s: ReaderSentence) => {
    setActiveId(s.id);
    const url = s.audioUrl ?? (await resolveAudio(s));
    if (url) audio.play(s.id, url);
  }, [audio, resolveAudio]);

  return (
    <div className={`reader-core ${config.fontClass}`} dir={config.dir}>
      <div className="reader-core__lines">
        {sentences.map((s) => (
          <div key={s.id} className="reader-core__line">
            {s.speaker && <span className="reader-core__speaker">{s.speaker}:</span>}
            <span
              className={`reader-core__sentence ${activeId === s.id ? 'reader-core__sentence--active' : ''}`}
              onClick={() => onSentence(s)}
            >
              {config.renderSentence(s, { showPrimaryAid, showSecondaryAid })}
            </span>
            {showTranslation && <div className="reader-core__translation" dir="auto">{s.translation}</div>}
          </div>
        ))}
      </div>

      <nav className="story__bottom-bar">
        <div className="story__bottom-bar-inner">
          <button
            className={`reader__nav-toggle ${showPrimaryAid ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowPrimaryAid((v) => !v)}
            type="button"
            aria-pressed={showPrimaryAid}
          >
            {config.primaryAidLabel}
          </button>
          {config.hasSecondaryAid && (
            <button
              className={`reader__nav-toggle ${showSecondaryAid ? 'reader__nav-toggle--active' : ''}`}
              onClick={() => setShowSecondaryAid((v) => !v)}
              type="button"
              aria-pressed={showSecondaryAid}
            >
              {config.secondaryAidLabel}
            </button>
          )}
          <button
            className={`reader__nav-toggle ${showTranslation ? 'reader__nav-toggle--active' : ''}`}
            onClick={() => setShowTranslation((v) => !v)}
            type="button"
            aria-pressed={showTranslation}
          >
            {labels.translation}
          </button>
        </div>
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Write the Arabic reader wrapper (fetch + map → ReaderCore)**

`src/components/reader/ArabicDialogueReader.tsx`:

```tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { Paywall } from '@/components/Paywall';
import { BannerMenu } from '@/components/BannerMenu';
import { PageFooter } from '@/components/PageFooter';
import { ReaderCore } from './ReaderCore';
import { arabicScriptConfig, type ReaderSentence } from '@/lib/reader/scriptConfig';
import { resolveTtsUrlAr } from '@/utils/ttsAudioAr';
import type { Language } from '@/types/ui-state';

export interface ArabicDialogueMeta {
  level: string;
  slug: string;
  title: string;
  translit: string;
  titleTranslation_uz: string;
  titleTranslation_ru: string;
  titleTranslation_en: string;
}

interface ApiSentence {
  id: string; ar: string; translit: string;
  text_translation_uz: string; text_translation_ru: string; text_translation_en: string;
  speaker?: 'A' | 'B'; audio_url?: string;
}
interface ApiDialogue { id: string; sentences: ApiSentence[]; }

function trOf(s: ApiSentence, lang: Language): string {
  return lang === 'ru' ? s.text_translation_ru : lang === 'en' ? s.text_translation_en : s.text_translation_uz;
}

export function ArabicDialogueReader({ meta }: { meta: ArabicDialogueMeta }) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [language] = useLanguage();
  const [dialogue, setDialogue] = useState<ApiDialogue | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/arabic/dialogue/${meta.level}/${meta.slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        setDialogue(data.dialogue as ApiDialogue);
        setStatus('loaded');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [meta.level, meta.slug, getAccessToken, authLoading]);

  const sentences: ReaderSentence[] = (dialogue?.sentences ?? []).map((s) => ({
    id: s.id,
    text: s.ar,
    translit: s.translit,
    translation: trOf(s, language),
    speaker: s.speaker,
    audioText: s.ar,
    audioUrl: s.audio_url,
  }));

  const resolveAudio = useCallback((s: ReaderSentence) => resolveTtsUrlAr(s.audioText), []);

  const titleTr = language === 'ru' ? meta.titleTranslation_ru : language === 'en' ? meta.titleTranslation_en : meta.titleTranslation_uz;

  if (authLoading) return <div className="loading-spinner" />;

  return (
    <>
      {status === 'locked' && <Paywall />}
      <div className="dialogue-reader">
        <div className="dr-hero">
          <div className="dr-hero__watermark" aria-hidden="true">عربي</div>
          <div className="dr-hero__top-row">
            <Link href="/arabic/dialogues" className="dr-back-btn" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <BannerMenu />
          </div>
          <div className="dr-hero__body">
            <div className="dr-hero__level">{meta.level.toUpperCase()} · Arabic</div>
            <h1 className="dr-hero__title" dir="rtl">{meta.title}</h1>
            <div className="dr-hero__pinyin" dir="ltr">{meta.translit}</div>
            <div className="dr-hero__translation">— {titleTr} —</div>
          </div>
        </div>

        {status === 'loading' && <div className="loading-spinner" />}
        {status === 'error' && <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>Could not load.</div>}
        {status === 'loaded' && dialogue && (
          <ReaderCore
            config={arabicScriptConfig}
            sentences={sentences}
            resolveAudio={resolveAudio}
            labels={{ translation: ({ uz: 'Tarjima', ru: 'Перевод', en: 'Translation' } as Record<string, string>)[language] }}
          />
        )}
      </div>
      <PageFooter />
    </>
  );
}
```

- [ ] **Step 3: Write the route page (server, SSG)**

`src/app/[locale]/arabic/dialogues/[level]/[slug]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadArabicDialogue, listArabicDialogues } from '@/services/arabicContent';
import { ArabicDialogueReader } from '@/components/reader/ArabicDialogueReader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

interface PageParams {
  params: Promise<{ locale: string; level: string; slug: string }>;
}

export async function generateStaticParams() {
  return listArabicDialogues();
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, level, slug } = await params;
  const d = loadArabicDialogue(level, slug);
  if (!d) return {};
  const tr = locale === 'ru' ? d.titleTranslation_ru : locale === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;
  return {
    title: `${d.title} (${d.translit}) — "${tr}" · ${level.toUpperCase()} Arabic`,
    description: ({
      uz: `Arab tili dialogi: ${d.title} — ${tr}. Harakat va transliteratsiya bilan o'qing.`,
      ru: `Диалог на арабском: ${d.title} — ${tr}. Читайте с огласовками и транслитерацией.`,
      en: `Arabic dialogue: ${d.title} — ${tr}. Read with harakat and transliteration.`,
    } as Record<string, string>)[locale],
    alternates: {
      canonical: `/${locale}/arabic/dialogues/${level}/${slug}`,
      languages: {
        uz: `/uz/arabic/dialogues/${level}/${slug}`,
        ru: `/ru/arabic/dialogues/${level}/${slug}`,
        en: `/en/arabic/dialogues/${level}/${slug}`,
        'x-default': `/uz/arabic/dialogues/${level}/${slug}`,
      },
    },
  };
}

export default async function ArabicDialoguePage({ params }: PageParams) {
  const { locale, level, slug } = await params;
  setRequestLocale(locale);
  const d = loadArabicDialogue(level, slug);
  if (!d) notFound();

  const tr = locale === 'ru' ? d.titleTranslation_ru : locale === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/dialogues` },
      { name: `${d.title} — ${tr}`, path: `/${locale}/arabic/dialogues/${level}/${slug}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ArabicDialogueReader
        meta={{
          level: d.level, slug: d.id,
          title: d.title, translit: d.translit,
          titleTranslation_uz: d.titleTranslation_uz,
          titleTranslation_ru: d.titleTranslation_ru,
          titleTranslation_en: d.titleTranslation_en,
        }}
      />
    </>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: `● /[locale]/arabic/dialogues/[level]/[slug]` (SSG; prerenders `…/a1/greetings`). NOT `ƒ`. Note: the `<Link href="/arabic/dialogues">` back-link points at the Plan 2 catalog (404 until Plan 2) — acceptable for Plan 1; it does not break the build.

- [ ] **Step 5: Commit**

```bash
git add src/components/reader/ src/app/[locale]/arabic/
git commit -m "feat(arabic): ScriptConfig ReaderCore + Arabic dialogue reader + route"
```

---

### Task 8: Auth gate for the Arabic reader

**Files:**
- Modify: `src/proxy.ts:10` (PROTECTED_PATTERN)

- [ ] **Step 1: Extend the protected pattern**

In `src/proxy.ts`, change `PROTECTED_PATTERN` (line 10) to gate Arabic dialogue readers (catalog comes in Plan 2 and stays public):

```ts
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.|flashcards\/.|writing\/.)|^\/arabic\/dialogues\/./;
```

(The `arabic/dialogues/.` alternative requires a child segment after `dialogues/`, so the future bare `/arabic/dialogues` catalog stays public while `/arabic/dialogues/a1/greetings` gates.)

- [ ] **Step 2: Verify build + commit**

Run: `npm run build` (expected: succeeds).
```bash
git add src/proxy.ts
git commit -m "feat(arabic): gate /arabic/dialogues/<level>/<slug> behind login"
```

---

### Task 9: Verify end-to-end + ship

**Files:** none (verification + deploy)

- [ ] **Step 1: Preview the page locally**

Use the `preview_*` tools (NOT bash):
1. `preview_start`.
2. Log in (the dev preview shares the auth flow), then navigate to `/uz/arabic/dialogues/a1/greetings`.
3. `preview_snapshot` — confirm the four lines render in Arabic, right-aligned (RTL), speaker labels present.
4. `preview_click` the "Harakat" toggle → `preview_snapshot`: the vowel marks disappear (bare consonants) and reappear when toggled back.
5. `preview_click` the "Translit" toggle → transliteration line (`as-salāmu ʿalaykum.`) appears under each sentence, LTR.
6. `preview_click` the "Tarjima" toggle → translation line appears.
7. `preview_click` a sentence → `preview_network` shows a `POST /api/tts-ar` and audio plays (or check `preview_console_logs` for errors).
8. `preview_screenshot` to capture the RTL result for the user.

- [ ] **Step 2: Final build gate**

Run: `npm run build`
Expected: `● /[locale]/arabic/dialogues/[level]/[slug]`; `ƒ /api/tts-ar`; `ƒ /api/content/arabic/dialogue/[level]/[slug]`; all existing Chinese routes unchanged (`/chinese/*` still `●`); no `ƒ` leak on the Arabic page route.

- [ ] **Step 3: Merge + deploy**

```bash
git checkout main && git merge --ff-only arabic-foundation && git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```
(If the lockfile aborts the pull per CLAUDE.md: `ssh deploy@178.105.107.198 'cd /home/deploy/app && git checkout -- package-lock.json'`, then re-run `./deploy.sh`.)

- [ ] **Step 4: Production smoke test**

```bash
# Reader gated (uncookied) → 307 to login
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/arabic/dialogues/a1/greetings"
```
Expected: `307 -> https://blim.uz/uz/login`. (Logged-in rendering verified in Step 1 preview.)

---

## What Plan 1 deliberately leaves for later

- **Plan 2:** `/arabic/dialogues` catalog + CEFR pills; `/arabic` → catalog redirect; landing/BannerMenu "I'm learning: العربية" selector; focus mode + play-all FAB; Words tab (needs the `arabic_lexicon` table + resolver + admin); Stories section.
- **Plan 3:** Flashcards section; content-authoring flow; A1 content backfill.
- **Chinese migration onto ReaderCore:** optional, never required (the `chineseScriptConfig` proof config already validates the seam).
