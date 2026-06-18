# Section-First URLs — Dialogues Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Chinese dialogue reader URLs from book-first `/chinese/hsk{1-6}/dialogues/[dialogueId]` to section-first `/chinese/dialogues/hsk{N}/[dialogueId]`, with 301 redirects from the old URLs and no change to reader behaviour or content.

**Architecture:** Collapse the 6 per-level dialogue route folders into ONE route `/chinese/dialogues/[level]/[dialogueId]` driven by a `[level]` segment (`hsk1`–`hsk6`). Add 301 redirect patterns + extend the auth-gate pattern in `src/proxy.ts`. Repoint the one internal reader link (the catalog card). This is the first of five content-type cycles (see spec `docs/superpowers/specs/2026-06-18-chinese-section-first-urls-design.md`).

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl middleware, statically rendered (ISR `revalidate = 3600`, `generateStaticParams`). No component test framework — verification is `npm run build` (route must stay `●` SSG/ISR, not `ƒ`), `grep`, and production `curl`, matching established practice.

---

## Critical constraints

- **Pure URL move.** Reader UI, audio, glossary, metadata content — all identical. Only the path shape changes.
- **`generateStaticParams` must still prerender every dialogue across all 6 levels** (today each per-level page prerenders its own slugs; the merged page must produce `{level, dialogueId}` for all of them). After build, the route must be `●`/ISR, not `ƒ`.
- **Auth gate.** `src/proxy.ts` `PROTECTED_PATTERN = /^\/chinese\/hsk/` currently login-gates every `/chinese/hsk{N}/dialogues/...` reader page. After the move, dialogue readers live at `/chinese/dialogues/hsk{N}/...` which does NOT match → they'd become reachable logged-out. The pattern MUST be extended to also gate `/chinese/dialogues/hsk`. (The remaining `/chinese/hsk*` types are still gated by the same pattern until their own cycles.)
- **Don't read `searchParams`/`getLocale()` in the page** — locale from `params` (the route is statically rendered).
- **One reader link to repoint:** `src/components/catalog/DialoguesCatalog.tsx` line ~187 (`href={\`/chinese/hsk${dialogueHskLevel}/dialogues/${d.slug}\`}`). The footer/nav link only to `/chinese` (catalog); `jsonLd.ts` references only grammar paths — neither changes this cycle.
- **Sitemap:** dialogue content is NOT individually listed in `src/app/sitemap.ts` (only `/chinese` + catalog tabs + blog). No sitemap change this cycle — confirm, don't add.

## Files

- **Create:** `src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx` (merged reader route)
- **Delete:** `src/app/[locale]/chinese/hsk1/dialogues/` (the `[dialogueId]` page AND the vestigial list `page.tsx`), `src/app/[locale]/chinese/hsk2/dialogues/`, `hsk3/dialogues/`, `hsk4/dialogues/`, `hsk5/dialogues/`, `hsk6/dialogues/`
- **Modify:** `src/proxy.ts` (301 redirects + `PROTECTED_PATTERN`), `src/components/catalog/DialoguesCatalog.tsx` (card href)

---

### Task 0: Branch + baseline

**Files:** none

- [ ] **Step 1: Branch**
```bash
cd ~/ReadVo
git checkout main && git pull --ff-only 2>/dev/null; git checkout -b section-first-dialogues
```

- [ ] **Step 2: Baseline — current dialogue routes + a sample prod URL**
```bash
npm run build 2>&1 | grep -E "dialogues/\[dialogueId\]" | tee /tmp/dlg-baseline.txt
curl -s -o /dev/null -w "%{http_code}\n" "https://blim.uz/uz/chinese/hsk2/dialogues/cooking-dinner"
```
Expected: 6 `/[locale]/chinese/hsk{N}/dialogues/[dialogueId]` routes listed as `●`; the curl returns `200` or `307` (gated). Note them.

---

### Task 1: Create the merged `/chinese/dialogues/[level]/[dialogueId]` route

**Files:**
- Create: `src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx`
- Reference: `src/app/[locale]/chinese/hsk2/dialogues/[dialogueId]/page.tsx` (the template — currently hardcodes `hsk2`/`HSK 2`/`dialhsk=2`)

