# Dialogue Content Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve paid dialogue content only to entitled users (active trial or subscription), enforced server-side, while keeping the dialogue page a fast static shell.

**Architecture:** The static dialogue page ships only a hero shell (title/pinyin/translation) and no learning content. `DialogueReader` fetches the dialogue body at runtime from a new authenticated endpoint that checks entitlement and returns `402` (no content) for non-entitled users. A shared `resolveEntitlement(userId)` helper is the server-side source of truth.

**Tech Stack:** Next.js 16 App Router (route handlers, `params` is a Promise), TypeScript, Supabase admin (`getSupabaseAdmin`), local JWT decode (`getUserIdFromJWT`), existing services (`loadDialogue`, `resolveDialogueVocab`).

**Spec:** `docs/superpowers/specs/2026-06-14-dialogue-content-gating-design.md`

**Project reality — verification, not unit tests:** This repo has **no unit-test runner** (only `tsx` for `scripts/*.ts`). Verification uses `npx tsc --noEmit`, `npm run build` (route table / SSG check), `curl` against the dev server, the preview browser tools, and `npm run lint` — exactly how the rest of the codebase is verified. Pure logic that can be checked is extracted and checked with a one-off `tsx -e` run.

---

### Task 1: Server entitlement helper

**Files:**
- Create: `src/lib/entitlement.ts`

The trial date math is extracted into a pure function so it can be checked without Supabase. `resolveEntitlement` checks subscription first (fast indexed query) and only falls back to the slower `getUserById` for the trial check when there is no active subscription. Fails closed.

- [ ] **Step 1: Write the helper**

```ts
// src/lib/entitlement.ts
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const TRIAL_DAYS = 7;
const MS_PER_DAY = 86_400_000;

/** Pure: is the 7-day trial still active given signup time and "now" (ms)? */
export function isTrialActive(createdAtMs: number, nowMs: number): boolean {
  if (!Number.isFinite(createdAtMs)) return false;
  return createdAtMs + TRIAL_DAYS * MS_PER_DAY > nowMs;
}

export interface Entitlement {
  entitled: boolean;
}

/**
 * Server-side source of truth for "can this user access paid content".
 * Authoritative — never trusts the client. Subscription is checked first
 * (one indexed query); the trial fallback (needs auth.users.created_at via a
 * remote getUserById) runs only when there is no active subscription. Any
 * error fails closed (entitled: false).
 */
export async function resolveEntitlement(userId: string): Promise<Entitlement> {
  try {
    const admin = getSupabaseAdmin();
    const now = new Date();

    // 1. Active subscription?
    const { data: sub } = await admin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .gt('ends_at', now.toISOString())
      .limit(1)
      .maybeSingle();
    if (sub) return { entitled: true };

    // 2. Trial still active? (needs signup time from the auth user)
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.created_at) return { entitled: false };
    const createdAtMs = new Date(data.user.created_at).getTime();
    return { entitled: isTrialActive(createdAtMs, now.getTime()) };
  } catch {
    return { entitled: false };
  }
}
```

- [ ] **Step 2: Check the pure function**

Run:
```bash
npx tsx -e "import { isTrialActive } from './src/lib/entitlement.ts'; const now=Date.now(); const day=86400000; console.log('fresh signup ->', isTrialActive(now, now)===true); console.log('6 days ago ->', isTrialActive(now-6*day, now)===true); console.log('8 days ago ->', isTrialActive(now-8*day, now)===false); console.log('NaN ->', isTrialActive(NaN, now)===false);"
```
Expected: four `true` lines (each assertion holds).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/entitlement.ts
git commit -m "feat: server-side resolveEntitlement helper (trial OR subscription)"
```

---

### Task 2: Authenticated dialogue content endpoint

**Files:**
- Create: `src/app/api/content/dialogue/[book]/[slug]/route.ts`

Returns the resolved dialogue JSON only to entitled users; `401` for missing/bad token, `402` for not-entitled (no body), `404` for unknown book/slug. Mirrors the auth pattern of `src/app/api/subscription/route.ts`.

- [ ] **Step 1: Write the route**

```ts
// src/app/api/content/dialogue/[book]/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { loadDialogue, resolveDialogueVocab } from '@/services';

