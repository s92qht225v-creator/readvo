# Chinese Catalog → Per-Tab Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single `/chinese` catalog (one 1,028-line `LanguagePage.tsx` with 5 in-page tabs) into real per-tab routes — `/chinese` = Dialogues, plus `/chinese/{writing,flashcards,karaoke,grammar}` — so each section is independently shareable and indexable, with zero visual/behaviour change.

**Architecture:** Clean extraction. A shared `CatalogHeader` (hero + tab bar as `<Link>`s) plus five self-contained `*Catalog` client components, each owning only its own state. A shared `catalogData.ts` provides server-side loaders so each route's `page.tsx` loads only its tab's data. Old `?tab=` links are repointed in-repo and redirected in middleware for external bookmarks. Then `LanguagePage.tsx` is deleted.

**Tech Stack:** Next.js 16 App Router, TypeScript, next-intl (`@/i18n/navigation`), statically rendered (ISR `revalidate = 3600`). No component test framework — verification is `npm run build` (must stay `●`/ISR, not `ƒ`), `grep`, and manual click-through, matching the project's established practice.

---

## Critical constraints (read before any task)

- **Never read `searchParams` or call `getLocale()` in a `page.tsx` or `generateMetadata`.** It forces the route dynamic (`ƒ`) and breaks static caching. Locale comes from `params`. This is why the `?tab=` backward-compat redirect lives in **middleware**, not the page.
- **Pure refactor.** Copy each tab's JSX + state verbatim into its new component; do not rewrite logic. Same markup, same class names, same behaviour.
- **Grammar is not a tab-bar button.** The tab bar shows 4 buttons (dialogues, writing, flashcards, karaoke); grammar is reached via `BannerMenu` and footer links. `/chinese/grammar` is still a real route — `CatalogHeader` just renders with no highlighted tab for it (unchanged from today, where grammar content shows with no tab highlighted).
- **`LanguagePage.tsx` current props** (the data the page wrapper passes) — preserved per-tab:
  ```ts
  dialogues, dialoguesHsk2..6: DialogueInfo[]
  flashcardLessons: FlashcardLesson[]
  writingSets, writingSetsHsk2, writingSetsHsk2L2, writingSetsHsk3, writingSetsHsk4, writingSetsHsk5, writingSetsHsk6: WritingSetMeta[]
  ```
- **Shared types** to relocate (currently defined inside `LanguagePage.tsx`): `FlashcardLesson`, `WritingSetMeta`, `HskLevel`, `parseHskLevel()`, `Tab`, `tabs`, `TAB_ICONS`, `TAGS`, `BOOKMARK_KEY`, `validTabs`, `grammarItems`.

## File structure (target)

```
src/components/catalog/
  types.ts                 # Tab, HskLevel, parseHskLevel, FlashcardLesson, WritingSetMeta, TAGS, BOOKMARK_KEY
  CatalogHeader.tsx        # 'use client' — hero + tab bar (<Link>s), tabs[], TAB_ICONS, validTabs; props { currentTab, hskLevel? }
  DialoguesCatalog.tsx     # 'use client' — dialogues content + state + <CatalogHeader currentTab="dialogues" …>
  WritingCatalog.tsx       # 'use client'
  FlashcardsCatalog.tsx    # 'use client'
  KaraokeCatalog.tsx       # 'use client'
  GrammarCatalog.tsx       # 'use client' — includes grammarItems
src/services/catalogData.ts # server: tonelessPinyin, loadDialoguesAll(), loadFlashcardCatalog(), loadWritingCatalog()
src/app/[locale]/chinese/
  page.tsx                 # Dialogues (rewired)
  writing/page.tsx         # new
  flashcards/page.tsx      # new
  karaoke/page.tsx         # new
  grammar/page.tsx         # new
src/proxy.ts               # +?tab= redirect
src/app/sitemap.ts         # +4 routes
```
Deleted at the end: `src/components/LanguagePage.tsx`.

---

### Task 0: Safety branch + baseline snapshot

**Files:** none (git + build only)

- [ ] **Step 1: Branch off main**
```bash
cd ~/ReadVo
git checkout -b chinese-catalog-routes
```

- [ ] **Step 2: Capture the baseline route table** (so we can prove no route went dynamic later)
```bash
npm run build 2>&1 | grep -E "chinese|Route|●|ƒ|○" | tee /tmp/blim-baseline-routes.txt
```
Expected: build succeeds; `/chinese` listed. Save the output for comparison.

- [ ] **Step 3: Commit the empty branch marker** (none needed — proceed)

---

### Task 1: Shared types module

**Files:**
- Create: `src/components/catalog/types.ts`

