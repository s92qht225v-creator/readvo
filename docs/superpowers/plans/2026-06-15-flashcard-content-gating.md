# Flashcard Content Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Stop paid flashcard words from being readable by non-entitled users — both the statically-embedded SSR decks AND the wide-open `/api/flashcards/hsk1` endpoint.

**Architecture:** Same pattern as the shipped dialogue/karaoke gating, plus closing two existing open APIs. A gated content endpoint serves per-deck words (free decks to any authed user, paid decks only to entitled users); the SSR flashcard pages become shells that fetch via a small client loader; the two pre-existing open flashcard APIs get auth.

**Reuses:** `resolveEntitlement` (`src/lib/entitlement.ts`), the dialogue/karaoke endpoint+fetch pattern.

## Decisions (locked)
- **Free decks stay free:** HSK1 **lesson 1** (numeric `lessonId === '1'`) and **all topic decks**. Everything else (hsk1 writing-sets `hsk1-setN`, hsk2 `hsk2-setN`, hsk3 `hsk3-setN`, and **mix**) is paid (trial or subscription).
- **Mix becomes entitled-only.** Today `/api/flashcards/hsk1` is fully open and `mix` filters it client-side with a fragile selection-dependent "free if lesson 1 first" quirk. We drop that quirk: `mix` requires an active trial/subscription. (Lesson 1 by itself is still free via its own deck page.)
- **Topics stay free but require login** (a valid token; no entitlement) — closes the currently world-open topic API.

## Current deck-building (what the endpoint must replicate)
- `hsk1/[lessonId]` numeric: `loadFlashcardDeck('hsk1').words.filter(w => w.lesson === Number(lessonId))`, mapped to `{id,text_original,pinyin,text_translation(_ru/_en),lesson,audio_url}`; deck `{ id:`${deck.id}-lesson${n}`, title:`${n}-dars`, title_ru:`Урок ${n}`, words }`.
- `hsk1/[lessonId]` writing-set (`isWritingSetId(lessonId)`, e.g. `hsk1-set1`): `getWritingSet(lessonId).words.map((w,i)=>({id:`${lessonId}-${i}`,text_original:w.char,pinyin:w.pinyin,text_translation:w.uz,text_translation_ru:w.ru,text_translation_en:w.en,audio_url:getWritingAudioUrl(w.char,w.pinyin)}))`; deck `{ id:lessonId, title:`${setNum}-to'plam`, title_ru:`Набор ${setNum}`, words }`.
- `hsk2/[lessonId]` and `hsk3/[lessonId]`: identical to the hsk1 writing-set mapping but `getWritingSet` resolves from the HSK2_L2 / HSK3 sets (it already does — `getWritingSet` looks up by id across sets). deck `{ id:lessonId, title, title_ru, words }`.
- Helpers: `loadFlashcardDeck`, `getWritingSet`, `isWritingSetId`, `getWritingAudioUrl`, `getLessonsWithInfo` — all already exist (`@/services/flashcards`, `@/services/writing`, `@/services/content`). Read them.

**Project has NO unit-test framework** — verify with tsc/lint/build + curl + built-HTML grep.

---

### Task 1: Shared deck builder + gated content endpoint

**Files:**
- Modify `src/services/flashcards.ts` — add `buildFlashcardDeck(book, deckId)` (extract the deck-building above into ONE server function returning `{ deck: FlashcardDeckData; isFree: boolean } | null`).
- Create `src/app/api/content/flashcards/[book]/[deckId]/route.ts`.

- [ ] **Step 1: `buildFlashcardDeck`** in `src/services/flashcards.ts`