- [ ] **Step 1: Create the route file** — identical to the hsk2 template but parameterized by `level` (the `[level]` value is `hsk1`–`hsk6`; the numeric label is `level.replace('hsk','')`):
```tsx
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getDialogue, loadDialoguesForBook } from '@/services';
import { DialogueReader } from '@/components/DialogueReader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';
import { stripPinyinTones } from '@/utils/rubyText';

export const revalidate = 3600; // hourly ISR refresh (glossary edits also revalidate via tag)

const LEVELS = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
const VALID_LEVELS = new Set(LEVELS);

interface PageParams {
  params: Promise<{ locale: string; level: string; dialogueId: string }>;
}

export async function generateStaticParams() {
  const out: { level: string; dialogueId: string }[] = [];
  for (const level of LEVELS) {
    const dialogues = await loadDialoguesForBook(level);
    for (const d of dialogues) out.push({ level, dialogueId: d.slug });
  }
  return out;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, level, dialogueId } = await params;
  if (!VALID_LEVELS.has(level)) return {};
  const num = level.replace('hsk', '');
  const dialogue = await getDialogue(level, dialogueId);

  const translation = dialogue
    ? locale === 'ru' ? dialogue.titleTranslation_ru
    : locale === 'en' ? (dialogue.titleTranslation_en || dialogue.titleTranslation)
    : dialogue.titleTranslation
    : '';
  const hanzi = dialogue ? dialogue.title.replace(/[？！。，、；：""''（）…—]+/g, '') : '';
  const flatPinyin = dialogue ? stripPinyinTones(dialogue.pinyin) : '';
  const dialogueLabel = ({ uz: 'Xitoy tili dialogi', ru: 'Диалог китайского языка', en: 'Chinese Dialogue' } as Record<string, string>)[locale] || 'Chinese Dialogue';

  return {
    title: dialogue
      ? `${hanzi} ${flatPinyin} — "${translation}" ${dialogueLabel} | HSK ${num}`
      : ({ uz: `HSK ${num} xitoy tili dialogi`, ru: `Диалог HSK ${num} китайского языка`, en: `HSK ${num} Chinese Dialogue` } as Record<string, string>)[locale] || `HSK ${num} xitoy tili dialogi`,
    description: dialogue
      ? ({
          uz: `HSK ${num} xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}. Pinyin va tarjima bilan o'qing.`,
          ru: `Диалог китайского языка HSK ${num}: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation_ru}. Читайте с пиньинь и переводом.`,
          en: `HSK ${num} Chinese dialogue: ${dialogue.title} (${dialogue.pinyin}) — ${translation}. Read with pinyin and translation.`,
        } as Record<string, string>)[locale] || `HSK ${num} xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}.`
      : ({ uz: `HSK ${num} xitoy tili dialoglari — pinyin va tarjima bilan.`, ru: `Диалоги HSK ${num} с пиньинь и переводом.`, en: `HSK ${num} Chinese dialogues with pinyin and translation.` } as Record<string, string>)[locale] || `HSK ${num} xitoy tili dialoglari — pinyin va tarjima bilan.`,
    alternates: dialogue ? {
      canonical: `/${locale}/chinese/dialogues/${level}/${dialogueId}`,
      languages: {
        uz: `/uz/chinese/dialogues/${level}/${dialogueId}`,
        ru: `/ru/chinese/dialogues/${level}/${dialogueId}`,
        en: `/en/chinese/dialogues/${level}/${dialogueId}`,
        'x-default': `/uz/chinese/dialogues/${level}/${dialogueId}`,
      },
    } : undefined,
  };
}

