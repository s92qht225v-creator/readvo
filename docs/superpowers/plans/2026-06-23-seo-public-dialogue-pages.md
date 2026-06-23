# SEO Public Dialogue Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each Chinese dialogue page a public, crawlable landing page (hero + description + full vocab + a 3-line teaser) that funnels visitors into the gated full reader, so search engines index dialogue content.

**Architecture:** The route stays SSG. The page resolves the dialogue server-side and passes a **public preview slice** (description, first 3 sentences, resolved vocab, hero image) as **props** to the client `DialogueReader` — so that subset is server-rendered into the HTML (crawlable). The full sentence list + audio remain a **gated client fetch** (`/api/content/dialogue/...`, 401/402 for anon). The reader is converted from a hard `useRequireAuth()` redirect to a **soft gate**: anonymous visitors and crawlers see the preview + a "Read & Listen" CTA that links to login; logged-in users get the full dialogue rendered inline. `proxy.ts` stops 307-gating the route.

**Tech Stack:** Next.js 16 App Router (SSG/ISR), TypeScript, React client components, CSS (`reading.css`). No component test suite exists — verification is `npm run build` + `curl`/`grep` of server-rendered HTML + visual checks via the `preview_*` tools, per established project practice. Pure logic (the preview-slice builder) gets a real unit test via `node --test`.

**Staged delivery:** Five stages, each ending with an explicit **Quality Gate**. Do not start a stage until the previous gate passes. Work on branch `seo-dialogue-pages`.

---

## File Structure

**New files:**
- `src/services/dialoguePreview.ts` — pure `buildDialoguePreview()` that derives the public slice from a resolved dialogue. One responsibility: decide what's public.
- `src/services/dialoguePreview.test.ts` — `node --test` unit tests for the builder.
- `src/components/DialogueHero.tsx` — presentational image/placeholder hero (client-safe, no state). One responsibility: render the hero.
- `src/components/dialoguePreview.types.ts` — shared `DialoguePreviewData` type imported by the page (server) and reader (client) without pulling client code into the server graph.

**Modified files:**
- `src/services/dialogues.ts` — add optional `image` + `description_*` to `DialoguePage`; surface them through resolve.
- `src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx` — resolve dialogue, build preview, pass as prop; add `openGraph.images`.
- `src/components/DialogueReader.tsx` — accept `preview` prop, render hero/description/teaser/vocab from it immediately (SSR), soft-gate instead of redirect, enrich to full content when authed.
- `src/proxy.ts` — remove `dialogues\/hsk` from `PROTECTED_PATTERN`.
- `src/styles/reading.css` — styles for the new image hero + teaser lock divider + preview description.

**Unchanged (verify only):** `src/app/api/content/dialogue/[book]/[slug]/route.ts` (stays gated), `src/app/sitemap.ts` (route already included).

---

## Stage 1 — Data layer (invisible foundations)

Adds the content fields and the pure function that decides the public slice. No UI yet.

### Task 1: Add optional `image` + `description_*` fields to the dialogue type

**Files:**
- Modify: `src/services/dialogues.ts:21-86` (the `DialoguePage` interface)

- [ ] **Step 1: Add the fields to `DialoguePage`**

In `src/services/dialogues.ts`, inside `interface DialoguePage`, add these optional fields right after `audio_url?: string;` (currently line 31):

```typescript
  audio_url?: string;
  /** Hero image URL (Supabase). Absent → branded placeholder is used. */
  image?: string;
  /** Public SEO description, per locale. Absent → falls back to title translation. */
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
```

These are optional, so existing JSON files remain valid. `resolveDialogueVocab` spreads `...d`, so the fields flow through `DialoguePageResolved` automatically.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/dialogues.ts
git commit -m "feat(dialogue): add optional image + description_* content fields"
```

### Task 2: `buildDialoguePreview()` — the public-slice builder (TDD)

This pure function is the single place that decides what becomes public. It takes a resolved dialogue and returns only the publishable subset.

**Files:**
- Create: `src/components/dialoguePreview.types.ts`
- Create: `src/services/dialoguePreview.ts`
- Test: `src/services/dialoguePreview.test.ts`

- [ ] **Step 1: Define the shared type**

Create `src/components/dialoguePreview.types.ts`:

```typescript
import type { VocabItem } from '@/services/glossary';

