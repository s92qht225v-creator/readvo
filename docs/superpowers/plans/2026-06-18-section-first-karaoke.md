# Section-First URLs — Karaoke Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Chinese karaoke player URL from book-first `/chinese/hsk1/karaoke/[songId]` to section-first `/chinese/karaoke/[songId]` (drop the vestigial `hsk1` — karaoke is not HSK-leveled), with 301 redirects and no change to the player or content.

**Architecture:** Move the one karaoke route folder to `/chinese/karaoke/[songId]` (which becomes the dynamic child of the existing `/chinese/karaoke` catalog tab — they coexist). Add a 301 redirect + extend the auth-gate pattern in `src/proxy.ts` so the paid player stays login-gated while the public catalog tab does not. Repoint the catalog's 8 song links. Cycle 2 of 5 (spec `docs/superpowers/specs/2026-06-18-chinese-section-first-urls-design.md`); mirrors the shipped dialogues cycle.

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl middleware, ISR (`revalidate = 3600`, `generateStaticParams`). No component test framework — verify with `npm run build` (route must stay `●`/ISR, not `ƒ`), `grep`, and production `curl`.

---

## Critical constraints

- **Pure URL move.** Player UI, audio, lyrics, metadata content — identical. Only the path drops `hsk1`.
- **`/chinese/karaoke` already exists** (the catalog tab page from the catalog-split project). The new `/chinese/karaoke/[songId]` is its dynamic child — Next.js serves the static `page.tsx` for the bare path and `[songId]/page.tsx` for a song. No collision.
- **Auth gate — karaoke is PAID content.** Today `/chinese/hsk1/karaoke/[songId]` matches `PROTECTED_PATTERN` → login-gated. After the move, `/chinese/karaoke/[songId]` must STAY gated, but the public `/chinese/karaoke` catalog tab (no song) must NOT be gated. The pattern `karaoke\/.` (karaoke + slash + ≥1 char) achieves exactly this.
- **`generateStaticParams` must prerender every song.** After build the route must be `●`/ISR, not `ƒ`.
- **Don't read `searchParams`/`getLocale()` in the page** — locale from `params`.
- **Stale dev types:** after deleting a route folder, `rm -rf .next/dev/types` before `tsc` (the `next dev` validator references the deleted file and throws phantom errors otherwise — seen in the dialogues cycle).

## Files

- **Create:** `src/app/[locale]/chinese/karaoke/[songId]/page.tsx`
- **Delete:** `src/app/[locale]/chinese/hsk1/karaoke/` (whole folder)
- **Modify:** `src/proxy.ts` (301 redirect + `PROTECTED_PATTERN`), `src/components/catalog/KaraokeCatalog.tsx` (8 song hrefs)
- **Do NOT touch:** `src/app/api/corrections/route.ts` (its `path.includes('/karaoke/')` parser still matches the new path).

---

### Task 0: Branch + baseline

**Files:** none

- [ ] **Step 1: Branch**
```bash
cd ~/ReadVo
git checkout main && git checkout -b section-first-karaoke
```

- [ ] **Step 2: Baseline**
```bash
npm run build 2>&1 | grep -E "karaoke/\[songId\]"
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/chinese/hsk1/karaoke/yueliang"
```
Expected: `● /[locale]/chinese/hsk1/karaoke/[songId]` listed; the prod curl returns `307 -> .../login` (currently gated). Note them.

---

### Task 1: Create the section-first karaoke route

**Files:**
- Create: `src/app/[locale]/chinese/karaoke/[songId]/page.tsx`
- Reference: `src/app/[locale]/chinese/hsk1/karaoke/[songId]/page.tsx` (the source — currently hardcodes `/chinese/hsk1/karaoke/` paths + `bookPath="/chinese/hsk1"`)