export default async function DialoguePage({ params }: PageParams) {
  const { locale, level, dialogueId } = await params;
  setRequestLocale(locale);
  if (!VALID_LEVELS.has(level)) notFound();
  const num = level.replace('hsk', '');

  const raw = await getDialogue(level, dialogueId);
  if (!raw) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';
  const translation = locale === 'ru' ? raw.titleTranslation_ru
    : locale === 'en' ? (raw.titleTranslation_en || raw.titleTranslation)
    : raw.titleTranslation;
  const dialoguesLabel = ({ uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' } as Record<string, string>)[locale] || 'Dialogues';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: dialoguesLabel, path: `/${locale}/chinese?dialhsk=${num}` },
      { name: `${raw.title} — ${translation}`, path: `/${locale}/chinese/dialogues/${level}/${dialogueId}` },
    ]),
    {
      '@type': 'LearningResource',
      name: `${raw.title} (${raw.pinyin}) — ${translation}`,
      description: `HSK ${num} Chinese dialogue: ${raw.title} — ${translation}`,
      educationalLevel: `HSK ${num}`,
      learningResourceType: 'Dialogue',
      inLanguage: 'zh',
      url: `${siteUrl}/${locale}/chinese/dialogues/${level}/${dialogueId}`,
      provider: { '@type': 'Organization', name: 'Blim' },
    },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
        listPath={`/chinese?dialhsk=${num}`}
      />
    </>
  );
}
```
> `getDialogue(level, …)` and `loadDialoguesForBook(level)` take the book id as their first arg; `level` (`hsk1`..`hsk6`) IS the book id, so passing it directly is correct (the old pages passed the literal `'hsk2'`). `DialogueReader` uses `listPath` for its back button (`listPath || \`${bookPath}/dialogues\``), so `listPath` being set means `bookPath` is navigationally inert — kept as `/chinese/${level}` to preserve the prop's value.