- [ ] **Step 1: Create the types module** — move the shared declarations out of `LanguagePage.tsx` verbatim (copy the exact current bodies of `TAGS`, `BOOKMARK_KEY`, `FlashcardLesson` interface, `WritingSetMeta` interface, `HskLevel`, `parseHskLevel`).
```ts
// src/components/catalog/types.ts
export type Tab = 'dialogues' | 'writing' | 'flashcards' | 'karaoke' | 'grammar';
export type HskLevel = '1' | '2' | '3' | '4' | '5' | '6';

export const BOOKMARK_KEY = 'blim-dialogue-bookmarks';

export const TAGS: Record<string, { uz: string; ru: string; en: string }> = {
  tanishuv: { uz: 'Tanishuv', ru: 'Знакомство', en: 'Introductions' },
  kundalik: { uz: 'Kundalik', ru: 'Повседневное', en: 'Daily Life' },
  xaridlar: { uz: 'Xaridlar', ru: 'Покупки', en: 'Shopping' },
  ovqat: { uz: 'Ovqat', ru: 'Еда', en: 'Food' },
  salomatlik: { uz: 'Salomatlik', ru: 'Здоровье', en: 'Health' },
  transport: { uz: 'Transport', ru: 'Транспорт', en: 'Transport' },
  telefon: { uz: 'Telefon', ru: 'Телефон', en: 'Phone' },
  ish: { uz: 'Ish/O\'qish', ru: 'Работа/Учёба', en: 'Work/Study' },
  reja: { uz: 'Reja', ru: 'Планы', en: 'Plans' },
  muloqot: { uz: 'Muloqot', ru: 'Общение', en: 'Communication' },
  'ob-havo': { uz: 'Ob-havo', ru: 'Погода', en: 'Weather' },
  texnologiya: { uz: 'Texnologiya', ru: 'Технологии', en: 'Technology' },
};

export function parseHskLevel(raw: string | null | undefined, max = 6): HskLevel {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= max) return String(n) as HskLevel;
  return '1';
}

export interface FlashcardLesson {
  lessonId: string;
  lessonNumber: number;
  wordCount: number;
  title?: string;
  title_ru?: string;
  sampleChar?: string;
  sampleUz?: string;
  sampleRu?: string;
  sampleEn?: string;
}

export interface WritingSetMeta {
  id: string;
  title: string;
  title_ru: string;
  subtitle: string;
  subtitle_ru: string;
  chars: string;
  pinyin?: string;
  wordCount?: number;
  sampleChar?: string;
  sampleUz?: string;
  sampleRu?: string;
  sampleEn?: string;
}
```
> Verify the copied `FlashcardLesson` / `WritingSetMeta` bodies match `LanguagePage.tsx` exactly (read lines ~285–360 of the current file and diff field-by-field).

- [ ] **Step 2: Typecheck**
```bash
npx tsc --noEmit 2>&1 | grep "catalog/types" || echo "types.ts clean"
```
Expected: `types.ts clean`.

- [ ] **Step 3: Commit**
```bash
git add src/components/catalog/types.ts
git commit -m "refactor: extract shared catalog types"
```

---

### Task 2: Shared server data loaders

**Files:**
- Create: `src/services/catalogData.ts`
- Reference: `src/app/[locale]/chinese/page.tsx` (current loader + transforms to move)