- [ ] **Step 1: Create the route file** with EXACTLY this content (it is the current file with every `/chinese/hsk1/karaoke/` → `/chinese/karaoke/` and `bookPath="/chinese/hsk1"` → `bookPath="/chinese"`):
```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadKaraokeSong, loadKaraokeSongs } from '@/services/karaoke';
import { KaraokePlayer } from '@/components/KaraokePlayer';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

// Static shell with hourly ISR, matching the dialogue pages.
export const revalidate = 3600;

interface PageParams {
  params: Promise<{
    locale: string;
    songId: string;
  }>;
}

export async function generateStaticParams() {
  const songs = await loadKaraokeSongs();
  return songs.map((s) => ({ songId: s.id }));
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, songId } = await params;
  const song = await loadKaraokeSong(songId);

  const titleLabel: Record<string, string> = {
    uz: 'Xitoy tili karaoke',
    ru: 'Караоке на китайском',
    en: 'Chinese Karaoke',
  };
  const fallbackTitle: Record<string, string> = {
    uz: 'Xitoy tili karaoke — KTV',
    ru: 'Караоке на китайском — KTV',
    en: 'Chinese Karaoke — KTV',
  };
  const translation = song
    ? locale === 'ru' ? song.titleTranslation_ru
    : locale === 'en' ? (song.titleTranslation_en || song.titleTranslation)
    : song.titleTranslation
    : '';
  const descMeta: Record<string, string> = {
    uz: song ? `${song.title} (${song.pinyin}) — xitoy tili karaoke (KTV). Pinyin va tarjima bilan xitoycha qo'shiq kuylang.` : 'Xitoy tili karaoke (KTV) — pinyin bilan kuylang.',
    ru: song ? `${song.title} (${song.pinyin}) — караоке на китайском (KTV). Пойте с пиньинь и переводом.` : 'Караоке на китайском языке с пиньинь.',
    en: song ? `${song.title} (${song.pinyin}) — Chinese karaoke (KTV). Sing along with pinyin and translation.` : 'Chinese karaoke (KTV) — sing along with pinyin.',
  };

  return {
    title: song
      ? `${song.title} — ${titleLabel[locale] || titleLabel.uz}`
      : fallbackTitle[locale] || fallbackTitle.uz,
    description: descMeta[locale] || descMeta.uz,
    alternates: {
      canonical: `/${locale}/chinese/karaoke/${songId}`,
      languages: {
        uz: `/uz/chinese/karaoke/${songId}`,
        ru: `/ru/chinese/karaoke/${songId}`,
        en: `/en/chinese/karaoke/${songId}`,
        'x-default': `/uz/chinese/karaoke/${songId}`,
      },
    },
  };
}