- [ ] **Step 2: Build — new route prerenders all 6 levels** (old routes still present too; that's fine for now)
```bash
cd ~/ReadVo && npm run build 2>&1 | grep -E "chinese/dialogues/\[level\]/\[dialogueId\]"
```
Expected: `● /[locale]/chinese/dialogues/[level]/[dialogueId]` (ISR `1h`), not `ƒ`.

- [ ] **Step 3: Confirm the prerendered count covers all levels** (the build prints sample paths; confirm at least one hsk2 + one hsk6 dialogue appears under the new route)
```bash
cd ~/ReadVo && npm run build 2>&1 | grep -oE "/uz/chinese/dialogues/hsk[0-9]/[a-z-]+" | sort -u | head
```
Expected: new-form URLs for multiple levels (e.g. `/uz/chinese/dialogues/hsk1/ramadan`, `/uz/chinese/dialogues/hsk2/cooking-dinner`).

- [ ] **Step 4: Commit**
```bash
git add "src/app/[locale]/chinese/dialogues/[level]/[dialogueId]/page.tsx"
git commit -m "feat: merged section-first dialogue route /chinese/dialogues/[level]/[dialogueId]"
```

---

### Task 2: Delete the 6 old per-level dialogue folders

**Files:**
- Delete: `src/app/[locale]/chinese/hsk{1,2,3,4,5,6}/dialogues/` (each whole folder, including hsk1's vestigial list `page.tsx`)

- [ ] **Step 1: Confirm what's being removed**
```bash
cd ~/ReadVo && find "src/app/[locale]/chinese" -path "*hsk*/dialogues*" -name "page.tsx"
```
Expected: 7 files (6 `[dialogueId]` pages + the hsk1 list page).

- [ ] **Step 2: Delete the folders**
```bash
cd ~/ReadVo
git rm -r "src/app/[locale]/chinese/hsk1/dialogues" "src/app/[locale]/chinese/hsk2/dialogues" "src/app/[locale]/chinese/hsk3/dialogues" "src/app/[locale]/chinese/hsk4/dialogues" "src/app/[locale]/chinese/hsk5/dialogues" "src/app/[locale]/chinese/hsk6/dialogues"
```

- [ ] **Step 3: Build — old routes gone, new route intact**
```bash
cd ~/ReadVo && npm run build 2>&1 | grep -E "dialogues" | grep -E "locale"
```
Expected: NO `/[locale]/chinese/hsk{N}/dialogues/...` routes remain; the `/[locale]/chinese/dialogues/[level]/[dialogueId]` route is present and `●`. Build succeeds.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "refactor: delete old book-first dialogue route folders"
```

---

### Task 3: Add 301 redirects + extend the auth gate in `src/proxy.ts`

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Add the dialogue redirects** — insert immediately AFTER the existing `?tab=` redirect block and BEFORE the `// Server-side auth check` block. (The old reader URL → new; the old bare list URL → `/chinese`.)
```ts
  // Redirect legacy book-first dialogue URLs to section-first (301 permanent)
  const dlgReader = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk(\d)\/dialogues\/(.+)$/);
  if (dlgReader) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${dlgReader[1]}/chinese/dialogues/hsk${dlgReader[2]}/${dlgReader[3]}`;
    return NextResponse.redirect(dest, 301);
  }
  const dlgList = pathname.match(/^\/(uz|ru|en)\/chinese\/hsk\d\/dialogues\/?$/);
  if (dlgList) {
    const dest = request.nextUrl.clone();
    dest.pathname = `/${dlgList[1]}/chinese`;
    return NextResponse.redirect(dest, 301);
  }
```

- [ ] **Step 2: Extend the auth-gate pattern** so the moved dialogue readers stay login-gated. Change the line:
```ts
const PROTECTED_PATTERN = /^\/chinese\/hsk/;
```
to:
```ts
const PROTECTED_PATTERN = /^\/chinese\/(hsk|dialogues\/hsk)/;
```
> This keeps gating the still-book-first types (`/chinese/hsk*` flashcards/karaoke/grammar/writing) AND now gates the moved dialogue readers (`/chinese/dialogues/hsk{N}/…`). The catalog (`/chinese`, public) is unaffected (no `dialogues/hsk` segment).

- [ ] **Step 3: Build**
```bash
cd ~/ReadVo && npx tsc --noEmit 2>&1 | tail -3 && npm run build 2>&1 | tail -2
```
Expected: tsc clean; build succeeds (`ƒ Proxy (Middleware)` listed).

- [ ] **Step 4: Trace the redirect logic** (write each out in the commit/verification notes):
  - `/uz/chinese/hsk2/dialogues/cooking-dinner` → `dlgReader` → `/uz/chinese/dialogues/hsk2/cooking-dinner` (301)
  - `/ru/chinese/hsk6/dialogues/talking-about-weather` → `/ru/chinese/dialogues/hsk6/talking-about-weather` (301)
  - `/uz/chinese/hsk1/dialogues` → `dlgList` → `/uz/chinese` (301)
  - `/uz/chinese/dialogues/hsk2/cooking-dinner` → NOT matched (no `hsk\d/dialogues`), passes to auth gate → gated (login if logged-out)

- [ ] **Step 5: Commit**
```bash
git add src/proxy.ts
git commit -m "feat: 301 redirect old dialogue URLs + gate new section-first dialogue paths"
```

---

### Task 4: Repoint the catalog's dialogue card link

**Files:**
- Modify: `src/components/catalog/DialoguesCatalog.tsx` (~line 187)

- [ ] **Step 1: Update the card href**
```tsx
// FROM:
<Link key={d.id} href={`/chinese/hsk${dialogueHskLevel}/dialogues/${d.slug}`} prefetch={false} className="dialogue-card">
// TO:
<Link key={d.id} href={`/chinese/dialogues/hsk${dialogueHskLevel}/${d.slug}`} prefetch={false} className="dialogue-card">
```

- [ ] **Step 2: Confirm no other internal link points at the old dialogue path**
```bash
cd ~/ReadVo && grep -rn "chinese/hsk[0-9]*/dialogues\|/dialogues/" src --include="*.tsx" --include="*.ts" | grep -v "dialogues/\[level\]" | grep -v "loadDialoguesForBook\|getDialogue\|content/dialogues"
```
Expected: no remaining `href`/link to `/chinese/hsk{N}/dialogues/...` (only data-loading calls + the new route may appear). If any other link is found, repoint it to `/chinese/dialogues/hsk{N}/...`.

- [ ] **Step 3: Build**
```bash
cd ~/ReadVo && npm run build 2>&1 | tail -2
```
Expected: build succeeds.

- [ ] **Step 4: Commit**
```bash
git add src/components/catalog/DialoguesCatalog.tsx
git commit -m "refactor: repoint dialogue catalog cards to section-first URLs"
```

---

### Task 5: Verify, merge, deploy, production smoke test

**Files:** none

- [ ] **Step 1: Final build checks**
```bash
cd ~/ReadVo
npm run build 2>&1 | grep -E "chinese/dialogues/\[level\]" | grep -E "locale"   # must be ● / ISR
npm run build 2>&1 | grep -E "ƒ .*chinese/dialogues" && echo "DYNAMIC LEAK" || echo "dialogues route static ✓"
git log --oneline main..HEAD | cat
```
Expected: `● /[locale]/chinese/dialogues/[level]/[dialogueId]` (1h ISR); "dialogues route static ✓"; 4 commits.

- [ ] **Step 2: Merge to main + push**
```bash
git checkout main && git merge --no-ff section-first-dialogues -m "feat: section-first dialogue URLs (/chinese/dialogues/hsk{N}/[slug])"
git push origin main
```

- [ ] **Step 3: Deploy**
```bash
ssh deploy@178.105.107.198 './deploy.sh'
```
Expected: `>> deployed`.

- [ ] **Step 4: Production smoke test** — dialogue readers are middleware login-gated, so an uncookied `curl` of a reader URL returns `307 → /login` (NOT 200; the HTML is not public). The redirect block runs BEFORE the gate, so an OLD reader URL first 301s to the new URL.
```bash
# Old reader URL → 301 → new URL (redirect fires before the gate)
curl -s -o /dev/null -w "old  %{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/chinese/hsk2/dialogues/cooking-dinner"
# Old bare list → 301 → /chinese
curl -s -o /dev/null -w "list %{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/chinese/hsk1/dialogues"
# New reader URL, uncookied → 307 → /login  (proves the route exists AND is still login-gated)
curl -s -o /dev/null -w "new  %{http_code} -> %{redirect_url}\n" "https://blim.uz/uz/chinese/dialogues/hsk2/cooking-dinner"
```
Expected:
- `old  301 -> https://blim.uz/uz/chinese/dialogues/hsk2/cooking-dinner`
- `list 301 -> https://blim.uz/uz/chinese`
- `new  307 -> https://blim.uz/uz/login`

> **If `new` returns 200 instead of `307 -> /login`, the auth gate did NOT pick up the moved path — paid content leaked. Fix `PROTECTED_PATTERN` (Task 3 Step 2) and redeploy before considering the cycle done.** Content-render proof is the build prerender (Task 1 Step 3 listed the new-form slugs) — the gated HTML can't be fetched anonymously.

- [ ] **Step 5: Manual logged-in check (you, in a browser)** — log in, open `https://blim.uz/uz/chinese`, click a dialogue card → confirm it lands on `/uz/chinese/dialogues/hsk{N}/{slug}` and the reader works (audio, words tab, back button returns to the catalog). Open an old bookmark `/uz/chinese/hsk2/dialogues/cooking-dinner` → confirm it redirects to the new URL and renders.

---

## Notes for the implementer

- **No unit tests in this repo.** Verify with `npm run build` + `grep` + production `curl`.
- **The merged page is a faithful copy** of the hsk2 template with `hsk2`/`HSK 2`/`dialhsk=2` replaced by `${level}`/`HSK ${num}`/`dialhsk=${num}`. Don't change reader behaviour.
- **If the build flips the route to `ƒ`:** you read `searchParams`/`getLocale()` somewhere, or `generateStaticParams` threw — fix so it stays `●`.
- **Auth-gate is the highest-risk item.** The Step 5 trace is the gate's proof. An uncookied request to `/chinese/dialogues/hsk2/...` MUST 307 to `/login`. If it returns 200, paid content leaked — fix the pattern.
- **This is cycle 1 of 5.** Karaoke, grammar, flashcards, writing follow in their own plans, each extending `PROTECTED_PATTERN` and adding redirect patterns the same way.