/** One dialogue line exposed publicly in the teaser. */
export interface PreviewSentence {
  id: string;
  text_original: string;
  pinyin: string;
  text_translation: string;
  text_translation_ru: string;
  text_translation_en?: string;
  speaker?: string;
}

/** The public, crawlable slice of a dialogue. Server-rendered into the page HTML. */
export interface DialoguePreviewData {
  image?: string;
  description_uz?: string;
  description_ru?: string;
  description_en?: string;
  /** First N dialogue lines shown to everyone. */
  teaser: PreviewSentence[];
  /** Number of lines hidden behind the gate (for the "yana N qator" divider). */
  hiddenCount: number;
  /** Full resolved vocab — public (the primary SEO content). */
  vocab: VocabItem[];
}
```

- [ ] **Step 2: Write the failing test**

Create `src/services/dialoguePreview.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDialoguePreview, TEASER_LINES } from './dialoguePreview.ts';

const baseSentence = (id: string) => ({
  id, text_original: `text-${id}`, pinyin: `pinyin-${id}`,
  text_translation: `uz-${id}`, text_translation_ru: `ru-${id}`, speaker: 'A',
});

const resolved = (sentenceCount: number) => ({
  id: 'd1', title: 'T', pinyin: 'P', titleTranslation: 'tt', titleTranslation_ru: 'ttr',
  level: 1, image: 'http://img/x.jpg', description_uz: 'salom',
  sections: [{ id: 's', type: 'text', heading: '', subheading: '',
    sentences: Array.from({ length: sentenceCount }, (_, i) => baseSentence(String(i + 1))) }],
  vocab: [{ zh: '你好', py: 'nǐhǎo', uz: 'salom', ru: 'привет', en: 'hello' }],
}) as any;

test('teaser takes the first TEASER_LINES sentences and counts the rest as hidden', () => {
  const p = buildDialoguePreview(resolved(8));
  assert.equal(p.teaser.length, TEASER_LINES);
  assert.equal(p.hiddenCount, 8 - TEASER_LINES);
  assert.equal(p.teaser[0].id, '1');
});

test('teaser never exceeds the available sentences; hiddenCount is zero', () => {
  const p = buildDialoguePreview(resolved(2));
  assert.equal(p.teaser.length, 2);
  assert.equal(p.hiddenCount, 0);
});

test('passes image, description and vocab through unchanged', () => {
  const p = buildDialoguePreview(resolved(5));
  assert.equal(p.image, 'http://img/x.jpg');
  assert.equal(p.description_uz, 'salom');
  assert.equal(p.vocab.length, 1);
  assert.equal(p.vocab[0].zh, '你好');
});

test('handles a dialogue with no vocab and no sections gracefully', () => {
  const empty = { id: 'd', title: '', pinyin: '', titleTranslation: '', titleTranslation_ru: '', level: 1, sections: [] } as any;
  const p = buildDialoguePreview(empty);
  assert.deepEqual(p.teaser, []);
  assert.equal(p.hiddenCount, 0);
  assert.deepEqual(p.vocab, []);
});
```

- [ ] **Step 2b: Run it, confirm it fails**

Run: `node --test src/services/dialoguePreview.test.ts`
Expected: FAIL — `Cannot find module './dialoguePreview.ts'`.

- [ ] **Step 3: Implement the builder**

Create `src/services/dialoguePreview.ts`:

```typescript
import type { DialoguePageResolved } from './dialogues';
import type { DialoguePreviewData, PreviewSentence } from '@/components/dialoguePreview.types';

/** Number of dialogue lines shown publicly as a teaser. */
export const TEASER_LINES = 3;

/**
 * Derive the public, crawlable slice from a fully-resolved dialogue.
 * Public = image, description, the first TEASER_LINES lines, and ALL vocab.
 * Everything else (remaining lines, audio) stays gated and is never returned here.
 */