- [ ] **Step 1: Create the loader module** — move `tonelessPinyin` and the three data shapes (dialogues, flashcard-lesson mapping, writing-set mapping) out of the current `page.tsx`. Each loader returns exactly the props the current page builds, so callers stay simple.
```ts
// src/services/catalogData.ts
import { loadDialoguesForBook, type DialogueInfo } from '@/services/dialogues';
import { loadFlashcardDeck } from '@/services/flashcards';
import { getLessonsWithInfo } from '@/services/content';
import {
  WRITING_SETS, WRITING_SETS_HSK2, WRITING_SETS_HSK2_L2, WRITING_SETS_HSK3,
  WRITING_SETS_HSK4, WRITING_SETS_HSK5, WRITING_SETS_HSK6,
} from '@/services/writing';
import type { FlashcardLesson, WritingSetMeta } from '@/components/catalog/types';

/** Toneless, space-joined pinyin for a writing set's words (NFD-strip tone marks). */
export const tonelessPinyin = (words: { pinyin: string }[] = []): string =>
  words
    .map((w) => (w.pinyin || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())
    .join(' ');

export async function loadDialoguesAll(): Promise<{
  dialogues: DialogueInfo[]; dialoguesHsk2: DialogueInfo[]; dialoguesHsk3: DialogueInfo[];
  dialoguesHsk4: DialogueInfo[]; dialoguesHsk5: DialogueInfo[]; dialoguesHsk6: DialogueInfo[];
}> {
  const [dialogues, dialoguesHsk2, dialoguesHsk3, dialoguesHsk4, dialoguesHsk5, dialoguesHsk6] =
    await Promise.all([
      loadDialoguesForBook('hsk1'), loadDialoguesForBook('hsk2'), loadDialoguesForBook('hsk3'),
      loadDialoguesForBook('hsk4'), loadDialoguesForBook('hsk5'), loadDialoguesForBook('hsk6'),
    ]);
  return { dialogues, dialoguesHsk2, dialoguesHsk3, dialoguesHsk4, dialoguesHsk5, dialoguesHsk6 };
}

export async function loadFlashcardCatalog(): Promise<FlashcardLesson[]> {
  const [deck, lessonInfos] = await Promise.all([loadFlashcardDeck('hsk1'), getLessonsWithInfo()]);
  if (!deck) return [];
  return Array.from(new Set(deck.words.map((w) => w.lesson).filter(Boolean)))
    .sort((a, b) => (a as number) - (b as number))
    .map((lessonNum) => {
      const info = lessonInfos.find((l) => l.lessonNumber === lessonNum);
      const wordsInLesson = deck.words.filter((w) => w.lesson === lessonNum);
      const sample = wordsInLesson[0];
      return {
        lessonId: String(lessonNum),
        lessonNumber: lessonNum as number,
        wordCount: wordsInLesson.length,
        title: info?.title,
        title_ru: info?.titleTranslation_ru,
        sampleChar: sample?.text_original,
        sampleUz: sample?.text_translation,
        sampleRu: sample?.text_translation_ru,
        sampleEn: sample?.text_translation_en,
      };
    });
}

/** Maps a writing-set array to its meta. `withSamples` mirrors the current page:
 *  HSK1 / HSK2-L2 / HSK3 build sample fields; the others (hsk2 L1, 4, 5, 6) don't. */
function mapWriting(sets: typeof WRITING_SETS, locale: string, withSamples: boolean): WritingSetMeta[] {
  const key = locale === 'ru' ? 'ru' : locale === 'en' ? 'en' : 'uz';
  return sets.map(({ id, title, title_ru, subtitle, subtitle_ru, chars, words }) => {
    const base = { id, title, title_ru, subtitle, subtitle_ru, chars, pinyin: tonelessPinyin(words) };
    if (!withSamples) return base;
    const short = [...words].sort((a, b) => a[key].length - b[key].length)[0];
    return { ...base, wordCount: words.length, sampleChar: short?.char, sampleUz: short?.uz, sampleRu: short?.ru, sampleEn: short?.en };
  });
}

export function loadWritingCatalog(locale: string): {
  writingSets: WritingSetMeta[]; writingSetsHsk2: WritingSetMeta[]; writingSetsHsk2L2: WritingSetMeta[];
  writingSetsHsk3: WritingSetMeta[]; writingSetsHsk4: WritingSetMeta[]; writingSetsHsk5: WritingSetMeta[]; writingSetsHsk6: WritingSetMeta[];
} {
  return {
    writingSets: mapWriting(WRITING_SETS, locale, true),
    writingSetsHsk2: mapWriting(WRITING_SETS_HSK2, locale, false),
    writingSetsHsk2L2: mapWriting(WRITING_SETS_HSK2_L2, locale, true),
    writingSetsHsk3: mapWriting(WRITING_SETS_HSK3, locale, true),
    writingSetsHsk4: mapWriting(WRITING_SETS_HSK4, locale, false),
    writingSetsHsk5: mapWriting(WRITING_SETS_HSK5, locale, false),
    writingSetsHsk6: mapWriting(WRITING_SETS_HSK6, locale, false),
  };
}
```
> Before writing, open the current `page.tsx` and confirm `WRITING_SETS` (hsk1), `WRITING_SETS_HSK2_L2`, and `WRITING_SETS_HSK3` are the three mapped *with* sample fields, and hsk2 L1 / hsk4 / hsk5 / hsk6 *without*. Match `withSamples` to that exactly. If the current mapping differs, fix `mapWriting` calls to match it — behaviour must be identical.

- [ ] **Step 2: Typecheck**
```bash
npx tsc --noEmit 2>&1 | grep "catalogData" || echo "catalogData clean"
```
Expected: `catalogData clean`.

- [ ] **Step 3: Commit**
```bash
git add src/services/catalogData.ts
git commit -m "refactor: extract shared catalog data loaders"
```

---

### Task 3: CatalogHeader component

**Files:**
- Create: `src/components/catalog/CatalogHeader.tsx`
- Reference: `LanguagePage.tsx` lines ~480–558 (hero + tab nav) and the `tabs`/`TAB_ICONS`/`validTabs` consts (~36–115).

- [ ] **Step 1: Create the header** — move the hero `<header>` and the `<nav className="lp__tabs">` block verbatim, with these mechanical edits:
  1. The component takes `{ currentTab, hskLevel }` instead of reading `activeTab` state.
  2. Each tab becomes a `<Link href={hrefFor(tab.id)}>` instead of `<button onClick={setActiveTab}>`, with `lp__tab--active` when `tab.id === currentTab`.
  3. All hero conditionals that were `activeTab === 'x'` become `currentTab === 'x'`; the hero HSK number uses the `hskLevel` prop (fallback `'1'`).
```tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '../../hooks/useLanguage';
import { BannerMenu } from '../BannerMenu';
import type { Tab } from './types';

const tabs: { id: Tab; label: string; label_ru?: string; label_en?: string }[] = [
  { id: 'dialogues', label: 'Dialog', label_ru: 'Диалог', label_en: 'Dialogues' },
  { id: 'writing', label: 'Yozish', label_ru: 'Письмо', label_en: 'Writing' },
  { id: 'flashcards', label: 'Fleshkarta', label_ru: 'Флешкарты', label_en: 'Flashcards' },
  { id: 'karaoke', label: 'KTV' },
];

const TAB_ICONS: Record<string, React.ReactNode> = {
  /* COPY VERBATIM the four <svg> entries (dialogues, writing, flashcards, karaoke)
     from LanguagePage.tsx — do not redraw them. */
};

/** Each tab's own route. Dialogues is the /chinese landing (no suffix). */
function hrefFor(id: Tab): string {
  return id === 'dialogues' ? '/chinese' : `/chinese/${id}`;
}

export function CatalogHeader({ currentTab, hskLevel = '1' }: { currentTab: Tab; hskLevel?: string }) {
  const [language] = useLanguage();
  return (
    <>
      {/* COPY VERBATIM the <header className="home__hero home__hero--lang"> block
          from LanguagePage.tsx (~lines 482–533), replacing every `activeTab` with
          `currentTab` and the hero HSK number expression with `{hskLevel}`. */}
      <nav className="lp__tabs">
        <div className="lp__tabs-inner">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={hrefFor(tab.id)}
              className={`lp__tab ${currentTab === tab.id ? 'lp__tab--active' : ''}`}
              aria-current={currentTab === tab.id ? 'page' : undefined}
              aria-label={language === 'en' && tab.label_en ? tab.label_en : language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}
            >
              <span className="lp__tab-icon" aria-hidden="true">{TAB_ICONS[tab.id]}</span>
              <span className="lp__tab-label">{language === 'en' && tab.label_en ? tab.label_en : language === 'ru' && tab.label_ru ? tab.label_ru : tab.label}</span>
            </Link>
          ))}
          <div className="lp__tabs-menu"><BannerMenu /></div>
        </div>
      </nav>
    </>
  );
}
```
> The `<button>`→`<Link>` swap drops `type="button"`/`aria-pressed` and adds `href`/`aria-current`. Keep all class names identical so CSS is unchanged.

- [ ] **Step 2: Verify the SVG icons were copied, not stubbed**
```bash
grep -c "viewBox" src/components/catalog/CatalogHeader.tsx
```
Expected: `4` (the four tab icons present).

- [ ] **Step 3: Typecheck**
```bash
npx tsc --noEmit 2>&1 | grep "CatalogHeader" || echo "CatalogHeader clean"
```
Expected: `CatalogHeader clean`.

- [ ] **Step 4: Commit**
```bash
git add src/components/catalog/CatalogHeader.tsx
git commit -m "feat: CatalogHeader (hero + tab bar as links)"
```

---

### Task 4: DialoguesCatalog + rewire `/chinese`

**Files:**
- Create: `src/components/catalog/DialoguesCatalog.tsx`
- Modify: `src/app/[locale]/chinese/page.tsx`
- Reference: `LanguagePage.tsx` — dialogues state (search, activeTag, showBookmarked, dialogueHskLevel, bookmarks) + the `{activeTab === 'dialogues' && (…)}` block (~line 636) and the dialogues part of the HSK-pill bar (~559–620).

- [ ] **Step 1: Create `DialoguesCatalog.tsx`** — a `'use client'` component holding ONLY dialogue state + JSX, rendering the header itself:
```tsx
'use client';
import React, { useState, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useStars } from '../../hooks/useStars';
import { PageFooter } from '../PageFooter';
import { CatalogHeader } from './CatalogHeader';
import { TAGS, BOOKMARK_KEY, parseHskLevel, type HskLevel } from './types';
import type { DialogueInfo } from '../../services/dialogues';

interface Props {
  dialogues: DialogueInfo[];
  dialoguesHsk2: DialogueInfo[]; dialoguesHsk3: DialogueInfo[]; dialoguesHsk4: DialogueInfo[];
  dialoguesHsk5: DialogueInfo[]; dialoguesHsk6: DialogueInfo[];
  initialHsk?: HskLevel;
}

export function DialoguesCatalog(props: Props) {
  const { isLoading } = useRequireAuth();
  const [language] = useLanguage();
  const { getStars: getDialogueStars } = useStars('dialogue');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [dialogueHskLevel, setDialogueHskLevel] = useState<HskLevel>(props.initialHsk ?? '1');
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => { /* COPY from LanguagePage */ return new Set(); });

  return (
    <main className="home">
      <CatalogHeader currentTab="dialogues" hskLevel={dialogueHskLevel} />
      {/* COPY VERBATIM: the dialogues HSK-pill bar + the {activeTab === 'dialogues' && (…)} content,
          with `activeTab === 'dialogues' &&` wrappers removed (this component IS the dialogues tab). */}
      <PageFooter />
    </main>
  );
}
```
> The dialogues block references `getDialogueStars`, `bookmarks`, `setBookmarks`, `BOOKMARK_KEY`, `TAGS`, `search`, `activeTag`, `showBookmarked`, `dialogueHskLevel`, `setDialogueHskLevel`, and `props.dialogues..dialoguesHsk6`. Move the `bookmarks` `useEffect`/persistence and any dialogue-only `useMemo`s too. Do NOT move writing/flashcard/karaoke/grammar code.