const BOOKS = new Set(['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6']);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ book: string; slug: string }> },
) {
  const { book, slug } = await params;
  if (!BOOKS.has(book)) {
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

  const raw = await loadDialogue(book, slug);
  if (!raw) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const dialogue = await resolveDialogueVocab(raw);
  return NextResponse.json({ dialogue });
}
```

- [ ] **Step 2: Build (route appears, compiles)**

Run: `npm run build 2>&1 | grep -E "api/content/dialogue|error" | head`
Expected: a line `ƒ /api/content/dialogue/[book]/[slug]` and no errors.

- [ ] **Step 3: Smoke-test the unauthenticated paths**

Start the dev server if not running (`npm run dev`), then:
```bash
curl -s -o /dev/null -w "no-token: %{http_code}\n" http://localhost:3000/api/content/dialogue/hsk1/anything
curl -s -o /dev/null -w "bad-book: %{http_code}\n" -H "Authorization: Bearer x.y.z" http://localhost:3000/api/content/dialogue/hskZ/anything
```
Expected: `no-token: 401` and `bad-book: 404`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/content/dialogue/[book]/[slug]/route.ts"
git commit -m "feat: authenticated dialogue content endpoint (entitlement-gated)"
```

---

### Task 3: Switch the reader to fetch the body; pages ship a shell

**Files:**
- Modify: `src/components/DialogueReader.tsx`
- Modify (all six, identical pattern): `src/app/[locale]/chinese/hsk{1..6}/dialogues/[dialogueId]/page.tsx`

The reader stops receiving `dialogue` and instead receives `meta` (hero fields + `book` + `slug`). It fetches the body on mount and gates the tab region on load status. The pages stop passing the resolved body.

> **Context for the implementer — the current reader (`src/components/DialogueReader.tsx`, ~675 lines):** `export function DialogueReader({ dialogue, bookPath, listPath })`. It calls `useRequireAuth()`, `useTrial()`, `useLanguage()`, `useStars('dialogue')`, then ~15 hooks/`useMemo`s that read `dialogue.sections`, `dialogue.audio_url`, `dialogue.vocab`, etc. The single early return is `if (authLoading) return <div className="loading-spinner" />;` (~line 404). The JSX return (~line 407) is: `<>{showPaywall && <Paywall/>}<div className="dialogue-reader{ paywall-blur}">` → hero (`dr-hero`, ~413-428, reads `dialogue.level/title/pinyin/titleTranslation*`) → tabs (`dr-tabs`, ~430) → four panels (`activeTab === 'dialog' | 'vocab' | 'dictation' | 'practice'`) → `<CoachMarkTour/>`. `showPaywall = trial?.isTrialExpired`. You will REPLACE the prop source and the paywall mechanism; the panel JSX stays the same.

- [ ] **Step 1: Add the `DialogueMeta` type and change the props**

In `src/components/DialogueReader.tsx`, add the exported meta type near the existing `DialogueData` interface and change the props interface:

```ts
export interface DialogueMeta {
  book: string;                 // 'hsk1'..'hsk6'
  slug: string;                 // dialogueId
  level?: number;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
}

interface DialogueReaderProps {
  meta: DialogueMeta;
  bookPath: string;
  listPath?: string;
}
```

Change the signature:
```ts
export function DialogueReader({ meta, bookPath, listPath }: DialogueReaderProps) {
```

- [ ] **Step 2: Add fetch state and the load effect**

Immediately after the existing hook calls (`useRequireAuth`, `useTrial`, `useLanguage`, `useStars`) add:

```ts
const { getAccessToken } = useAuth();
const [dialogue, setDialogue] = useState<DialogueData | null>(null);
const [status, setStatus] = useState<'loading' | 'loaded' | 'locked' | 'error'>('loading');
const [reloadKey, setReloadKey] = useState(0);

useEffect(() => {
  let cancelled = false;
  setStatus('loading');
  (async () => {
    try {
      const token = await getAccessToken();
      if (!token) { if (!cancelled) setStatus('locked'); return; }
      const res = await fetch(`/api/content/dialogue/${meta.book}/${meta.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cancelled) return;
      if (res.status === 401 || res.status === 402) { setStatus('locked'); return; }
      if (!res.ok) { setStatus('error'); return; }
      const data = await res.json();
      if (cancelled) return;
      setDialogue(data.dialogue as DialogueData);
      setStatus('loaded');
    } catch {
      if (!cancelled) setStatus('error');
    }
  })();
  return () => { cancelled = true; };
}, [meta.book, meta.slug, getAccessToken, reloadKey]);
```

Ensure `useAuth` is imported (it already is in sibling components; add `import { useAuth } from '@/hooks/useAuth';` if missing). Confirm `useState`/`useEffect` are imported (they are).

- [ ] **Step 3: Make every dialogue-reading hook null-safe**

Replace each `dialogue.X` access inside hooks/`useMemo`/`useEffect` with a null-safe form so hooks still run when `dialogue` is null (hook ORDER must not change — keep the hooks, just guard the reads). Examples (apply the same pattern to ALL such reads):

```ts
const allSentences = useMemo(
  () => (dialogue?.sections ?? []).flatMap(s => s.sentences),
  [dialogue],
);
// dialogue.audio_url        -> dialogue?.audio_url
// dialogue.vocab            -> dialogue?.vocab
// dialogue.phrases          -> dialogue?.phrases
// dialogue.timeOfDay        -> dialogue?.timeOfDay
// dialogue.sections.map(...) (inside JSX, guarded by status==='loaded') stays as dialogue.sections
```

Grep to find them all: `grep -n "dialogue\." src/components/DialogueReader.tsx`. Every read OUTSIDE the `status === 'loaded'` JSX branch must be `dialogue?.…`.

- [ ] **Step 4: Render hero from `meta`, gate the body on status, remove the blur**

Replace the old paywall line and the hero/body structure. The outer wrapper and hero now read from `meta`; the tab bar + panels render only when loaded:

```tsx
if (authLoading) return <div className="loading-spinner" />;