export function buildDialoguePreview(d: DialoguePageResolved): DialoguePreviewData {
  const allSentences = (d.sections ?? []).flatMap((s) => s.sentences ?? []);
  const teaser: PreviewSentence[] = allSentences.slice(0, TEASER_LINES).map((s) => ({
    id: s.id,
    text_original: s.text_original,
    pinyin: s.pinyin,
    text_translation: s.text_translation,
    text_translation_ru: s.text_translation_ru,
    text_translation_en: s.text_translation_en,
    speaker: s.speaker,
  }));
  return {
    image: d.image,
    description_uz: d.description_uz,
    description_ru: d.description_ru,
    description_en: d.description_en,
    teaser,
    hiddenCount: Math.max(0, allSentences.length - teaser.length),
    vocab: d.vocab ?? [],
  };
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `node --test src/services/dialoguePreview.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/dialoguePreview.types.ts src/services/dialoguePreview.ts src/services/dialoguePreview.test.ts
git commit -m "feat(dialogue): buildDialoguePreview public-slice builder + tests"
```

### ✅ Quality Gate 1

Run and confirm ALL pass before Stage 2:
- `node --test src/services/dialoguePreview.test.ts` → 4/4 pass.
- `npx tsc --noEmit` → clean.
- Manual review: `buildDialoguePreview` returns **no** sentences beyond `TEASER_LINES` (security: the gated lines must never appear in the public slice). Read the function and confirm `slice(0, TEASER_LINES)` is the only sentence source.

**Bar:** tests green, types clean, and the slice provably excludes gated lines. If any fail, fix before proceeding.

---

## Stage 2 — Public preview UI (presentational, server-rendered)

Build the hero + the preview rendering and wire it so the page server-renders the preview. The reader's gating is NOT touched yet — this stage is about getting the look right.

### Task 3: `DialogueHero` presentational component

**Files:**
- Create: `src/components/DialogueHero.tsx`
- Modify: `src/styles/reading.css` (append hero styles)

- [ ] **Step 1: Create the hero component**

Create `src/components/DialogueHero.tsx`:

```tsx
import { Link } from '@/i18n/navigation';
import type { Language } from '../types/ui-state';

interface DialogueHeroProps {
  image?: string;
  title: string;
  pinyin: string;
  level: number;
  listPath: string;
  language: Language;
}

/**
 * Image-as-hero for the public dialogue page. Renders the dialogue photo when
 * `image` is set, otherwise a branded Blim-red placeholder. The title/pinyin
 * overlay the bottom. Purely presentational — safe to server-render.
 */
export function DialogueHero({ image, title, pinyin, level, listPath, language }: DialogueHeroProps) {
  const backLabel = ({ uz: 'Orqaga', ru: 'Назад', en: 'Back' } as Record<string, string>)[language];
  const levelLabel = ({ uz: 'Dialog', ru: 'Диалог', en: 'Dialogue' } as Record<string, string>)[language];
  return (
    <div className={`dlg-hero ${image ? '' : 'dlg-hero--placeholder'}`}>
      {image && <img className="dlg-hero__img" src={image} alt={`${title} — ${pinyin}`} />}
      <div className="dlg-hero__scrim" />
      <Link href={listPath} className="dlg-hero__back" aria-label={backLabel}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      </Link>
      <div className="dlg-hero__body">
        <div className="dlg-hero__level">HSK {level} · {levelLabel}</div>
        <h1 className="dlg-hero__title" lang="zh-Hans">{title}</h1>
        <div className="dlg-hero__pinyin">{pinyin}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Append hero styles to `reading.css`**

Append to `src/styles/reading.css`:

```css
/* ── Public dialogue page: image-as-hero ───────────────────────────────── */
.dlg-hero { position: relative; width: 100%; height: 200px; overflow: hidden; background: #b91c1c; display: flex; align-items: flex-end; }
.dlg-hero--placeholder { background: linear-gradient(135deg, #dc2626, #b91c1c 55%, #7f1d1d); }
.dlg-hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.dlg-hero__scrim { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.05) 55%, transparent); }
.dlg-hero__back { position: absolute; top: 12px; left: 12px; z-index: 2; display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: rgba(0,0,0,0.32); color: #fff; }
.dlg-hero__body { position: relative; z-index: 1; padding: 14px 18px; color: #fff; }
.dlg-hero__level { font-size: 13px; opacity: 0.92; margin-bottom: 4px; }
.dlg-hero__title { font-size: 24px; font-weight: 700; margin: 0; line-height: 1.2; }
.dlg-hero__pinyin { font-size: 14px; opacity: 0.9; margin-top: 2px; }
@media (min-width: 768px) { .dlg-hero { height: 260px; } }
```

- [ ] **Step 3: Build to confirm no breakage**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/DialogueHero.tsx src/styles/reading.css
git commit -m "feat(dialogue): DialogueHero image/placeholder hero + styles"
```

### Task 4: Render the preview region inside `DialogueReader` from props (SSR shell)

This makes the reader render the preview (hero, description, teaser, vocab) from server props on first paint. The existing fetch/gating still runs underneath; we layer the SSR shell first and reconcile gating in Stage 3. To keep this stage shippable and low-risk, the preview shell is rendered **above** the existing reader body and the old `dr-hero` is replaced by `DialogueHero`.

**Files:**
- Modify: `src/components/DialogueReader.tsx` (props, imports, hero swap, preview render)
- Modify: `src/styles/reading.css` (teaser + description styles)

- [ ] **Step 1: Extend the reader's props**

In `src/components/DialogueReader.tsx`, find the `DialogueReaderProps` interface (search `interface DialogueReaderProps`) and add a `preview` field:

```typescript
import type { DialoguePreviewData } from './dialoguePreview.types';
```

```typescript
interface DialogueReaderProps {
  meta: DialogueMeta;
  bookPath?: string;
  listPath?: string;
  preview: DialoguePreviewData;   // server-rendered public slice (always present)
}
```

Update the destructure: `export function DialogueReader({ meta, bookPath, listPath, preview }: DialogueReaderProps) {`.

- [ ] **Step 2: Add description localization + import the hero + vocab**

Near the other imports add:

```typescript
import { DialogueHero } from './DialogueHero';
```

`DialogueVocab` is already imported. Add a description helper just inside the component body (after `const [language] = useLanguage();`):

```typescript
  const description = language === 'ru' ? preview.description_ru
    : language === 'en' ? (preview.description_en || preview.description_uz)
    : preview.description_uz;
  const teaserTr = (s: typeof preview.teaser[number]) =>
    language === 'ru' ? s.text_translation_ru
    : language === 'en' ? (s.text_translation_en || s.text_translation)
    : s.text_translation;
```

- [ ] **Step 3: Replace the `dr-hero` block with `DialogueHero` + preview shell**

In the `return (...)`, replace the existing `{/* ── Hero banner ── */}` `<div className="dr-hero">…</div>` block with:

```tsx
        <DialogueHero
          image={preview.image}
          title={meta.title}
          pinyin={meta.pinyin}
          level={meta.level ?? 1}
          listPath={listPath || `${bookPath}/dialogues`}
          language={language}
        />

        {description && <p className="dlg-desc">{description}</p>}
```

- [ ] **Step 4: Add teaser + description styles to `reading.css`**

Append:

```css
.dlg-desc { padding: 12px 18px 0; margin: 0; font-size: 15px; line-height: 1.6; color: var(--text, #333); }
.dlg-teaser__line { background: #f5f5f5; border-radius: 10px; padding: 8px 12px; margin: 8px 18px; }
.dlg-teaser__zh { font-size: 17px; } .dlg-teaser__py { color: #888; font-size: 13px; margin-left: 6px; }
.dlg-teaser__tr { color: #555; font-size: 13px; margin-top: 2px; }
.dlg-teaser__lock { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 16px 18px; color: #999; font-size: 13px; }
.dlg-teaser__lock::before, .dlg-teaser__lock::after { content: ""; flex: 1; border-top: 1px dashed #ccc; }
```

- [ ] **Step 5: Build + visually verify the preview shell**

Run: `npm run build 2>&1 | tail -5` → succeeds.
Then start the dev server and screenshot a dialogue page (logged-out) with the `preview_*` tools: `preview_start`, navigate to `/uz/chinese/dialogues/hsk1/what-is-your-name`, `preview_screenshot`.
Expected: image/placeholder hero + description visible. (Teaser lines + vocab wiring land in Stage 3 when the data path is finalized; in this stage the hero + description must render correctly.)

- [ ] **Step 6: Commit**

```bash
git add src/components/DialogueReader.tsx src/styles/reading.css
git commit -m "feat(dialogue): render image hero + description from server preview props"
```

### Task 5: Pass `preview` from the page (server-rendered)

**Files:**
- Modify: `src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx`

- [ ] **Step 1: Resolve the dialogue and build the preview in the page body**

In `page.tsx`, add imports:

```typescript
import { getDialogue, loadDialoguesForBook, resolveDialogueVocab } from '@/services';
import { buildDialoguePreview } from '@/services/dialoguePreview';
```

In `DialoguePage`, after `const raw = await getDialogue(level, dialogueId); if (!raw) notFound();`, add:

```typescript
  const resolved = await resolveDialogueVocab(raw);
  const preview = buildDialoguePreview(resolved);
```

- [ ] **Step 2: Pass `preview` to the reader**

In the `<DialogueReader ... />` JSX, add the prop:

```tsx
      <DialogueReader
        meta={{
          book: level,
          slug: dialogueId,
          level: raw.level,
          title: raw.title,
          pinyin: raw.pinyin,
          titleTranslation: raw.titleTranslation,
          titleTranslation_ru: raw.titleTranslation_ru,
          titleTranslation_en: raw.titleTranslation_en,
        }}
        bookPath={`/chinese/${level}`}
        listPath={`/chinese/dialogues?dialhsk=${num}`}
        preview={preview}
      />
```

- [ ] **Step 3: Build, confirm SSG + preview in HTML**

Run: `npm run build 2>&1 | grep "dialogues/\[level\]"`
Expected: line shows `●` (SSG), not `ƒ`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx"
git commit -m "feat(dialogue): build + pass server preview slice to reader"
```

### ✅ Quality Gate 2

- `npm run build` succeeds; the dialogue route is `●` SSG.
- `preview_screenshot` of a logged-out dialogue page shows the image/placeholder hero + localized description, matching the approved mockup's top half.
- No console errors in `preview_console_logs`.
- Compare against the mockup: hero proportions, title overlay legibility, description placement.

**Bar:** the hero + description render correctly and match the mockup. If the look is off, iterate here (adjust CSS/markup) before touching gating in Stage 3.

---

## Stage 3 — Gating split (the core change)

Make the preview (hero, description, teaser, vocab) public and crawlable, keep the rest gated, and ungate the route. After this stage the SEO goal is met.

### Task 6: Render teaser + vocab from preview; soft-gate the full content

**Files:**
- Modify: `src/components/DialogueReader.tsx`

- [ ] **Step 1: Remove the hard auth redirect**

In `DialogueReader.tsx`, remove the `useRequireAuth` import and its call. Replace:

```typescript
import { useRequireAuth } from '../hooks/useRequireAuth';
```
```typescript
  const { isLoading: authLoading } = useRequireAuth();
```

with a soft auth read (keep `useAuth` which is already imported):

```typescript
  const { getAccessToken, user } = useAuth();
  const authLoading = false;
```

(`useAuth` already exposes `user`; confirm by checking `src/hooks/useAuth.tsx`. If the loading flag is named differently there, use it instead of the `false` literal — the goal is: never redirect, never block the preview.)

- [ ] **Step 2: Do not render the full-page Paywall; gate softly**

Remove the `{status === 'locked' && <Paywall />}` line. The preview stays visible regardless of `status`. (Keep the `Paywall` import only if used elsewhere; otherwise remove it to avoid an unused-import error — `npx tsc --noEmit` will tell you.)

- [ ] **Step 3: Render the teaser + lock CTA in the Dialog/Read tab**

Locate where the Dialog tab renders sentences from `dialogue` state. Render the **teaser** from `preview.teaser` whenever the full `dialogue` is not loaded (anon, loading, or locked), and the full list when loaded. Add this block at the top of the Dialog-tab body:

```tsx
        {status !== 'loaded' && (
          <div className="dlg-teaser">
            {preview.teaser.map((s) => (
              <div className="dlg-teaser__line" key={s.id}>
                <div><span className="dlg-teaser__zh" lang="zh-Hans">{s.text_original}</span><span className="dlg-teaser__py">{s.pinyin}</span></div>
                <div className="dlg-teaser__tr">{teaserTr(s)}</div>
              </div>
            ))}
            {preview.hiddenCount > 0 && (
              <div className="dlg-teaser__lock">
                <span>🔒 {({ uz: `yana ${preview.hiddenCount} qator`, ru: `ещё ${preview.hiddenCount} строк`, en: `${preview.hiddenCount} more lines` } as Record<string, string>)[language]}</span>
              </div>
            )}
            <Link href={user ? '#' : `/login`} className="dlg-read-cta">
              {({ uz: "O'qish va tinglash", ru: 'Читать и слушать', en: 'Read & Listen' } as Record<string, string>)[language]}
            </Link>
          </div>
        )}
```

Add the CTA style to `reading.css`:

```css
.dlg-read-cta { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 8px 18px 16px; padding: 12px; background: #b91c1c; color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; }
```

- [ ] **Step 4: Always render the public vocab from `preview.vocab`**

The Words/Keywords tab must show vocab even for anonymous users. Where the Words tab currently uses `dialogue?.vocab`, prefer the loaded vocab when available, else the public preview vocab:

```tsx
<DialogueVocab words={(status === 'loaded' && dialogue?.vocab?.length ? dialogue.vocab : preview.vocab)} language={language} />
```

This guarantees vocab is in the SSR HTML (from `preview.vocab`) for crawlers and anonymous users.

- [ ] **Step 5: Type-check + build**

Run: `npx tsc --noEmit` → clean (resolve any unused-import errors).
Run: `npm run build 2>&1 | tail -5` → succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/DialogueReader.tsx src/styles/reading.css
git commit -m "feat(dialogue): soft-gate — public teaser + vocab, login CTA for the rest"
```

### Task 7: Ungate the route in middleware

**Files:**
- Modify: `src/proxy.ts:10`

- [ ] **Step 1: Remove the dialogue gate from `PROTECTED_PATTERN`**

Change line 10 from:

```typescript
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.|flashcards\/.|writing\/.)|^\/arabic\/dialogues\/[^/]+\/.|^\/arabic\/flashcards\/./;
```

to (drop `dialogues\/hsk|`):

```typescript
const PROTECTED_PATTERN = /^\/chinese\/(hsk|karaoke\/.|flashcards\/.|writing\/.)|^\/arabic\/dialogues\/[^/]+\/.|^\/arabic\/flashcards\/./;
```

Anonymous requests to `/chinese/dialogues/hsk*/...` now reach the page (200) instead of redirecting. `/chinese/hsk*` legacy routes stay gated.

- [ ] **Step 2: Build**

Run: `npm run build 2>&1 | tail -5` → succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat(seo): ungate Chinese dialogue route so crawlers get 200"
```

### ✅ Quality Gate 3 (the SEO + gating gate)

Start the dev server (`preview_start`). With a **logged-out** browser session:
- `preview` a dialogue URL; `preview_snapshot` — confirm hero, description, the 3 teaser lines, the lock divider, the "Read & Listen" CTA, and the full vocab list are all visible.
- Inspect the **server HTML** for crawlability: `curl -s http://localhost:3000/uz/chinese/dialogues/hsk1/what-is-your-name | grep -c "你好"` and `grep` for a vocab pinyin string — both must appear in the raw HTML (proves SSR, not JS-injected). If they're missing from `curl` output but present in the browser, the content is client-only — fix before proceeding (the teaser/vocab must come from props, which SSR includes).
- Confirm the gated lines are **absent** from the curl HTML: pick a 5th-line hanzi string and `grep` — it must NOT appear.
- Click "Read & Listen" while logged out → routes to `/login`.
- Log in (entitled account) → the full dialogue (lines 4→end) + audio render inline; vocab/dictation/practice tabs work. No regression vs. the old reader.

**Bar:** logged-out HTML contains teaser + vocab and excludes gated lines; logged-in full experience is intact. This is the make-or-break gate — do not proceed until all checks pass.

---

## Stage 4 — SEO metadata + structured data

Make the page maximally indexable and shareable.

### Task 8: `og:image` from the hero (or placeholder)

**Files:**
- Modify: `src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx` (`generateMetadata`)

- [ ] **Step 1: Add openGraph with the dialogue image**

In `generateMetadata`, add an `openGraph` block to the returned metadata object (alongside `title`/`description`/`alternates`). Use the dialogue image when present, else fall back to the site default OG image:

```typescript
    openGraph: {
      title: dialogue ? `${hanzi} — ${translation}` : undefined,
      description: dialogue ? `HSK ${num} Chinese dialogue` : undefined,
      images: dialogue?.image ? [{ url: dialogue.image }] : undefined,
      type: 'article',
    },
```

(`dialogue` here is the `getDialogue` result already fetched in `generateMetadata`; `image` is now on the type. When absent, omit `images` so the root-layout default OG image applies.)

- [ ] **Step 2: Build**

Run: `npm run build 2>&1 | tail -5` → succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx"
git commit -m "feat(seo): og:image from dialogue hero for dialogue pages"
```

### Task 9: Verify sitemap + JSON-LD already cover the route

**Files:**
- Read-only: `src/app/sitemap.ts`, `page.tsx` JSON-LD block

- [ ] **Step 1: Confirm dialogues are in the sitemap**

Run: `npm run build && curl -s http://localhost:3000/sitemap.xml | grep -c "/chinese/dialogues/hsk"`
Expected: count > 0 (one entry per dialogue per locale). If zero, add dialogue URLs to `sitemap.ts` mirroring the existing pattern. (Expected: already present — the route pre-existed.)

- [ ] **Step 2: Confirm the LearningResource JSON-LD renders**

`curl -s` a dialogue URL and `grep "LearningResource"` — confirm the existing structured data is in the HTML. No change expected; this is a verification step.

- [ ] **Step 3: Commit (only if sitemap needed a change)**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): ensure dialogue URLs in sitemap"
```

### ✅ Quality Gate 4

- `npm run build` succeeds; route still `●` SSG.
- `curl` of a dialogue URL shows: unique `<title>`, meta description, `og:image` (dialogue image or default), `LearningResource` + `BreadcrumbList` JSON-LD, canonical on non-www.
- Sitemap includes the dialogue URLs.

**Bar:** all metadata present and correct in raw HTML.

---

## Stage 5 — Ship + pilot-verify in Search Console

### Task 10: Merge, deploy, production smoke test

- [ ] **Step 1: Final local build**

Run: `rm -rf .next && npm run build 2>&1 | tail -8` → clean build, dialogue route `●`.

- [ ] **Step 2: Merge to main + deploy**

```bash
git checkout main && git merge --no-ff seo-dialogue-pages -m "feat(seo): public crawlable dialogue pages"
git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```

- [ ] **Step 3: Production smoke test (logged-out)**

```bash
curl -sI "https://blim.uz/uz/chinese/dialogues/hsk1/what-is-your-name" | grep -i "^HTTP"   # expect 200, NOT 307
curl -s  "https://blim.uz/uz/chinese/dialogues/hsk1/what-is-your-name" | grep -c "你好"     # teaser/vocab present in HTML (>0)
```
Expected: 200 + content present. Pick a gated 5th-line string and confirm it is ABSENT.

### ✅ Quality Gate 5 (pilot)

- Production dialogue URLs return 200 to logged-out requests with teaser + vocab in the HTML; gated lines absent; logged-in full experience intact.
- In Google Search Console, run **URL Inspection** on ~5 dialogue URLs → "URL is available to Google" / indexable (no "redirect" or "blocked" status).
- Note impressions baseline; revisit in 2–4 weeks to confirm the pages draw search impressions before investing in writing real descriptions/images for all dialogues.

**Bar:** GSC confirms the pilot URLs are indexable. Only after this do we write real `image` + `description_*` content for the full set (separate content task, no redeploy — ISR picks it up).

---

## Self-Review notes (author)

- **Spec coverage:** hero/tabs/teaser/vocab (Tasks 3–6), gating split (Tasks 6–7), new fields (Task 1), og:image (Task 8), sitemap/JSON-LD (Task 9), pilot (Task 10) — all spec sections mapped.
- **Security invariant:** gated lines never enter `buildDialoguePreview` output (Gate 1) and are grep-verified absent from public HTML (Gates 3 & 5).
- **No test suite reality:** UI verified via build + curl + `preview_*`; only pure logic is unit-tested — consistent with project practice, not a shortcut.
- **Type consistency:** `DialoguePreviewData` / `PreviewSentence` defined once in `dialoguePreview.types.ts`, imported by builder, page, and reader. `VocabItem` reused from `glossary`. `TEASER_LINES` is the single source for teaser size.