```ts
// returns null for unknown deck; isFree = HSK1 numeric lesson 1
export async function buildFlashcardDeck(
  book: string,
  deckId: string,
): Promise<{ deck: FlashcardDeckData; isFree: boolean } | null> {
  // hsk1 numeric lesson
  if (book === 'hsk1' && /^\d+$/.test(deckId)) {
    const full = await loadFlashcardDeck('hsk1');
    if (!full) return null;
    const n = Number(deckId);
    const words = full.words.filter((w) => w.lesson === n).map((w) => ({
      id: w.id, text_original: w.text_original, pinyin: w.pinyin,
      text_translation: w.text_translation, text_translation_ru: w.text_translation_ru,
      text_translation_en: w.text_translation_en, lesson: w.lesson, audio_url: w.audio_url,
    }));
    if (!words.length) return null;
    return { deck: { id: `${full.id}-lesson${n}`, title: `${n}-dars`, title_ru: `Урок ${n}`, words }, isFree: n === 1 };
  }
  // writing-set decks (hsk1-setN / hsk2-setN / hsk3-setN)
  if (isWritingSetId(deckId)) {
    const set = getWritingSet(deckId);
    if (!set) return null;
    const setNum = deckId.split('-set')[1];
    const words = set.words.map((w, i) => ({
      id: `${deckId}-${i}`, text_original: w.char, pinyin: w.pinyin,
      text_translation: w.uz, text_translation_ru: w.ru, text_translation_en: w.en,
      audio_url: getWritingAudioUrl(w.char, w.pinyin),
    }));
    return { deck: { id: deckId, title: `${setNum}-to'plam`, title_ru: `Набор ${setNum}`, words }, isFree: false };
  }
  return null;
}
```
Import `getWritingSet`, `isWritingSetId`, `getWritingAudioUrl` from `@/services/writing` (verify exact module + names) and `FlashcardDeckData`/`FlashcardWord` types. Match the EXACT word field mapping the pages use (copy from the page source).

- [ ] **Step 2: Endpoint** `src/app/api/content/flashcards/[book]/[deckId]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { buildFlashcardDeck } from '@/services/flashcards';