return (
  <>
    {status === 'locked' && <Paywall />}
    <div className="dialogue-reader" style={{ fontSize: `${fontSize}%` }}>

      {/* ── Hero banner (from meta — instant, static) ── */}
      <div className="dr-hero">
        <div className="dr-hero__watermark">对话</div>
        <div className="dr-hero__top-row">
          <Link href={listPath || `${bookPath}/dialogues`} className="dr-back-btn">
            {/* keep existing back-arrow svg */}
          </Link>
          <BannerMenu />
        </div>
        <div className="dr-hero__body">
          <div className="dr-hero__level">HSK {meta.level ?? 1} · {({ uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' } as Record<string, string>)[language]}</div>
          <h1 className="dr-hero__title">{meta.title}</h1>
          <div className="dr-hero__pinyin">{meta.pinyin}</div>
          <div className="dr-hero__translation">— {language === 'ru' ? meta.titleTranslation_ru : language === 'en' ? (meta.titleTranslation_en || meta.titleTranslation) : meta.titleTranslation} —</div>
        </div>
      </div>

      {status === 'loading' && <div className="loading-spinner" />}
      {status === 'error' && (
        <div className="page__audio-error" role="status" style={{ position: 'static', margin: '24px auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          {({ uz: 'Yuklab boʻlmadi.', ru: 'Не удалось загрузить.', en: 'Could not load.' } as Record<string, string>)[language]}
          <button type="button" className="dr-tabs__tab" onClick={() => setReloadKey(k => k + 1)}>
            {({ uz: 'Qayta urinish', ru: 'Повторить', en: 'Retry' } as Record<string, string>)[language]}
          </button>
        </div>
      )}

      {status === 'loaded' && dialogue && (
        <>
          {/* dr-tabs + the four activeTab panels — UNCHANGED from the original,
             they reference `dialogue.…` which is now the loaded state. */}
        </>
      )}

      <CoachMarkTour /* unchanged */ />
    </div>
  </>
);
```

Notes:
- The old `showPaywall`/`paywall-blur` are deleted. `trial` may now be unused for gating — if `useTrial()`/`trial` becomes unused, remove it to satisfy lint (the endpoint is the gate now).
- The `dr-tabs` block and the four `activeTab === ...` panels move INTO the `status === 'loaded' && dialogue && (...)` wrapper, verbatim. Their internal `dialogue.…` reads are valid there (non-null).
- Keep `firstLineRef`, audio refs, and all panel JSX exactly as-is.

- [ ] **Step 5: Update all six dialogue pages to pass `meta` instead of `dialogue`**

For each `src/app/[locale]/chinese/hsk{N}/dialogues/[dialogueId]/page.tsx` (N = 1..6): the page already calls `const raw = await loadDialogue('hskN', dialogueId);` and resolves vocab for JSON-LD. STOP resolving vocab for the reader and pass `meta`. Replace the render and drop the now-unneeded `resolveDialogueVocab` call **only if** it isn't used elsewhere on the page (it is used to build JSON-LD `translation`; keep `raw`'s top-level fields for that — they exist on `raw` without resolving vocab). Concretely, for hsk1 (apply the same, swapping the book id + listPath for the others):

```tsx
// page.tsx — default export body
const raw = await loadDialogue('hsk1', dialogueId);
if (!raw) notFound();

// ...existing JSON-LD using raw.title / raw.titleTranslation* (no vocab needed)...

return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    <DialogueReader
      meta={{
        book: 'hsk1',
        slug: dialogueId,
        level: raw.level,
        title: raw.title,
        pinyin: raw.pinyin,
        titleTranslation: raw.titleTranslation,
        titleTranslation_ru: raw.titleTranslation_ru,
        titleTranslation_en: raw.titleTranslation_en,
      }}
      bookPath="/chinese/hsk1"
      listPath="/chinese?tab=dialogues"
    />
  </>
);
```

Remove the `resolveDialogueVocab` import if no longer referenced on that page. Keep the `listPath` value each page already used (hsk2→`...&dialhsk=2`, … hsk6→`...&dialhsk=6`).

- [ ] **Step 6: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | tail -5`
Expected: no type errors; lint clean (fix any unused `trial`/`resolveDialogueVocab`/imports).

- [ ] **Step 7: Build — pages still SSG, content NOT in HTML**

Run: `npm run build 2>&1 | grep -E "dialogues/\[dialogueId\]|error" | head`
Expected: the six `● /[locale]/chinese/hsk{N}/dialogues/[dialogueId]` lines (SSG), no errors.

Then confirm the built shell has the hero but no body. With the production server running locally (`npm run build && npm run start`) OR against the dev server, fetch one page and check (the page is behind middleware, but the static HTML for an authed request still must not contain sentence text — verify the served HTML for a known dialogue contains the title but not a known sentence). If local auth makes this awkward, defer the definitive check to Task 4 gate 2 on prod.

- [ ] **Step 8: Verify the entitled path in the browser preview**

Use the preview tools: start the server, sign-in state permitting, open a dialogue URL for an entitled (trial/sub) account. Expected: hero appears instantly, spinner briefly, then the four tabs (Dialogue / Words / Dictation / Practice) work. Check `preview_console_logs` for errors and `preview_network` for the `200` `/api/content/dialogue/...` call.

- [ ] **Step 9: Commit**

```bash
git add src/components/DialogueReader.tsx "src/app/[locale]/chinese"
git commit -m "feat: dialogue reader fetches body from gated endpoint; pages ship shell only"
```

---

### Task 4: Verify gating end-to-end, then deploy

**Files:** none (verification + deploy)

- [ ] **Step 1: Locked path returns no content**

Obtain an access token for a NON-entitled user (expired trial, no subscription) — or temporarily point `resolveEntitlement` at a test by checking a known expired account's token. With that token:
```bash
curl -s -o /dev/null -w "locked: %{http_code}\n" -H "Authorization: Bearer <expired-user-token>" http://localhost:3000/api/content/dialogue/hsk1/<a-real-slug>
```
Expected: `locked: 402`, and the response body is `{"locked":true}` with no dialogue. If a non-entitled token isn't readily available, verify via the entitled token returning `200` + the `401` no-token case (Task 2) and rely on the unit check of `isTrialActive` (Task 1) for the boundary.

- [ ] **Step 2: Deploy**

```bash
git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```
(If the build added no dependency, no lockfile reset is needed.)

- [ ] **Step 3: Prod HTML leak check (the core success signal)**

```bash
SLUG=<a-real-hsk1-dialogue-slug>
curl -s "https://www.blim.uz/uz/chinese/hsk1/dialogues/$SLUG" | grep -c "dr-hero__title"   # >=1 (shell present)
curl -s "https://www.blim.uz/uz/chinese/hsk1/dialogues/$SLUG" | grep -c "story__dialogue-text\|sentence text"  # expect 0 (no body)
```
Expected: hero present, body absent. (The page is served behind middleware; this confirms the static HTML itself carries no learning content.)

- [ ] **Step 4: Prod entitled smoke + glossary-live check**

Sign in as an entitled account on prod, open a dialogue → content loads. Edit a glossary word in admin → reopen the dialogue → gloss is updated with no deploy (content is resolved per-request now).

- [ ] **Step 5: Final commit (if any verification tweaks)** — otherwise done.

---

## Self-Review

**Spec coverage:**
- Entitlement helper (trial OR sub, sub-first, fail-closed) → Task 1. ✓
- Content endpoint (401/402/404, no body when locked) → Task 2. ✓
- Page ships shell only (meta, no body) → Task 3 Step 5. ✓
- Reader fetch + loading/locked/error states, blur removed, hero from meta → Task 3 Steps 1–4. ✓
- All six HSK pages → Task 3 Step 5. ✓
- Glossary-live side effect → Task 4 Step 4. ✓
- Verification gates (tsc/build/SSG, no-content-in-HTML, entitled, locked, glossary) → Tasks 3–4. ✓

**Placeholder scan:** No TBD/TODO. The one conditional ("if a non-entitled token isn't readily available…") gives a concrete fallback, not a gap.

**Type consistency:** `DialogueMeta` (book/slug/level/title/pinyin/titleTranslation*) is defined in Task 3 Step 1 and consumed identically in Step 5. `resolveEntitlement → { entitled }` defined in Task 1, consumed in Task 2. `status` union (`loading|loaded|locked|error`) consistent across Task 3 steps. Endpoint path `/api/content/dialogue/[book]/[slug]` consistent in Tasks 2 and 3 Step 2.
