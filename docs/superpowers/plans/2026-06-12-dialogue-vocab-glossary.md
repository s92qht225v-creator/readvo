# Central Dialogue-Vocabulary Glossary — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move dialogue-vocabulary translations out of the 31 inline dialogue JSONs into a single Supabase `glossary` table that the admin panel can edit, with dialogues referencing words by `(汉字, pinyin)` — with zero visible change to the Words tab.

**Architecture:** Dialogue JSONs keep an ordered **reference list** of which words to teach (content, in git). A Supabase `glossary` table holds the **translations** (data, admin-editable). The server resolves references → translations at render via a cached loader (cache tag `glossary`); admin writes call `revalidateTag('glossary')` so edits go live without a deploy. The browser never queries the table.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (service-role via `getSupabaseAdmin`), Python 3 for the one-time migration, `tsx` for the validation script.

**Testing reality (read this):** This repo has **no JS test framework** (no jest/vitest; `package.json` scripts are dev/build/lint/`validate-content`). So "tests" here are **runnable verification steps** the project actually uses: `npx tsc --noEmit`, `npm run build`, Python script dry-runs, a `tsx` validation script, and **preview-parity checks** (compare the Words tab before/after). Do not invent a jest harness.

**Spec:** `docs/superpowers/specs/2026-06-12-dialogue-vocab-glossary-design.md`

**Key type definitions** (used across tasks — defined in Task 2, referenced later):
```ts
// src/services/glossary.ts
export interface GlossaryEntry { zh: string; py: string; uz: string; ru: string; en: string; hsk?: number }
export type VocabRef = string | { zh: string; py?: string; uz?: string; ru?: string; en?: string };
export interface VocabItem { zh: string; py: string; uz: string; ru: string; en: string }
export function normPy(py: string): string; // py.normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase()
export function getGlossary(): Promise<GlossaryEntry[]>;            // cached, tag 'glossary'
export function resolveVocab(refs: VocabRef[]): Promise<VocabItem[]>;
```

---

## Phase 1 — Table + server loader + types (no behavior change)

### Task 1: Create the `glossary` Supabase table

**Files:**
- Create: `supabase/migrations/20260612_glossary.sql` (record of the DDL; applied to the live project)

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/20260612_glossary.sql`:
```sql
create table if not exists public.glossary (
  id         uuid primary key default gen_random_uuid(),
  zh         text not null,
  py         text not null,
  py_norm    text not null,
  uz         text not null,
  ru         text not null,
  en         text not null,
  hsk        smallint check (hsk between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zh, py_norm)
);
-- No RLS policies: the table is read/written only by the service-role key
-- (server + admin API). Keep RLS disabled so anon/auth roles have no access.
create index if not exists glossary_zh_idx on public.glossary (zh);
```

- [ ] **Step 2: Apply it to the live project**

Apply via the Supabase MCP tool `apply_migration` (project `miruwaeplbzfqmdwacsh`, name `glossary`, the SQL above) — or paste it into the Supabase dashboard SQL editor. Then confirm:
```
mcp__supabase__list_tables  → expect `glossary` present with the columns above
```
Expected: table exists, `unique (zh, py_norm)` constraint present.

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260612_glossary.sql
git commit -m "feat(glossary): create glossary table (zh+py keyed)"
```

### Task 2: Server-side glossary loader + resolver

**Files:**
- Create: `src/services/glossary.ts`
- Modify: `src/services/index.ts` (export the new module)