export default async function KaraokePage({ params }: PageParams) {
  const { locale, songId } = await params;
  setRequestLocale(locale);

  const song = await loadKaraokeSong(songId);

  if (!song) {
    notFound();
  }

  const karaokeLabel = 'KTV';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: karaokeLabel, path: `/${locale}/chinese/karaoke` },
      { name: song.title, path: `/${locale}/chinese/karaoke/${songId}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <KaraokePlayer
        meta={{
          id: songId,
          title: song.title,
          pinyin: song.pinyin,
          titleTranslation: song.titleTranslation,
          titleTranslation_ru: song.titleTranslation_ru,
          titleTranslation_en: song.titleTranslation_en,
        }}
        bookPath="/chinese"
      />
    </>
  );
}
```
> Before pasting, open the current `hsk1/karaoke/[songId]/page.tsx` and confirm the imports + `KaraokePlayer` `meta` prop shape match (id, title, pinyin, titleTranslation, titleTranslation_ru, titleTranslation_en). If anything differs, match the real source.

- [ ] **Step 2: Build — new route prerenders all songs** (old route still present too; fine for now)
```bash
cd ~/ReadVo && npm run build 2>&1 | grep -E "chinese/karaoke/\[songId\]"
```
Expected: `● /[locale]/chinese/karaoke/[songId]` (ISR `1h`), not `ƒ`. Confirm sample song URLs appear, e.g. `npm run build 2>&1 | grep -oE "/uz/chinese/karaoke/[a-z]+" | sort -u | head`.

- [ ] **Step 3: Commit**
```bash
git add "src/app/[locale]/chinese/karaoke/[songId]/page.tsx"
git commit -m "feat: section-first karaoke route /chinese/karaoke/[songId]"
```

---

### Task 2: Delete the old `hsk1/karaoke` folder

**Files:**
- Delete: `src/app/[locale]/chinese/hsk1/karaoke/`

- [ ] **Step 1: Delete + clear stale dev types**
```bash
cd ~/ReadVo
git rm -r "src/app/[locale]/chinese/hsk1/karaoke"
rm -rf .next/dev/types
```

- [ ] **Step 2: Build — old gone, new intact + tsc clean**
```bash
cd ~/ReadVo && npm run build 2>&1 | grep -E "karaoke" | grep "locale"
npx tsc --noEmit 2>&1 | tail -3
```
Expected: only `● /[locale]/chinese/karaoke/[songId]` (+ the `/[locale]/chinese/karaoke` catalog page) remain — NO `/[locale]/chinese/hsk1/karaoke/...`. tsc clean.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "refactor: delete old book-first karaoke route folder"
```

---

### Task 3: Add 301 redirect + extend the auth gate in `src/proxy.ts`

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Add the karaoke redirect** — insert IMMEDIATELY AFTER the existing dialogue redirect block (the `dlgReader`/`dlgList` block) and BEFORE the `// Server-side auth check` block:
```ts
  // Redirect legacy book-first karaoke URLs to section-first (301 permanent)
  const karaokeMatch = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk1\/karaoke\/(.+)$/);
  if (karaokeMatch) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${karaokeMatch[1]}/chinese/karaoke/${karaokeMatch[2]}`;
    return NextResponse.redirect(dest, 301);
  }