const BOOKS = new Set(['hsk1', 'hsk2', 'hsk3']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ book: string; deckId: string }> },
) {
  const { book, deckId } = await params;
  if (!BOOKS.has(book) || !/^[\w-]+$/.test(deckId)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const userId = token ? getUserIdFromJWT(token) : null;
  if (!userId) return NextResponse.json({ locked: true }, { status: 401 });

  const built = await buildFlashcardDeck(book, deckId);
  if (!built) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (!built.isFree) {
    const { entitled } = await resolveEntitlement(userId);
    if (!entitled) return NextResponse.json({ locked: true }, { status: 402 });
  }
  return NextResponse.json({ deck: built.deck }, { headers: { 'Cache-Control': 'no-store, private' } });
}
```
Note: free decks still require a valid token (login) but skip entitlement.

- [ ] **Step 3:** build (`ƒ /api/content/flashcards/[book]/[deckId]`), tsc, lint clean. Smoke: no-token→401, bad book→404. Commit `feat: gated flashcard content endpoint + buildFlashcardDeck`.

---

### Task 2: FlashcardDeckLoader + convert the 3 SSR pages to shells

**Files:**
- Create `src/components/FlashcardDeckLoader.tsx` (client).
- Modify `src/app/[locale]/chinese/hsk1/flashcards/[lessonId]/page.tsx`, `hsk2/.../page.tsx`, `hsk3/.../page.tsx`.

- [ ] **Step 1: `FlashcardDeckLoader`** — a thin client component that fetches the gated deck and renders the existing `FlashcardDeck` unchanged.

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { FlashcardDeck } from './FlashcardDeck';
import { Paywall } from './Paywall';
import type { FlashcardDeckData } from '@/types';

interface Props {
  book: string; deckId: string; bookPath: string; backHref?: string;
  lessonTitle?: string; lessonPinyin?: string; lessonTitleTranslation?: string; lessonTitleTranslation_ru?: string;
}
export function FlashcardDeckLoader({ book, deckId, ...rest }: Props) {
  const { isLoading: authLoading } = useRequireAuth();
  const { getAccessToken } = useAuth();
  const [deck, setDeck] = useState<FlashcardDeckData | null>(null);
  const [status, setStatus] = useState<'loading'|'loaded'|'locked'|'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setStatus('loading'); setDeck(null);
      try {
        const token = await getAccessToken();
        if (!token) { if (!cancelled) setStatus('locked'); return; }
        const res = await fetch(`/api/content/flashcards/${book}/${deckId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
        if (!res.ok) { setStatus('error'); return; }
        const data = await res.json();
        if (cancelled) return;
        setDeck(data.deck as FlashcardDeckData); setStatus('loaded');
      } catch { if (!cancelled) setStatus('error'); }
    })();
    return () => { cancelled = true; };
  }, [book, deckId, getAccessToken, reloadKey, authLoading]);

  if (authLoading || status === 'loading') return <div className="loading-spinner" />;
  if (status === 'locked') return <Paywall />;
  if (status === 'error') return <div style={{ padding: 40, textAlign: 'center' }}>Xatolik. <button onClick={() => setReloadKey(k => k + 1)}>Qayta urinish</button></div>;
  return <FlashcardDeck deck={deck!} {...rest} />;
}
```
(FlashcardDeck already calls `useRequireAuth` internally; double-calling the hook is harmless, but if the reviewer prefers, drop the hook here and rely on the token-null → locked path. Keep it simple.)

- [ ] **Step 2: hsk1/[lessonId]** — keep `generateMetadata`/`generateStaticParams`/JSON-LD. Replace BOTH `<FlashcardDeck deck={{...}} .../>` returns (writing-set branch and numeric branch) with `<FlashcardDeckLoader book="hsk1" deckId={lessonId} bookPath="/chinese/hsk1" lessonTitle={info?.title} lessonPinyin={info?.pinyin} lessonTitleTranslation={info?.titleTranslation} lessonTitleTranslation_ru={info?.titleTranslation_ru} />` (numeric branch passes the `info` props; writing-set branch passes none). Keep the `notFound()` guards for unknown ids (so 404s still happen server-side); the page may still call `getWritingSet`/`loadFlashcardDeck` just to validate existence + build JSON-LD, but must NOT pass words to the client. Simplest: keep the existence checks, drop the word arrays from what's rendered.

- [ ] **Step 3: hsk2 + hsk3** — same: keep metadata/JSON-LD/`getWritingSet` existence check + `notFound()`, replace `<FlashcardDeck deck={{...}}/>` with `<FlashcardDeckLoader book="hsk2"|"hsk3" deckId={lessonId} bookPath=... backHref=... />`.

- [ ] **Step 4:** tsc/lint/build clean; all three flashcard routes still `●` SSG. Built-HTML check: a prerendered `hsk2/flashcards/<set>.html` must NOT contain the word translations (grep a known word). Commit `feat: flashcard SSR pages ship shell; deck fetched via gated loader`.

---

### Task 3: Close the two open flashcard APIs

**Files:** `src/app/api/flashcards/hsk1/route.ts`, `src/app/api/flashcards/topic/[topicId]/route.ts`, `src/app/[locale]/chinese/hsk1/flashcards/mix/page.tsx`, topic page.

- [ ] **Step 1: `/api/flashcards/hsk1`** — add auth + entitlement (mix is paid). Change `GET()` to `GET(request: NextRequest)`: read Bearer → `getUserIdFromJWT` → 401 if none; `resolveEntitlement` → 402 if not entitled; else return the existing `{ ...deck, lessonHeaders }` with `Cache-Control: no-store, private`.

- [ ] **Step 2: mix page** — handle the new 401/402: when `res.status === 401 || 402`, render `<Paywall />` (add a `locked` state) instead of the generic error. Keep the existing success path.

- [ ] **Step 3: `/api/flashcards/topic/[topicId]`** — add a Bearer-token check (any valid `getUserIdFromJWT` user; NO entitlement — topics are free). 401 if no token. Return the topic deck otherwise with `Cache-Control: no-store, private`. (The topic page is behind login middleware already; this just closes the world-open API.)

- [ ] **Step 4:** tsc/lint/build clean. Smoke: `/api/flashcards/hsk1` no-token → 401; `/api/flashcards/topic/<id>` no-token → 401. Commit `security: gate /api/flashcards/hsk1 (entitlement) + topic (login)`.

---

### Task 4: Verify + merge + deploy

- [ ] Final review of the branch.
- [ ] Merge to main, push, deploy.
- [ ] Prod smoke: all flashcard content endpoints → 401 without token; `/api/flashcards/hsk1` → 401 (was 200-open before!); a paid flashcard page (no cookie) → 307 login.
- [ ] Hand to user: lesson-1 + topics load for any logged-in user; lesson-2+/hsk2/hsk3/mix → paywall for expired trial; no words in page source for paid decks.

---

## Self-Review
- Closes BOTH holes: static-embedded SSR decks (Task 2) AND the open `/api/flashcards/hsk1` (Task 3). ✓
- Free set (hsk1 lesson 1 + topics) preserved; everything else gated. ✓
- `buildFlashcardDeck` is the single source of deck-building (DRY) — endpoint + (no longer the pages). ✓
- `FlashcardDeck` component UNCHANGED (loader wraps it) — low risk. ✓
- Types: `buildFlashcardDeck → { deck, isFree }` (Task 1) consumed by endpoint (Task 1) ; `{ deck }` response consumed by `FlashcardDeckLoader` (Task 2). ✓
- `.paywall-blur` CSS untouched. ✓
