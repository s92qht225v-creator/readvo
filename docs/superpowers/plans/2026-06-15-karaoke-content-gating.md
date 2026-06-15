# Karaoke Content Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Gate paid karaoke lyrics the same way dialogues are gated — static shell + authenticated content endpoint; non-entitled users get a hard paywall and no lyrics in the page.

**Architecture:** Mirror the shipped dialogue gating (`docs/superpowers/specs/2026-06-14-dialogue-content-gating-design.md`). Reuse `resolveEntitlement`. The karaoke page ships a hero shell; `KaraokePlayer` fetches `song.lines` from `/api/content/karaoke/[songId]`.

**Tech Stack:** Next.js 16 route handlers, `getUserIdFromJWT`, `resolveEntitlement`, `loadKaraokeSong`/`loadKaraokeSongs` from `@/services/karaoke`.

**Reference (already shipped, copy its shape):**
- Endpoint: `src/app/api/content/dialogue/[book]/[slug]/route.ts`
- Reader: `src/components/DialogueReader.tsx` (meta prop + fetch effect + loading/loaded/locked/error states + `authLoading` guard)
- Entitlement: `src/lib/entitlement.ts` → `resolveEntitlement(userId)` returns `{ entitled }`.

**Karaoke facts:**
- Page `src/app/[locale]/chinese/hsk1/karaoke/[songId]/page.tsx` calls `loadKaraokeSong(songId)` and renders `<KaraokePlayer song={song} bookPath="/chinese/hsk1" />`.
- `KaraokePlayer({ song, bookPath })` (`src/components/KaraokePlayer.tsx`): paid content = `song.lines` (per-char lyrics + pinyin + timestamps) and `song.audio_url`. Shell/meta = `song.title`, `song.pinyin`, `song.titleTranslation`, `song.titleTranslation_ru`, `song.titleTranslation_en`, `song.id`. `showPaywall = trial?.isTrialExpired` (no free tier — all songs paid after trial). Hero reads `song.title/pinyin/titleTranslation*`.
- `KaraokeSong` type (`src/services/karaoke.ts`): `{ id, title, pinyin, titleTranslation, titleTranslation_ru, titleTranslation_en?, audio_url?, lines: KaraokeLine[], ... }`.
- Project has NO unit-test framework — verify with `tsc`/`lint`/`build` + curl + the built-HTML grep.

---

### Task 1: Karaoke content endpoint

**Files:** Create `src/app/api/content/karaoke/[songId]/route.ts`

- [ ] **Step 1: Write the route** (mirror the dialogue endpoint; no `book` set — karaoke ids are global; validate via `loadKaraokeSong` null→404; guard `songId` like the dialogue slug)

```ts
// src/app/api/content/karaoke/[songId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromJWT } from '@/lib/jwt';
import { resolveEntitlement } from '@/lib/entitlement';
import { loadKaraokeSong } from '@/services/karaoke';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> },
) {
  const { songId } = await params;
  if (!/^[\w-]+$/.test(songId)) {
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

  const song = await loadKaraokeSong(songId);
  if (!song) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ song }, { headers: { 'Cache-Control': 'no-store, private' } });
}
```

- [ ] **Step 2: Build + smoke**

Run: `npm run build 2>&1 | grep -E "api/content/karaoke|error" | head` → expect `ƒ /api/content/karaoke/[songId]`, no errors.
Then (dev server on :3000):
`curl -s -o /dev/null -w "no-token: %{http_code}\n" http://localhost:3000/api/content/karaoke/yueliang` → `401`.
`curl -s -o /dev/null -w "bad-id: %{http_code}\n" -H "Authorization: Bearer x.y.z" "http://localhost:3000/api/content/karaoke/bad..id"` → `404`.

- [ ] **Step 3: tsc + lint clean**, then commit:
`git add "src/app/api/content/karaoke/[songId]/route.ts" && git commit -m "feat: authenticated karaoke content endpoint (entitlement-gated)"`

---

### Task 2: KaraokePlayer fetches lyrics; page ships shell

**Files:**
- Modify `src/components/KaraokePlayer.tsx`
- Modify `src/app/[locale]/chinese/hsk1/karaoke/[songId]/page.tsx`

Apply the EXACT same transformation the shipped `DialogueReader` uses (read that file as the template).

- [ ] **Step 1: KaraokePlayer — meta prop + fetch + states**