```

- [ ] **Step 2: Extend the auth-gate pattern.** Change:
```ts
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk)/;
```
to:
```ts
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk|karaoke\/.)/;
```
> `karaoke\/.` requires `karaoke/` + at least one character, so the paid player `/chinese/karaoke/yueliang` is gated, but the public catalog tab `/chinese/karaoke` (no trailing song) is NOT. (The auth block tests this against the locale-stripped path — confirm by reading the existing code.)

- [ ] **Step 3: Build + trace**
```bash
cd ~/ReadVo && npx tsc --noEmit 2>&1 | tail -3 && npm run build 2>&1 | tail -2
```
Expected: tsc clean; build succeeds. Then trace (write results in report):
  - `/uz/chinese/hsk1/karaoke/yueliang` → `karaokeMatch` → 301 → `/uz/chinese/karaoke/yueliang`
  - `/uz/chinese/karaoke/yueliang` → no redirect; locale-stripped `/chinese/karaoke/yueliang` matches `karaoke\/.` → uncookied → 307 `/login`
  - `/uz/chinese/karaoke` → no redirect; locale-stripped `/chinese/karaoke` does NOT match `karaoke\/.` (nothing after `karaoke`) → public ✓
  - `/uz/chinese/dialogues/hsk2/cooking-dinner` → still gated (unchanged) ✓

- [ ] **Step 4: Commit**
```bash
git add src/proxy.ts
git commit -m "feat: 301 redirect old karaoke URLs + gate new section-first karaoke player"
```

---

### Task 4: Repoint the catalog's 8 song links

**Files:**
- Modify: `src/components/catalog/KaraokeCatalog.tsx` (the `karaokeItems` array, ~lines 12-19)

- [ ] **Step 1: Replace the song hrefs** — change every `href: '/chinese/hsk1/karaoke/X'` to `href: '/chinese/karaoke/X'` in the `karaokeItems` array. There are 8 (yueliang, pengyou, tonghua, houlai, laoshuaidami, xiaopinguo, shijiezhemeda, wodeshengli). The mechanical edit is `/chinese/hsk1/karaoke/` → `/chinese/karaoke/`.

- [ ] **Step 2: Confirm none remain**
```bash
cd ~/ReadVo && grep -rn "chinese/hsk1/karaoke" src --include="*.tsx" --include="*.ts" || echo "all karaoke links repointed"
```
Expected: `all karaoke links repointed`.

- [ ] **Step 3: Build**
```bash
cd ~/ReadVo && npm run build 2>&1 | tail -2
```
Expected: succeeds.

- [ ] **Step 4: Commit**
```bash
git add src/components/catalog/KaraokeCatalog.tsx
git commit -m "refactor: repoint karaoke catalog cards to section-first URLs"
```

---

### Task 5: Verify, merge, deploy, smoke test

**Files:** none

- [ ] **Step 1: Final build checks**
```bash
cd ~/ReadVo
npm run build 2>&1 | grep -E "chinese/karaoke/\[songId\]" | grep locale     # must be ● / ISR
npm run build 2>&1 | grep -E "ƒ .*chinese/karaoke/\[songId\]" && echo "DYNAMIC LEAK" || echo "karaoke route static ✓"
git log --oneline main..HEAD | cat
```
Expected: `● /[locale]/chinese/karaoke/[songId]` (1h ISR); "karaoke route static ✓"; 4 commits.

- [ ] **Step 2: Merge + push**
```bash
git checkout main && git merge --no-ff section-first-karaoke -m "feat: section-first karaoke URLs (/chinese/karaoke/[songId])"
git push origin main
```

- [ ] **Step 3: Deploy**
```bash
ssh deploy@178.105.107.198 './deploy.sh'
```
Expected: `>> deployed`.

- [ ] **Step 4: Production smoke test** — karaoke is PAID, so the player is login-gated (uncookied → 307); the redirect fires before the gate so the old URL 301s first.
```bash
# Old player URL → 301 → new
curl -s -o /dev/null -w "old     %{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/chinese/hsk1/karaoke/yueliang"
# New player URL, uncookied → 307 → /login  (route exists + still gated)
curl -s -o /dev/null -w "new     %{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/chinese/karaoke/yueliang"
# Catalog tab → 200 (public)
curl -s -o /dev/null -w "catalog %{http_code}\n" "https://blim.uz/uz/chinese/karaoke"
```
Expected:
- `old     301 -> https://blim.uz/uz/chinese/karaoke/yueliang`
- `new     307 -> https://blim.uz/uz/login`
- `catalog 200`

> **If `new` returns 200 (not 307), the paid player leaked — fix `PROTECTED_PATTERN` (Task 3 Step 2) and redeploy. If `catalog` returns 307 (not 200), the gate over-matched the public tab — same fix.** Content-render proof is the build prerender (Task 1 Step 2); the gated HTML can't be fetched anonymously.

- [ ] **Step 5: Manual logged-in check (you)** — log in, open `/uz/chinese/karaoke`, click a song → lands on `/uz/chinese/karaoke/{id}` and the player works (audio, synced lyrics, back button to the catalog). Old bookmark `/uz/chinese/hsk1/karaoke/yueliang` → redirects to the new URL.

---

## Notes for the implementer

- **No unit tests.** Verify with `npm run build` + `grep` + production `curl`.
- **The new page is the current karaoke page with two find-replaces:** `/chinese/hsk1/karaoke/` → `/chinese/karaoke/` (3 metadata sites + 1 breadcrumb) and `bookPath="/chinese/hsk1"` → `bookPath="/chinese"`. Nothing else changes.
- **Auth gate is the highest-risk item.** Step 4's `new 307` is the gate proof; `catalog 200` proves the public tab isn't over-gated. Both must hold before shipping.
- **Cycle 2 of 5.** Grammar, flashcards, writing follow, each extending `PROTECTED_PATTERN` + adding a redirect the same way.