- [ ] **Step 2: Rewire the page** to use the loader + the new component. Read initial HSK from `params`-free state (the page must not read `searchParams`); the pill defaults to `'1'` and the optional `?dialhsk` is applied client-side via `useSearchParams` *inside* `DialoguesCatalog` if desired — but to keep the page static, pass no searchParams from the server. (Client reads `?dialhsk` itself.)
```tsx
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { DialoguesCatalog } from '@/components/catalog/DialoguesCatalog';
import { loadDialoguesAll } from '@/services/catalogData';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy tili dialoglari — HSK 1-6', description: 'HSK 1-6 xitoy tili dialoglari: audio, pinyin, tarjima. Bepul boshlang!' },
  ru: { title: 'Диалоги на китайском — HSK 1-6', description: 'Диалоги HSK 1-6: аудио, пиньинь, перевод. Начните бесплатно!' },
  en: { title: 'Chinese Dialogues — HSK 1-6', description: 'HSK 1-6 Chinese dialogues with audio, pinyin and translation. Start free!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title, description: m.description,
    alternates: { canonical: `/${locale}/chinese`, languages: { uz: '/uz/chinese', ru: '/ru/chinese', en: '/en/chinese', 'x-default': '/uz/chinese' } },
  };
}

export default async function ChineseDialoguesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await loadDialoguesAll();
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([{ name: homeLabel, path: `/${locale}` }, { name: 'Chinese', path: `/${locale}/chinese` }]),
    { '@type': 'Course', name: 'HSK 1 Chinese', description: (pageMeta[locale] || pageMeta.uz).description, provider: { '@type': 'Organization', name: 'Blim' }, inLanguage: 'zh', educationalLevel: 'Beginner' },
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense>
        <DialoguesCatalog dialogues={d.dialogues} dialoguesHsk2={d.dialoguesHsk2} dialoguesHsk3={d.dialoguesHsk3} dialoguesHsk4={d.dialoguesHsk4} dialoguesHsk5={d.dialoguesHsk5} dialoguesHsk6={d.dialoguesHsk6} />
      </Suspense>
    </>
  );
}
```
> If `DialoguesCatalog` needs `?dialhsk` to preselect a level (back-link from a dialogue reader), read it with `useSearchParams()` *inside* the client component (it's already inside `<Suspense>`), initialising `dialogueHskLevel` from it — same as `LanguagePage` does today. Keep the page server-side free of `searchParams`.

- [ ] **Step 3: Build & verify `/chinese` is unchanged and still static**
```bash
npm run build 2>&1 | grep -E "/chinese( |$)" 
```
Expected: `/chinese` present, marked `●`/ISR (`1h`), not `ƒ`.

- [ ] **Step 4: Manual check** — run dev or preview, open `/uz/chinese`: dialogues list, HSK pills, search, tags, bookmarks all behave exactly as before; tab bar shows 4 tabs; clicking "Dialog" stays on `/chinese`.

- [ ] **Step 5: Commit**
```bash
git add src/components/catalog/DialoguesCatalog.tsx "src/app/[locale]/chinese/page.tsx"
git commit -m "feat: DialoguesCatalog + /chinese rewired to per-tab component"
```

---

### Task 5: WritingCatalog + `/chinese/writing`

**Files:**
- Create: `src/components/catalog/WritingCatalog.tsx`, `src/app/[locale]/chinese/writing/page.tsx`
- Reference: `LanguagePage.tsx` writing state (`hskVersion`, `writingHskLevel`, `writingSearch`) + the writing HSK-version seg-bar (~559) and `{activeTab === 'writing' && (…)}` blocks (~745), plus the `prefetchHanzi` effect (~396–405) which is writing-only.

- [ ] **Step 1: Create `WritingCatalog.tsx`** holding writing state + JSX, rendering `<CatalogHeader currentTab="writing" hskLevel={hskVersion === '2.0' ? writingHskLevel : '1'} />`. Props:
```tsx
interface Props {
  writingSets: WritingSetMeta[]; writingSetsHsk2: WritingSetMeta[]; writingSetsHsk2L2: WritingSetMeta[];
  writingSetsHsk3: WritingSetMeta[]; writingSetsHsk4: WritingSetMeta[]; writingSetsHsk5: WritingSetMeta[]; writingSetsHsk6: WritingSetMeta[];
}
```
Move the writing `prefetchHanzi` `useEffect` and `getWritingStars` here. Initialise `hskVersion` from `?version` and `writingHskLevel` from `?hsk` via `useSearchParams()` inside the component (as today).

- [ ] **Step 2: Create `writing/page.tsx`** — server component, loads `loadWritingCatalog(locale)`, own metadata + breadcrumb.
```tsx
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { WritingCatalog } from '@/components/catalog/WritingCatalog';
import { loadWritingCatalog } from '@/services/catalogData';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const meta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy ieroglif yozish — HSK 1-6', description: 'HSK 1-6 ieroglif yozishni mashq qiling: chiziq tartibi, SRS takrorlash.' },
  ru: { title: 'Написание иероглифов — HSK 1-6', description: 'Практика написания иероглифов HSK 1-6: порядок черт, интервальное повторение.' },
  en: { title: 'Chinese Character Writing — HSK 1-6', description: 'Practice writing HSK 1-6 characters: stroke order and spaced repetition.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.uz;
  return { title: m.title, description: m.description, alternates: { canonical: `/${locale}/chinese/writing`, languages: { uz: '/uz/chinese/writing', ru: '/ru/chinese/writing', en: '/en/chinese/writing', 'x-default': '/uz/chinese/writing' } } };
}

export default async function ChineseWritingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const w = loadWritingCatalog(locale);
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const sectionLabel = ({ uz: 'Yozish', ru: 'Письмо', en: 'Writing' } as Record<string, string>)[locale] || 'Writing';
  const jsonLd = jsonLdScript([breadcrumbJsonLd([
    { name: homeLabel, path: `/${locale}` }, { name: 'Chinese', path: `/${locale}/chinese` }, { name: sectionLabel, path: `/${locale}/chinese/writing` },
  ])]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense><WritingCatalog {...w} /></Suspense>
    </>
  );
}
```

- [ ] **Step 3: Build & verify**
```bash
npm run build 2>&1 | grep -E "chinese/writing"
```
Expected: `/[locale]/chinese/writing` present, `●`/ISR, not `ƒ`.

- [ ] **Step 4: Manual check** — `/uz/chinese/writing` shows the writing tab (version toggle, HSK pills, set cards, SRS); "Yozish" tab highlighted; switching to other tabs navigates by URL.

- [ ] **Step 5: Commit**
```bash
git add src/components/catalog/WritingCatalog.tsx "src/app/[locale]/chinese/writing/page.tsx"
git commit -m "feat: /chinese/writing route + WritingCatalog"
```

---

### Task 6: FlashcardsCatalog + `/chinese/flashcards`

**Files:**
- Create: `src/components/catalog/FlashcardsCatalog.tsx`, `src/app/[locale]/chinese/flashcards/page.tsx`
- Reference: flashcard state (`flashcardMode`, `flashcardSubTab`, `flashcardHskLevel`, `topicSearch`) + the flashcard pill block (~621) and `{activeTab === 'flashcards' && (…)}` (~824).

- [ ] **Step 1: Create `FlashcardsCatalog.tsx`** holding flashcard state + JSX, rendering `<CatalogHeader currentTab="flashcards" hskLevel={flashcardHskLevel} />`. Props:
```tsx
interface Props { flashcardLessons: FlashcardLesson[]; }
```
Initialise `flashcardSubTab` from `?subtab`, `flashcardHskLevel` from `?flashhsk`, `flashcardMode` from its localStorage initialiser (copy verbatim) via `useSearchParams()`/state inside the component.

- [ ] **Step 2: Create `flashcards/page.tsx`** — loads `loadFlashcardCatalog()`, own metadata + breadcrumb (mirror Task 5 structure; section label `Fleshkartalar`/`Флешкарты`/`Flashcards`; canonical `/${locale}/chinese/flashcards`; titles e.g. uz `'Xitoy tili fleshkartalar — HSK 1-3'`).
```tsx
// ...same shape as writing/page.tsx, but:
import { FlashcardsCatalog } from '@/components/catalog/FlashcardsCatalog';
import { loadFlashcardCatalog } from '@/services/catalogData';
// const lessons = await loadFlashcardCatalog();
// <Suspense><FlashcardsCatalog flashcardLessons={lessons} /></Suspense>
```

- [ ] **Step 3: Build & verify**
```bash
npm run build 2>&1 | grep -E "chinese/flashcards"
```
Expected: present, `●`/ISR, not `ƒ`.

- [ ] **Step 4: Manual check** — `/uz/chinese/flashcards`: HSK pills, lessons/topics subtab, mode bar, topic search all work; back-link from a flashcard deck (Task 11) lands here.

- [ ] **Step 5: Commit**
```bash
git add src/components/catalog/FlashcardsCatalog.tsx "src/app/[locale]/chinese/flashcards/page.tsx"
git commit -m "feat: /chinese/flashcards route + FlashcardsCatalog"
```

---

### Task 7: KaraokeCatalog + `/chinese/karaoke`

**Files:**
- Create: `src/components/catalog/KaraokeCatalog.tsx`, `src/app/[locale]/chinese/karaoke/page.tsx`
- Reference: `karaokeSearch` state + `{activeTab === 'karaoke' && (…)}` (~917) — note this block uses a `karaokeItems` array; check whether it's a module const in `LanguagePage.tsx` or derived. If it's a local const, move it into `KaraokeCatalog.tsx`.

- [ ] **Step 1: Create `KaraokeCatalog.tsx`** — no server data props (karaoke list is client-defined today). Holds `karaokeSearch`, renders `<CatalogHeader currentTab="karaoke" hskLevel="1" />` + the karaoke block verbatim. Props: `{}` (none) unless the `karaokeItems` source needs passing.

- [ ] **Step 2: Create `karaoke/page.tsx`** — minimal server component (no data load), own metadata + breadcrumb (section label `Qo'shiqlar`/`Песни`/`Songs`; canonical `/${locale}/chinese/karaoke`).
```tsx
// same shape; body just:
// <Suspense><KaraokeCatalog /></Suspense>
```

- [ ] **Step 3: Build & verify**
```bash
npm run build 2>&1 | grep -E "chinese/karaoke"
```
Expected: present, `●`/ISR, not `ƒ`.

- [ ] **Step 4: Manual check** — `/uz/chinese/karaoke`: song cards + search work; "KTV" tab highlighted.

- [ ] **Step 5: Commit**
```bash
git add src/components/catalog/KaraokeCatalog.tsx "src/app/[locale]/chinese/karaoke/page.tsx"
git commit -m "feat: /chinese/karaoke route + KaraokeCatalog"
```

---

### Task 8: GrammarCatalog + `/chinese/grammar`

**Files:**
- Create: `src/components/catalog/GrammarCatalog.tsx`, `src/app/[locale]/chinese/grammar/page.tsx`
- Reference: `grammarSearch` state, `grammarItems` const (~117+), `getGrammarStars`, `{activeTab === 'grammar' && (…)}` (~959).

- [ ] **Step 1: Create `GrammarCatalog.tsx`** — move `grammarItems` const + `grammarSearch` state + `getGrammarStars`; render `<CatalogHeader currentTab="grammar" hskLevel="1" />` + the grammar block verbatim. Props: `{}`. (Grammar has no tab-bar button — header simply renders no highlighted tab, identical to today.)

- [ ] **Step 2: Create `grammar/page.tsx`** — minimal server component, own metadata + breadcrumb (section label `Grammatika`/`Грамматика`/`Grammar`; canonical `/${locale}/chinese/grammar`; titles e.g. uz `'Xitoy tili grammatikasi — HSK 1'`).
```tsx
// <Suspense><GrammarCatalog /></Suspense>
```

- [ ] **Step 3: Build & verify**
```bash
npm run build 2>&1 | grep -E "chinese/grammar"
```
Expected: present, `●`/ISR, not `ƒ`.

- [ ] **Step 4: Manual check** — `/uz/chinese/grammar`: grammar cards + stars + search work.

- [ ] **Step 5: Commit**
```bash
git add src/components/catalog/GrammarCatalog.tsx "src/app/[locale]/chinese/grammar/page.tsx"
git commit -m "feat: /chinese/grammar route + GrammarCatalog"
```

---

### Task 9: Delete the monolith

**Files:**
- Delete: `src/components/LanguagePage.tsx`

- [ ] **Step 1: Confirm nothing imports it**
```bash
grep -rn "LanguagePage" src --include="*.tsx" --include="*.ts"
```
Expected: no matches (all five pages now use the `*Catalog` components).

- [ ] **Step 2: Delete + build**
```bash
git rm src/components/LanguagePage.tsx
npm run build 2>&1 | tail -3
```
Expected: build green.

- [ ] **Step 3: Commit**
```bash
git commit -m "refactor: delete LanguagePage monolith (replaced by per-tab catalog components)"
```

---

### Task 10: Middleware redirect for old `?tab=` bookmarks

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Read the current proxy** to see where to insert (before the auth/cache logic, after locale handling).
```bash
sed -n '1,80p' src/proxy.ts
```

- [ ] **Step 2: Add the redirect** — for `/{locale}/chinese?tab=<x>`, redirect to the new route, preserving other params; `tab=dialogues` strips the param and stays on `/chinese`.
```ts
// Inside the middleware function, early (before auth gating), after `locale` is known:
const TAB_ROUTES: Record<string, string> = { writing: 'writing', flashcards: 'flashcards', karaoke: 'karaoke', grammar: 'grammar' };
const url = request.nextUrl;
const tabMatch = url.pathname.match(/^\/(uz|ru|en)\/chinese\/?$/);
if (tabMatch && url.searchParams.has('tab')) {
  const tab = url.searchParams.get('tab')!;
  const dest = url.clone();
  dest.searchParams.delete('tab');
  if (TAB_ROUTES[tab]) dest.pathname = `/${tabMatch[1]}/chinese/${TAB_ROUTES[tab]}`;
  else dest.pathname = `/${tabMatch[1]}/chinese`; // dialogues or unknown → landing
  return NextResponse.redirect(dest, 308);
}
```
> Match the existing import style in `proxy.ts` (it already imports `NextResponse`/uses `request.nextUrl` for the auth gate — reuse those, don't add duplicates). Insert BEFORE the `blim-auth` cookie gate so redirects happen regardless of auth.

- [ ] **Step 3: Build + manual check**
```bash
npm run build 2>&1 | tail -2
```
Then in preview: visit `/uz/chinese?tab=flashcards&flashhsk=2` → must land on `/uz/chinese/flashcards?flashhsk=2`; `/uz/chinese?tab=dialogues&dialhsk=3` → `/uz/chinese?dialhsk=3`.

- [ ] **Step 4: Commit**
```bash
git add src/proxy.ts
git commit -m "feat: redirect legacy /chinese?tab= links to per-tab routes"
```

---

### Task 11: Repoint internal `?tab=` links

**Files (verified list):**
- `src/app/[locale]/chinese/hsk1/dialogues/page.tsx:8` → `redirect(/${locale}/chinese)`
- Dialogue reader breadcrumb + `listPath` (hsk1–hsk6 `dialogues/[dialogueId]/page.tsx`): `?tab=dialogues[&dialhsk=N]` → `/chinese[?dialhsk=N]`
- `hsk1/karaoke/[songId]/page.tsx:79` + `KaraokePlayer.tsx:333` → `/chinese/karaoke`
- Flashcard breadcrumbs + `backHref` (hsk1/2/3 flashcards, topic, mix, `FlashcardDeck.tsx:231`): `?tab=flashcards[…]` → `/chinese/flashcards[…]`
- `WritingPracticePage.tsx:33` `backUrl` ladder + `hsk1/writing/[setId]/page.tsx:64` breadcrumb: `?tab=writing[&version&hsk]` → `/chinese/writing[?version&hsk]`
- All `Grammar*PolishedPage.tsx` (`router.push` + back `<Link>`) + the 15 `hsk1/grammar/*/page.tsx` breadcrumbs: `?tab=grammar` → `/chinese/grammar`
- Footer/nav: `PageFooter.tsx:145-147`, `HomePage.tsx:416-420`

- [ ] **Step 1: List every remaining reference** (the authoritative to-do)
```bash
grep -rn "chinese?tab=" src --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Mechanically replace** each per the mapping in the spec ("Mapping rule" section). Examples:
  - `/chinese?tab=dialogues&dialhsk=2` → `/chinese?dialhsk=2`
  - `/chinese?tab=dialogues` → `/chinese`
  - `/chinese?tab=karaoke` → `/chinese/karaoke`
  - `/chinese?tab=flashcards` → `/chinese/flashcards`
  - `/chinese?tab=flashcards&flashhsk=2` → `/chinese/flashcards?flashhsk=2`
  - `/chinese?tab=flashcards&subtab=topics` → `/chinese/flashcards?subtab=topics`
  - `/chinese?tab=writing&version=2.0&hsk=6` → `/chinese/writing?version=2.0&hsk=6`
  - `/chinese?tab=writing` → `/chinese/writing`
  - `/chinese?tab=grammar` → `/chinese/grammar`

- [ ] **Step 3: Verify none remain**
```bash
grep -rn "chinese?tab=" src --include="*.tsx" --include="*.ts" || echo "all ?tab= links repointed"
```
Expected: `all ?tab= links repointed`.

- [ ] **Step 4: Build**
```bash
npm run build 2>&1 | tail -2
```
Expected: green.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "refactor: repoint internal ?tab= links to per-tab catalog routes"
```

---

### Task 12: Sitemap

**Files:**
- Modify: `src/app/sitemap.ts:39`

- [ ] **Step 1: Add the four routes** next to the existing `/chinese` entry.
```ts
entries.push(...localeEntries('/chinese', { changeFrequency: 'weekly', priority: 0.9 }));
entries.push(...localeEntries('/chinese/writing', { changeFrequency: 'weekly', priority: 0.8 }));
entries.push(...localeEntries('/chinese/flashcards', { changeFrequency: 'weekly', priority: 0.8 }));
entries.push(...localeEntries('/chinese/karaoke', { changeFrequency: 'weekly', priority: 0.8 }));
entries.push(...localeEntries('/chinese/grammar', { changeFrequency: 'weekly', priority: 0.8 }));
```
> Confirm `localeEntries` is the helper used on line 39 and matches this signature; if its name/shape differs, mirror the exact existing call.

- [ ] **Step 2: Build + check the sitemap output**
```bash
npm run build 2>&1 | tail -2
```

- [ ] **Step 3: Commit**
```bash
git add src/app/sitemap.ts
git commit -m "seo: add per-tab Chinese catalog routes to sitemap"
```

---

### Task 13: Full verification + ship

**Files:** none (verify + deploy)

- [ ] **Step 1: Compare route table to baseline — no route went dynamic**
```bash
npm run build 2>&1 | grep -E "chinese" | grep -E "ƒ" && echo "DYNAMIC LEAK — FIX" || echo "all chinese routes static/ISR ✓"
```
Expected: `all chinese routes static/ISR ✓`.

- [ ] **Step 2: Confirm all five routes built**
```bash
npm run build 2>&1 | grep -oE "/\[locale\]/chinese(/(writing|flashcards|karaoke|grammar))?" | sort -u
```
Expected: the five route patterns listed.

- [ ] **Step 3: Manual click-through (preview)** — for each of the 5 URLs: section renders, correct tab highlighted (grammar = none), `<title>` differs per route (view source). Click each tab → URL changes + Back steps between them. From a dialogue reader, flashcard deck, karaoke player, grammar page, and writing practice → Back lands on the correct new route with inner state intact. Old `?tab=` URL redirects.

- [ ] **Step 4: Merge to main**
```bash
git checkout main && git merge --no-ff chinese-catalog-routes -m "feat: split Chinese catalog into per-tab routes"
git push origin main
```

- [ ] **Step 5: Deploy**
```bash
ssh deploy@178.105.107.198 './deploy.sh'
```
Expected: `>> deployed`.

- [ ] **Step 6: Production smoke test** — load `https://blim.uz/uz/chinese/flashcards` and `…/grammar` directly; confirm they render and old `https://blim.uz/uz/chinese?tab=karaoke` redirects to `…/chinese/karaoke`.

---

## Notes for the implementer

- **No unit tests exist in this repo** for components; do not scaffold a test framework. Verification is `npm run build` + `grep` + manual preview, as written.
- **Extraction is copy, not rewrite.** When a step says "COPY VERBATIM", open `LanguagePage.tsx` at the referenced lines and move the exact JSX/state. The only allowed edits are: removing the `activeTab === 'x' &&` wrapper, swapping `activeTab` → `currentTab`/component-local state, and the `<button>`→`<Link>` tab change in the header.
- **If the build flips a route to `ƒ` (dynamic):** you almost certainly read `searchParams` or called `getLocale()` in a `page.tsx`/`generateMetadata`. Move that read into the client `*Catalog` component (`useSearchParams`) instead.
- **CSS untouched.** All `lp__*`, `home__*`, `dr-hero__*` class names are preserved, so `reading.css` needs no changes.