Add an exported `KaraokeMeta` type and change props from `{ song, bookPath }` to `{ meta, bookPath }`:
```ts
export interface KaraokeMeta {
  id: string;
  title: string;
  pinyin: string;
  titleTranslation: string;
  titleTranslation_ru: string;
  titleTranslation_en?: string;
}
interface KaraokePlayerProps { meta: KaraokeMeta; bookPath: string; }
```
- Ensure `import { useAuth } from '@/hooks/useAuth';`. Add `const { getAccessToken } = useAuth();`, `const [song, setSong] = useState<KaraokeSong | null>(null);`, `const [status, setStatus] = useState<'loading'|'loaded'|'locked'|'error'>('loading');`, `const [reloadKey, setReloadKey] = useState(0);`.
- Add the fetch effect (copy the dialogue reader's, hitting `/api/content/karaoke/${meta.id}`, mapping 401/402→locked, !ok→error, ok→`setSong(data.song)` + loaded; no-token→locked). Put `setStatus('loading'); setSong(null);` at the TOP of the async IIFE (the project's `react-hooks/set-state-in-effect` rule forbids them directly in the effect body — match how DialogueReader does it). Guard with `if (authLoading) return;` and include `authLoading` in deps. (`authLoading` comes from the existing auth/`useRequireAuth` hook — check what KaraokePlayer already uses; if it has no `authLoading`, derive it the same way DialogueReader does via `useRequireAuth`.)
- Make EVERY `song.X` read in hooks/useMemo/useEffect null-safe (`song?.lines ?? []`, `song?.audio_url`, etc.). Run `grep -n "song\." src/components/KaraokePlayer.tsx` and handle each. Reads inside the `status==='loaded' && song` JSX branch can stay non-optional.
- Remove `useTrial`, `showPaywall`, and the `paywall-blur` class usage (do NOT delete the `.paywall-blur` CSS — flashcards still use it). Render `{status==='locked' && <Paywall/>}`. Hero renders from `meta.*`. The lyrics/controls/bottom-bar render only inside `status==='loaded' && song && (...)`. Add a `loading` spinner and an `error`+Retry (reuse the dialogue reader's `.page__audio-error` inline pattern + `setReloadKey`).

- [ ] **Step 2: Page passes meta**

In `src/app/[locale]/chinese/hsk1/karaoke/[songId]/page.tsx`: keep `loadKaraokeSong` for metadata/JSON-LD, but pass meta (built from the loaded song's top-level fields) instead of the whole song:
```tsx
<KaraokePlayer
  meta={{ id: songId, title: song.title, pinyin: song.pinyin, titleTranslation: song.titleTranslation, titleTranslation_ru: song.titleTranslation_ru, titleTranslation_en: song.titleTranslation_en }}
  bookPath="/chinese/hsk1"
/>
```
(If the page used `song` only for `<KaraokePlayer>` + JSON-LD, keep the `loadKaraokeSong` call — JSON-LD already reads top-level fields. Don't change metadata/generateStaticParams.)

- [ ] **Step 3: Verify**
- `npx tsc --noEmit` clean; `npm run lint` no NEW errors.
- `npm run build 2>&1 | grep -E "karaoke/\[songId\]|error" | head` → `● .../karaoke/[songId]` SSG, no errors.
- Built-HTML check: find a prerendered karaoke HTML under `.next/server/app/*/chinese/hsk1/karaoke/` and confirm it has the hero title but NOT the lyrics characters (no `karaoke__char`). Report findings.

- [ ] **Step 4: Commit**
`git add src/components/KaraokePlayer.tsx "src/app/[locale]/chinese/hsk1/karaoke" && git commit -m "feat: karaoke player fetches lyrics from gated endpoint; page ships shell"`

---

### Task 3: Verify + deploy

- [ ] Final review of the branch diff.
- [ ] Merge to main, push, deploy (`ssh deploy@178.105.107.198 './deploy.sh'`).
- [ ] Prod smoke: `/api/content/karaoke/yueliang` no-token → 401; bad id → 404; a karaoke page (no cookie) → 307 login.
- [ ] Hand off to user: entitled karaoke loads; expired-trial → paywall, no lyrics in source.

---

## Self-Review

- Endpoint mirrors the shipped, reviewed dialogue endpoint (401/402/404, no-store, slug guard). ✓
- Player change mirrors the shipped DialogueReader (meta + fetch + states + authLoading guard + null-safety + paywall hardening). ✓
- Free tier: karaoke has none (all songs paid after trial) — matches current `showPaywall = trial?.isTrialExpired`. ✓
- `.paywall-blur` CSS preserved (flashcards still use it). ✓
- Types: `KaraokeMeta` defined Task 2 Step 1, consumed Task 2 Step 2. `{ song }` response shape consumed by the player. ✓