- [ ] **Step 1: Write `src/services/glossary.ts`**
```ts
import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export interface GlossaryEntry { zh: string; py: string; uz: string; ru: string; en: string; hsk?: number }
export type VocabRef = string | { zh: string; py?: string; uz?: string; ru?: string; en?: string };
export interface VocabItem { zh: string; py: string; uz: string; ru: string; en: string }

export function normPy(py: string): string {
  return py.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** All glossary rows, cached until the `glossary` tag is revalidated. */
export const getGlossary = unstable_cache(
  async (): Promise<GlossaryEntry[]> => {
    const { data, error } = await getSupabaseAdmin()
      .from('glossary')
      .select('zh, py, uz, ru, en, hsk');
    if (error) { console.error('[glossary] load failed:', error.message); return []; }
    return data ?? [];
  },
  ['glossary-all'],
  { tags: ['glossary'] },
);

/** Resolve a dialogue's reference list into display items. Unknown refs are
 *  dropped (the dialogue's auto-extract fallback covers the gap). */
export async function resolveVocab(refs: VocabRef[]): Promise<VocabItem[]> {
  if (!refs?.length) return [];
  const glossary = await getGlossary();
  const byZh = new Map<string, GlossaryEntry[]>();
  for (const e of glossary) {
    const list = byZh.get(e.zh) ?? [];
    list.push(e);
    byZh.set(e.zh, list);
  }
  const out: VocabItem[] = [];
  for (const ref of refs) {
    const zh = typeof ref === 'string' ? ref : ref.zh;
    const wantPy = typeof ref === 'string' ? undefined : ref.py;
    const candidates = byZh.get(zh) ?? [];
    let entry: GlossaryEntry | undefined;
    if (candidates.length === 1 && !wantPy) entry = candidates[0];
    else if (wantPy) entry = candidates.find((c) => normPy(c.py) === normPy(wantPy));
    else entry = undefined; // ambiguous bare ref: skip (validation catches authoring errors)
    if (!entry) continue;
    const o = typeof ref === 'string' ? {} : ref;
    out.push({
      zh: entry.zh,
      py: entry.py,
      uz: o.uz ?? entry.uz,
      ru: o.ru ?? entry.ru,
      en: o.en ?? entry.en,
    });
  }
  return out;
}
```

- [ ] **Step 2: Export from the services barrel**

In `src/services/index.ts`, add:
```ts
export * from './glossary';
```

- [ ] **Step 3: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**
```bash
git add src/services/glossary.ts src/services/index.ts
git commit -m "feat(glossary): server loader + reference resolver"
```

### Task 3: Validation script (refs ↔ table)

**Files:**
- Create: `scripts/validate-glossary.ts`
- Modify: `package.json` (add `validate-glossary` script)

- [ ] **Step 1: Write `scripts/validate-glossary.ts`**
```ts
import fs from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '../src/lib/supabase-server';
import { normPy, type VocabRef } from '../src/services/glossary';

const DIR = path.join(process.cwd(), 'content', 'dialogues');

async function main() {
  const { data: rows } = await getSupabaseAdmin().from('glossary').select('zh, py');
  const byZh = new Map<string, Set<string>>();
  for (const r of rows ?? []) {
    const s = byZh.get(r.zh) ?? new Set();
    s.add(normPy(r.py));
    byZh.set(r.zh, s);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  for (const book of fs.readdirSync(DIR)) {
    const bookDir = path.join(DIR, book);
    if (!fs.statSync(bookDir).isDirectory()) continue;
    for (const file of fs.readdirSync(bookDir).filter((f) => f.endsWith('.json'))) {
      const full = path.join(bookDir, file);
      const d = JSON.parse(fs.readFileSync(full, 'utf-8'));
      const refs: VocabRef[] = d.vocab ?? [];
      const allText = JSON.stringify(d.sections ?? []);
      for (const ref of refs) {
        const zh = typeof ref === 'string' ? ref : ref.zh;
        const wantPy = typeof ref === 'string' ? undefined : ref.py;
        const readings = byZh.get(zh);
        if (!readings) { errors.push(`${book}/${file}: '${zh}' not in glossary`); continue; }
        if (readings.size > 1 && !wantPy) errors.push(`${book}/${file}: '${zh}' ambiguous — needs py`);
        if (wantPy && !readings.has(normPy(wantPy))) errors.push(`${book}/${file}: '${zh}' py '${wantPy}' not found`);
        if (!allText.includes(zh)) warnings.push(`${book}/${file}: '${zh}' not found in dialogue sentences`);
      }
    }
  }
  warnings.forEach((w) => console.warn('WARN ', w));
  if (errors.length) { errors.forEach((e) => console.error('ERROR', e)); process.exit(1); }
  console.log('glossary validation passed');
}
main();
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, add:
```json
"validate-glossary": "tsx scripts/validate-glossary.ts"
```

- [ ] **Step 3: Run it (expect a clean pass — table empty, no refs yet)**

Run: `npm run validate-glossary`
Expected: `glossary validation passed` (no dialogue has `vocab` refs yet; loop finds nothing to fail). If env vars are missing it will throw — run where `.env.local` is loaded (tsx auto-loads it via Next? if not, prefix `npx dotenv -e .env.local -- tsx scripts/validate-glossary.ts`).

- [ ] **Step 4: Commit**
```bash
git add scripts/validate-glossary.ts package.json
git commit -m "feat(glossary): reference-integrity validation script"
```

**Phase 1 done:** machinery exists, nothing reads it yet, zero behavior change.

---

## Phase 2 — Migration (seed table + rewrite dialogues to refs)

### Task 4: Write the migration script

**Files:**
- Create: `scripts/migrate-vocab-to-glossary.py`

- [ ] **Step 1: Write the script**

Create `scripts/migrate-vocab-to-glossary.py`:
```python
import json, glob, unicodedata, os, collections

DIR = 'content/dialogues'
OUT = 'scripts/out'
os.makedirs(OUT, exist_ok=True)

def norm_py(py):
    return ' '.join(unicodedata.normalize('NFC', py).strip().split()).lower()

# 1. collect every current inline entry
by_key = collections.defaultdict(list)  # (zh, norm_py) -> list of (file, level, entry)
files = sorted(glob.glob(f'{DIR}/**/*.json', recursive=True))
for f in files:
    d = json.load(open(f, encoding='utf-8'))
    for v in d.get('vocab', []):
        if not isinstance(v, dict) or 'zh' not in v:  # already migrated (string ref) -> skip
            continue
        by_key[(v['zh'], norm_py(v.get('py','')))].append((f, d.get('level'), v))

# 2. build glossary rows + conflict report
rows, conflicts = [], []
for (zh, npy), occ in by_key.items():
    glosses = {(o[2].get('uz',''), o[2].get('ru',''), o[2].get('en','')) for o in occ}
    first = occ[0][2]
    hsk = min((o[1] for o in occ if o[1]), default=None)
    row = {'zh': zh, 'py': first.get('py',''), 'py_norm': npy,
           'uz': first.get('uz',''), 'ru': first.get('ru',''), 'en': first.get('en',''), 'hsk': hsk}
    rows.append(row)
    if len(glosses) > 1:
        conflicts.append({'zh': zh, 'py': first.get('py',''),
                          'variants': [{'file': o[0], 'uz': o[2].get('uz'), 'ru': o[2].get('ru'), 'en': o[2].get('en')} for o in occ]})

# 3. which zh are homographs (need py in refs)?
ambiguous = {zh for zh in {r['zh'] for r in rows}
             if len({r['py_norm'] for r in rows if r['zh'] == zh}) > 1}

# 4. emit seed SQL
def sql_str(s): return "'" + (s or '').replace("'", "''") + "'"
with open(f'{OUT}/glossary-seed.sql', 'w', encoding='utf-8') as out:
    out.write('insert into public.glossary (zh, py, py_norm, uz, ru, en, hsk) values\n')
    vals = []
    for r in sorted(rows, key=lambda r: (r['hsk'] or 9, r['py_norm'])):
        hsk = str(r['hsk']) if r['hsk'] else 'null'
        vals.append(f"  ({sql_str(r['zh'])}, {sql_str(r['py'])}, {sql_str(r['py_norm'])}, "
                    f"{sql_str(r['uz'])}, {sql_str(r['ru'])}, {sql_str(r['en'])}, {hsk})")
    out.write(',\n'.join(vals) + '\non conflict (zh, py_norm) do nothing;\n')

# 5. rewrite each dialogue's vocab -> reference list (appearance order preserved)
for f in files:
    d = json.load(open(f, encoding='utf-8'))
    if 'vocab' not in d: continue
    new = []
    for v in d['vocab']:
        if isinstance(v, str): new.append(v); continue
        zh = v['zh']
        new.append({'zh': zh, 'py': v.get('py','')} if zh in ambiguous else zh)
    d['vocab'] = new
    json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(f, 'a', encoding='utf-8').write('\n')

json.dump(conflicts, open(f'{OUT}/glossary-conflicts.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=2)
print(f'rows={len(rows)} conflicts={len(conflicts)} ambiguous_zh={len(ambiguous)}')
```

- [ ] **Step 2: Dry-run check on a COPY first (do not trust blindly)**
```bash
git stash --include-untracked   # or work on a branch; ensure clean tree to diff against
python3 scripts/migrate-vocab-to-glossary.py
git --no-pager diff --stat       # expect 31 dialogue JSONs modified
cat scripts/out/glossary-conflicts.json | python3 -m json.tool | head -40
```
Expected: `rows≈207 conflicts=11 ambiguous_zh≈N`; 31 JSONs rewritten to reference lists; conflicts file lists the 11 diverging words.

- [ ] **Step 3: Validate the rewritten JSONs still parse**
```bash
for f in $(find content/dialogues -name '*.json'); do python3 -c "import json,sys;json.load(open('$f'))" || echo "BAD $f"; done
echo "all parsed"
```
Expected: `all parsed`.

- [ ] **Step 4: Commit the script + outputs + rewritten JSONs**
```bash
git add scripts/migrate-vocab-to-glossary.py scripts/out content/dialogues
git commit -m "feat(glossary): migration script + dialogues rewritten to references"
```

### Task 5: Resolve the 11 conflicts and seed the table

**Files:**
- Modify: `scripts/out/glossary-seed.sql` (human-edits the 11 conflict rows to the canonical gloss)

- [ ] **Step 1: HUMAN STEP — pick canonical glosses**

Open `scripts/out/glossary-conflicts.json`. For each of the 11 words, decide the correct UZ/RU/EN and edit the matching row in `scripts/out/glossary-seed.sql`. (This is the one judgement step — the script never guesses meaning.)

- [ ] **Step 2: Apply the seed to the live table**

Apply `scripts/out/glossary-seed.sql` via the Supabase MCP `apply_migration` tool (or dashboard SQL editor). Then verify:
```
mcp__supabase__execute_sql  → "select count(*) from glossary;"   → expect ≈207
mcp__supabase__execute_sql  → "select zh,py from glossary where zh='还';"  → expect 2 rows (hái, huán) if 还 was a homograph in data
```

- [ ] **Step 3: Run validation against the now-seeded table**
```bash
npx dotenv -e .env.local -- tsx scripts/validate-glossary.ts
```
Expected: `glossary validation passed` (every reference resolves; no ambiguous bare refs). Fix any ERROR before continuing.

- [ ] **Step 4: Commit the finalized seed**
```bash
git add scripts/out/glossary-seed.sql
git commit -m "chore(glossary): resolve 11 conflicts + seed canonical glossary"
```

**Phase 2 done:** table holds the de-duplicated glossary; dialogues reference it; validation green. Reads still use inline path until Task 6 — but inline `vocab` is now a reference list, so the Words tab would currently show fewer/no items. **Do NOT deploy between Phase 2 and Phase 3** — land them together.

---

## Phase 3 — Cut over reads (verify identical, deploy)

### Task 6: Resolve vocab server-side in the dialogue pages

**Files:**
- Modify: `src/services/dialogues.ts` (vocab type → `VocabRef[]`; add `resolveDialogueVocab`)
- Modify: `src/app/[locale]/chinese/hsk1/dialogues/[dialogueId]/page.tsx`
- Modify: `src/app/[locale]/chinese/hsk2/dialogues/[dialogueId]/page.tsx`
- Modify: `src/app/[locale]/chinese/hsk3/dialogues/[dialogueId]/page.tsx`
- Modify: `src/app/[locale]/chinese/hsk4/dialogues/[dialogueId]/page.tsx`
- Modify: `src/app/[locale]/chinese/hsk5/dialogues/[dialogueId]/page.tsx`
- Modify: `src/app/[locale]/chinese/hsk6/dialogues/[dialogueId]/page.tsx`

- [ ] **Step 1: Change the `vocab` type + add a resolver in `dialogues.ts`**

In `src/services/dialogues.ts`, replace the `vocab?: {...}[]` block (currently lines ~50-61, the one with `ex`/`expy`/`ex_uz`) with:
```ts
  vocab?: import('./glossary').VocabRef[];
```

Then add at the end of the file:
```ts
import { resolveVocab, type VocabItem } from './glossary';

export type DialoguePageResolved = Omit<DialoguePage, 'vocab'> & { vocab?: VocabItem[] };

/** Resolve a dialogue's vocab references against the glossary (server-side). */
export async function resolveDialogueVocab(d: DialoguePage): Promise<DialoguePageResolved> {
  const vocab = d.vocab ? await resolveVocab(d.vocab) : undefined;
  return { ...d, vocab };
}
```

- [ ] **Step 2: Wire each dialogue page (all 6 levels, identical edit)**

In each `.../hskN/dialogues/[dialogueId]/page.tsx`, in the **default export** only (not `generateMetadata`), wrap the loaded dialogue. For hsk5 the current lines are:
```ts
  const dialogue = await loadDialogue('hsk5', dialogueId);
  if (!dialogue) {
    notFound();
  }
```
Change to:
```ts
  const raw = await loadDialogue('hsk5', dialogueId);
  if (!raw) {
    notFound();
  }
  const dialogue = await resolveDialogueVocab(raw);
```
And add `resolveDialogueVocab` to the import from `@/services`:
```ts
import { loadDialogue, loadDialoguesForBook, resolveDialogueVocab } from '@/services';
```
Repeat for hsk1, hsk2, hsk3, hsk4, hsk6 (swap the book id). `generateMetadata` stays on raw `loadDialogue` (it never reads vocab).

- [ ] **Step 3: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; build succeeds. (If `DialogueReader`'s `dialogue` prop type complains, it accepts the resolved shape because `vocab: VocabItem[]` is `{zh,py,uz,ru,en}` — the shape its `VocabEntry` already expects.)

- [ ] **Step 4: Preview-parity check — capture BEFORE is impossible post-migration, so verify against known data**

Start preview (`npm run dev`), open `/uz/chinese/hsk5/dialogues/should-i-change-jobs`, click the Words tab, and confirm all 33 cards render with correct pinyin + Uzbek (e.g. 心事 → "tashvish, ko'ngildagi dard"), then flip-direction toggle still works. Repeat one HSK 1 dialogue and one HSK 2 dialogue, in RU and EN too. Use preview_eval to assert counts:
```js
document.querySelectorAll('.dr-flip').length // expect the dialogue's word count
document.querySelector('.dr-flip__front').textContent // expect pinyin + 汉字 (or meaning in reversed mode)
```
Expected: identical to pre-migration content (same words, translations, order).

- [ ] **Step 5: Commit**
```bash
git add src/services/dialogues.ts "src/app/[locale]/chinese"/*/dialogues
git commit -m "feat(glossary): resolve dialogue vocab from table server-side"
```

- [ ] **Step 6: Deploy + live check**
```bash
git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```
Then load a dialogue on https://blim.uz, open Words tab, confirm cards render. (Lockfile note: no new deps added, so `--ff-only` should not abort.)

**Phase 3 done:** dialogues read translations from the table; Words tab unchanged for users.

---

## Phase 4 — Admin "Glossary" tab (the editor)

### Task 7: Admin glossary API

**Files:**
- Create: `src/app/api/admin/glossary/route.ts`

- [ ] **Step 1: Write the route**
```ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function ok(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  return !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}
const norm = (py: string) => py.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();

export async function GET(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  let query = getSupabaseAdmin().from('glossary').select('*').order('zh');
  if (q) query = query.or(`zh.ilike.%${q}%,py.ilike.%${q}%,uz.ilike.%${q}%,ru.ilike.%${q}%,en.ilike.%${q}%`);
  const { data, error } = await query.limit(1000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ words: data });
}

export async function POST(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const b = await req.json();
  for (const k of ['zh', 'py', 'uz', 'ru', 'en'] as const) {
    if (!b[k] || !String(b[k]).trim()) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
  }
  const row = { zh: b.zh.trim(), py: b.py.trim(), py_norm: norm(b.py), uz: b.uz, ru: b.ru, en: b.en,
                hsk: b.hsk ? Number(b.hsk) : null, updated_at: new Date().toISOString() };
  const admin = getSupabaseAdmin();
  const { error } = b.id
    ? await admin.from('glossary').update(row).eq('id', b.id)
    : await admin.from('glossary').insert(row);
  if (error) {
    const msg = error.code === '23505' ? 'A word with this 汉字 + pinyin already exists' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  revalidateTag('glossary');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!ok(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await getSupabaseAdmin().from('glossary').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateTag('glossary');
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**
```bash
git add "src/app/api/admin/glossary/route.ts"
git commit -m "feat(glossary): admin CRUD API (search/upsert/delete + revalidate)"
```

### Task 8: Admin "Glossary" tab UI

**Files:**
- Modify: `src/components/AdminPanel.tsx`

- [ ] **Step 1: Add the tab to the union + state**

In `src/components/AdminPanel.tsx` line 7, change:
```ts
type AdminTab = 'payments' | 'users' | 'audio';
```
to:
```ts
type AdminTab = 'payments' | 'users' | 'audio' | 'glossary';
```

- [ ] **Step 2: Add glossary state + loaders near the other `useState` hooks (after line 77)**
```tsx
  type GlossaryWord = { id: string; zh: string; py: string; uz: string; ru: string; en: string; hsk: number | null };
  const [glossary, setGlossary] = useState<GlossaryWord[]>([]);
  const [glossaryQ, setGlossaryQ] = useState('');
  const [editWord, setEditWord] = useState<Partial<GlossaryWord> | null>(null);
  const [glossaryErr, setGlossaryErr] = useState('');

  const loadGlossary = async (q = '') => {
    const res = await fetch(`/api/admin/glossary?q=${encodeURIComponent(q)}`, { headers: { 'x-admin-password': password } });
    const json = await res.json();
    if (res.ok) setGlossary(json.words || []);
  };
  const saveWord = async () => {
    setGlossaryErr('');
    const res = await fetch('/api/admin/glossary', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify(editWord),
    });
    const json = await res.json();
    if (!res.ok) { setGlossaryErr(json.error || 'Save failed'); return; }
    setEditWord(null); await loadGlossary(glossaryQ);
  };
  const deleteWord = async (id: string) => {
    if (!confirm('Delete this word?')) return;
    await fetch(`/api/admin/glossary?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': password } });
    await loadGlossary(glossaryQ);
  };
```

- [ ] **Step 3: Add the tab button (next to the audio tab button, after line 348-350)**
```tsx
        <button
          className={`admin__tab${tab === 'glossary' ? ' admin__tab--active' : ''}`}
          onClick={() => { setTab('glossary'); loadGlossary(); }}
        >Glossary</button>
```

- [ ] **Step 4: Add the panel (after the `{tab === 'audio' && (...)}` block, ~line 508+)**
```tsx
      {tab === 'glossary' && (
        <div className="admin__glossary">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              placeholder="Search 汉字 / pinyin / translation…"
              value={glossaryQ}
              onChange={(e) => setGlossaryQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') loadGlossary(glossaryQ); }}
              style={{ flex: 1, padding: 8 }}
            />
            <button onClick={() => loadGlossary(glossaryQ)}>Search</button>
            <button onClick={() => { setEditWord({ zh: '', py: '', uz: '', ru: '', en: '', hsk: null }); setGlossaryErr(''); }}>+ Add word</button>
          </div>

          {editWord && (
            <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              {(['zh', 'py', 'uz', 'ru', 'en'] as const).map((f) => (
                <input key={f} placeholder={f} value={(editWord as Record<string, string>)[f] || ''}
                  onChange={(e) => setEditWord({ ...editWord, [f]: e.target.value })}
                  style={{ display: 'block', width: '100%', padding: 6, marginBottom: 6 }} />
              ))}
              <input placeholder="hsk (1-6, optional)" value={editWord.hsk ?? ''}
                onChange={(e) => setEditWord({ ...editWord, hsk: e.target.value ? Number(e.target.value) : null })}
                style={{ display: 'block', width: '100%', padding: 6, marginBottom: 6 }} />
              {glossaryErr && <div style={{ color: '#dc2626', marginBottom: 6 }}>{glossaryErr}</div>}
              <button onClick={saveWord}>Save</button>
              <button onClick={() => setEditWord(null)} style={{ marginLeft: 8 }}>Cancel</button>
            </div>
          )}

          <table style={{ width: '100%', fontSize: 14 }}>
            <thead><tr><th>汉字</th><th>pinyin</th><th>UZ</th><th>RU</th><th>EN</th><th>HSK</th><th></th></tr></thead>
            <tbody>
              {glossary.map((w) => (
                <tr key={w.id}>
                  <td>{w.zh}</td><td>{w.py}</td><td>{w.uz}</td><td>{w.ru}</td><td>{w.en}</td><td>{w.hsk ?? ''}</td>
                  <td>
                    <button onClick={() => { setEditWord(w); setGlossaryErr(''); }}>Edit</button>
                    <button onClick={() => deleteWord(w.id)} style={{ marginLeft: 6 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
```

- [ ] **Step 5: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; build succeeds.

- [ ] **Step 6: Manual verify on preview**

`npm run dev`, open `/?admin=true`, log in, click **Glossary**. Confirm: list loads, search filters, Add creates a row, Edit updates, Delete removes, and a duplicate `(汉字, pinyin)` shows the friendly error. Then open a dialogue's Words tab and confirm an edited translation appears (revalidateTag works) after a reload.

- [ ] **Step 7: Commit + deploy**
```bash
git add src/components/AdminPanel.tsx
git commit -m "feat(glossary): admin Glossary tab (search/add/edit/delete)"
git push origin main
ssh deploy@178.105.107.198 './deploy.sh'
```

**Phase 4 done:** you can manage all vocabulary from the admin panel; edits go live without a deploy.

> **Known limitation (deferred):** delete is a plain confirm — it does *not* yet block deleting a word a dialogue still references. The safety net is `npm run validate-glossary` (Task 3), which fails pre-deploy if any dialogue references a now-missing word, and the runtime auto-extract fallback. Reference-aware delete-blocking can be a Phase 5 follow-on if desired.

---

## Phase 5 — Optional follow-ons (not required for sign-off)

- Backfill HSK 4/6 dialogues: add `vocab` reference lists to those JSONs and the matching words to the glossary (via the admin tab or another seed).
- Reuse the glossary for: a cross-dialogue flashcard deck, vocab search, a dictionary view. Each is its own spec/plan.

---

## Docs to update (do as part of Phase 4 commit)

- `src/components/CLAUDE.md` — Words-tab section: note translations now come from the Supabase `glossary` table via `resolveVocab`, dialogues store `vocab` as a **reference list** (`VocabRef[]`), and the admin Glossary tab edits the source of truth.
- `content/CLAUDE.md` — dialogue `vocab[]` format: now a list of references (`"汉字"` or `{ "zh", "py" }`), not inline translations.
- `CLAUDE.md` (root) — Admin Panel section: add the **Glossary tab** and `glossary` table; Supabase Storage/DB list: add `glossary` table.

## Final review

After all phases: run `npx tsc --noEmit`, `npm run build`, `npm run validate-glossary`; confirm the Words tab renders identically across HSK 1/2/3/5, all three languages, both flip directions; confirm admin CRUD + live-edit propagation. Then dispatch a final code review.
