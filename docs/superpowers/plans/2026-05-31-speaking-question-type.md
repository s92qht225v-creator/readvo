# Speaking Question Type — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `speaking` test-app question type where a student records an open-ended spoken reply, the AI transcribes + scores it against a teacher's rubric, and the result is shown as its own score (never merged into the objective total).

**Architecture:** Speaking grading runs on its own track — a dedicated `test_speaking_grades` table + a private `test-recordings` bucket + a new `/api/t/[slug]/speaking-grade` endpoint that transcribes (reusing `whisper.ts`) and judges (new `rubricJudge.ts`). `gradeAnswer()` returns `null` for `speaking`, so the existing objective scoring (responses route, `summarizeSectionScores`, done screen) is untouched and excludes speaking automatically. Grading happens **on record** (background), Pro-gated, with guardrails.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (Postgres + Storage), OpenAI (`gpt-4o-transcribe`, `gpt-4o-mini`), Groq (whisper fallback), MediaRecorder API.

**Spec:** `docs/superpowers/specs/2026-05-31-speaking-question-type-design.md`

**Verification model (this project has no unit-test harness):** every task is verified with `npm run build` (typecheck + compile), plus — where relevant — `curl` against the deployed API, the Supabase MCP (`execute_sql`), and Playwright for UI. Mirrors how the test-app has been built all session. Commit after each task.

---

## File Structure

**Create:**
- `src/lib/transcribe/rubricJudge.ts` — LLM rubric scorer (transcript + criteria → per-criterion verdicts + points + feedback).
- `src/app/api/t/[slug]/speaking-grade/route.ts` — record-time grading endpoint (guardrails → upload → STT → judge → store).
- `src/components/test/settings/SpeakingSettings.tsx` — builder rubric editor.
- `src/components/test/renderers/SpeakingRecorder.tsx` — player recorder UI.

**Modify:**
- `src/lib/test/types.ts` — `SpeakingOptions`/`PublicSpeakingOptions` + add `'speaking'` to unions.
- `src/lib/test/grade.ts` — `gradeAnswer`/`hasAnswer` handle `speaking`.
- `src/components/test/QuestionRenderer.tsx` — `speaking` branch.
- `src/components/test/SettingsPanel.tsx` — dispatch.
- `src/components/test/questionTypeMeta.ts` — icon/label.
- `src/components/test/TestBuilder.tsx` — `addQuestion` default + Pro-gate.
- `src/components/test/tq-options.css` — `--speaking-*` tokens.
- `src/components/test/ResponsesTable.tsx` — teacher speaking display.
- `src/app/api/tests/[id]/publish/route.ts` — block publishing speaking tests when not Pro.

**Migrations (Supabase MCP `apply_migration`):** `test_speaking_grades` table + RLS; `test-recordings` private bucket.

---

## Phase 1 — Data model + grading core

Independently verifiable via the API (no UI needed).

### Task 1: Migration — table + bucket

**Files:** Supabase MCP `apply_migration` (name `speaking_grades`).

- [ ] **Step 1: Apply the migration**

```sql
create table if not exists test_speaking_grades (
  response_id uuid not null references test_responses(id) on delete cascade,
  question_id uuid not null references test_questions(id) on delete cascade,
  audio_url text,
  transcript text,
  score numeric not null default 0,
  max_score numeric not null default 0,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (response_id, question_id)
);
alter table test_speaking_grades enable row level security;
-- owner can read grades for their own tests
create policy "owner reads speaking grades" on test_speaking_grades
  for select using (
    exists (
      select 1 from test_responses r join tests t on t.id = r.test_id
      where r.id = test_speaking_grades.response_id and t.owner_id = auth.uid()
    )
  );
-- writes are service-role only (no policy needed; service role bypasses RLS)
insert into storage.buckets (id, name, public)
  values ('test-recordings','test-recordings', false)
  on conflict (id) do nothing;
```

- [ ] **Step 2: Verify** — `execute_sql`: `select count(*) from test_speaking_grades;` (expect 0) and `select public from storage.buckets where id='test-recordings';` (expect `false`).

### Task 2: Types

**Files:** Modify `src/lib/test/types.ts`.

- [ ] **Step 1: Add the options types + union members**

```ts
export interface SpeakingRubricCriterion { id: string; text: string; weight: number }
export interface SpeakingOptions {
  rubric: SpeakingRubricCriterion[];
  maxRecordingSeconds: number; // default 30
}
export type PublicSpeakingOptions = SpeakingOptions; // rubric is non-secret? NO — keep rubric server-side
```

Note: the rubric is the answer key — it must NOT reach the player. `PublicSpeakingOptions` exposes only `{ maxRecordingSeconds }`. `sanitizeQuestion` (in `src/lib/test/sanitize.ts`) strips `rubric` for `speaking`, mirroring how it strips `correctIndex` etc.

Add `'speaking'` to the `BuilderQuestion['type']` and `PublicQuestion['type']` unions and to `builderTypes.ts`.

- [ ] **Step 2: Verify** — `npm run build` (expect compile OK).
- [ ] **Step 3: Commit** — `git commit -m "speaking: types + sanitize rubric out of public payload"`

### Task 3: grade.ts — exclude speaking from objective scoring

**Files:** Modify `src/lib/test/grade.ts`.

- [ ] **Step 1:** In `gradeAnswer`, add at the top of the type checks:

```ts
if (question.type === 'speaking') return null; // graded on its own track
```

- [ ] **Step 2:** In `hasAnswer`, add:

```ts
if (question.type === 'speaking') return value?.recorded === true;
```

(Also extend `AnswerSubmission['value']` in types.ts with `recorded?: boolean`.)

- [ ] **Step 3: Verify** — `npm run build`. Reason: `gradeAnswer→null` means `summarizeSectionScores` + the responses-route total already skip speaking (they drop `null`). No scoring-rollup edits needed — confirm by reading both and checking they branch on `ic === null`.
- [ ] **Step 4: Commit** — `git commit -m "speaking: exclude from objective grading; hasAnswer for required-guard"`

### Task 4: rubricJudge.ts

**Files:** Create `src/lib/transcribe/rubricJudge.ts`.

- [ ] **Step 1: Implement** (model `gpt-4o-mini`, temp 0, JSON mode):

```ts
import OpenAI from 'openai';
import type { SpeakingRubricCriterion } from '@/lib/test/types';

export interface CriterionVerdict {
  id: string; verdict: 'full' | 'partial' | 'none'; earned: number; note: string;
}
export interface RubricResult {
  criteria: CriterionVerdict[]; score: number; maxScore: number; feedback: string;
}

export async function judgeRubric(
  transcript: string,
  rubric: SpeakingRubricCriterion[],
  langLabel: string,
): Promise<RubricResult> {
  const maxScore = rubric.reduce((s, c) => s + (c.weight ?? 1), 0);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const sys = `You grade a spoken reply against a rubric. For each criterion decide full|partial|none. ` +
    `Award full=weight, partial=half weight, none=0. Reply ONLY with JSON. ` +
    `Write each note and the overall feedback in ${langLabel}.`;
  const user = JSON.stringify({ transcript, rubric });
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' },
      max_tokens: 600,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    });
    const j = JSON.parse(res.choices[0].message.content ?? '{}');
    const criteria: CriterionVerdict[] = rubric.map(c => {
      const v = (j.criteria ?? []).find((x: { id: string }) => x.id === c.id) ?? {};
      const verdict = v.verdict === 'full' || v.verdict === 'partial' ? v.verdict : 'none';
      const earned = verdict === 'full' ? c.weight : verdict === 'partial' ? c.weight / 2 : 0;
      return { id: c.id, verdict, earned, note: String(v.note ?? '') };
    });
    const score = criteria.reduce((s, c) => s + c.earned, 0);
    return { criteria, score, maxScore, feedback: String(j.feedback ?? '') };
  } catch {
    // graceful fallback: zero with a flag note
    return { criteria: rubric.map(c => ({ id: c.id, verdict: 'none', earned: 0, note: '' })), score: 0, maxScore, feedback: 'Could not grade automatically.' };
  }
}
```

- [ ] **Step 2: Verify** — `npm run build`.
- [ ] **Step 3: Commit** — `git commit -m "speaking: rubricJudge LLM scorer"`

### Task 5: speaking-grade endpoint + guardrails

**Files:** Create `src/app/api/t/[slug]/speaking-grade/route.ts`. Reference existing `src/app/api/t/[slug]/audio-consumed/route.ts` (token+response guard pattern) and `src/lib/transcribe/whisper.ts` (`transcribeAudio`).

- [ ] **Step 1: Implement** the POST handler (FormData: `respondent_token`, `response_id`, `question_id`, `audio` blob):
  1. Validate slug + fields (mirror `audio-consumed`).
  2. Load the response row by `id`+`respondent_token`; 404 if missing. Get `test_id`.
  3. Load the test (`owner_id`, language) + the question (`type='speaking'`, `options.rubric`). Reject if not speaking.
  4. **Guardrails:**
     - Pro check: `subscriptions.ends_at > now()` for `owner_id`; else 403 `not_pro`.
     - Idempotent: if a `test_speaking_grades` row exists for `(response_id, question_id)`, return it (200) without re-grading.
     - Daily cap: `count(*)` from `test_speaking_grades` joined to responses for this `test_id` where `created_at::date = today`; if ≥ cap (const `SPEAKING_DAILY_CAP = 200`), return 429 `cap_reached`.
  5. Upload the audio blob to `test-recordings` at `${test_id}/${response_id}/${question_id}.webm` (service role). Store the path.
  6. STT: `transcribeAudio(buffer, langHint)` (reuse whisper.ts; pass the test language).
  7. `judgeRubric(transcript, rubric, langLabel)`.
  8. Insert `test_speaking_grades` row `{ response_id, question_id, audio_url, transcript, score, max_score, detail: { criteria, feedback } }`.
  9. Return `{ ok: true }` (no score to the student — exam-style).

  Use `getSupabaseAdmin()` for all DB/storage.

- [ ] **Step 2: Verify guards** — `curl` (no body / bad token) → 400/404; (non-Pro owner test) → 403.
- [ ] **Step 3: Verify happy path** — create a throwaway Pro-owner test + speaking question via `execute_sql`; create a session; POST a short audio file; `execute_sql select score, transcript from test_speaking_grades` → row present with a score. Delete the throwaway.
- [ ] **Step 4: Commit** — `git commit -m "speaking: record-time grading endpoint + guardrails"`

---

## Phase 2 — Player (the recorder)

### Task 6: SpeakingRecorder component

**Files:** Create `src/components/test/renderers/SpeakingRecorder.tsx`. Reference the MediaRecorder usage in `src/components/SpeakingMashq.tsx` (mic permission, record, stop, blob).

- [ ] **Step 1: Implement** props `{ question, slug, responseId, respondentToken, maxSeconds, onRecorded }`:
  - States: `idle | recording | uploading | done | error`.
  - Record button → `MediaRecorder`; countdown to `maxSeconds`; auto-stop.
  - On stop → POST blob to `/api/t/${slug}/speaking-grade` (FormData). On 200 → state `done`, call `onRecorded()` (sets answer `{ recorded: true }`). On 403 `not_pro` / 429 → friendly message.
  - **One attempt:** once `done`, no re-record (button hidden).
  - Exam-style: show "Recorded ✓", no score.
- [ ] **Step 2: Verify** — `npm run build`.
- [ ] **Step 3: Commit** — `git commit -m "speaking: player recorder component"`

### Task 7: QuestionRenderer branch + CSS

**Files:** Modify `QuestionRenderer.tsx` (+ pass `slug`/`responseId`/`respondentToken` down — already threaded for other answers via the player), `tq-options.css`.

- [ ] **Step 1:** Add `if (question.type === 'speaking') return <SpeakingRecorder ... onRecorded={() => onAnswer({ recorded: true })} />`.
- [ ] **Step 2:** Add `--speaking-*` tokens + `.test-speaking-*` rules (mic button, countdown, recorded state) under `[data-test-device]` blocks, per `TOKENS.md` conventions.
- [ ] **Step 3: Verify (live)** — create a throwaway published Pro test with a speaking question; Playwright: load it, grant mic (or stub), confirm the recorder renders and "Recorded ✓" appears after a (stubbed) record; `execute_sql` shows a grade row. Delete throwaway.
- [ ] **Step 4: Commit** — `git commit -m "speaking: QuestionRenderer branch + styling"`

---

## Phase 3 — Builder

### Task 8: SpeakingSettings + wiring + Pro-gate

**Files:** Create `settings/SpeakingSettings.tsx`; modify `SettingsPanel.tsx`, `questionTypeMeta.ts`, `TestBuilder.tsx`, `publish/route.ts`.

- [ ] **Step 1:** `SpeakingSettings.tsx` — rubric editor (add/remove rows: `text` input + `weight` number) using `_shared` primitives; `maxRecordingSeconds` field. `onChange({ ...q, options: { rubric, maxRecordingSeconds } })`.
- [ ] **Step 2:** Dispatch line in `SettingsPanel.tsx`; icon+label in `questionTypeMeta.ts`; default in `TestBuilder.addQuestion` (`{ rubric: [{ id: crypto.randomUUID(), text: '', weight: 1 }], maxRecordingSeconds: 30 }`).
- [ ] **Step 3: Pro-gate** — in `TestBuilder` add-menu, mark "Speaking" Pro (disabled + paywall hint when `!hasActiveSubscription`); in `publish/route.ts`, if the test has any `speaking` question and owner is not Pro → 402 `speaking_requires_pro`.
- [ ] **Step 4: Verify** — `npm run build`; (logged-in spot-check is the user's, like the rest of the builder).
- [ ] **Step 5: Commit** — `git commit -m "speaking: builder rubric editor + Pro-gate"`

---

## Phase 4 — Results (teacher)

### Task 9: ResponsesTable speaking display

**Files:** Modify `ResponsesTable.tsx`; the owner responses route (`src/app/api/tests/[id]/responses/route.ts`) to also return `speaking_grades` for the test's responses.

- [ ] **Step 1:** Responses route: load `test_speaking_grades` for the response ids; return `{ ..., speaking_grades }`. Generate a **signed URL** for each `audio_url` (private bucket, 1h) for playback.
- [ ] **Step 2:** `ResponsesTable`: inside each expanded response, for each speaking question render an `<audio controls src={signedUrl}>`, the transcript, the per-criterion breakdown (✓/~/✗ + note), and **"earned / max"** — visually distinct as a **separate "Speaking" block**, not part of the objective score. Optional summary card: average speaking score.
- [ ] **Step 3: Verify** — `npm run build`; user spot-checks the authenticated results view.
- [ ] **Step 4: Commit** — `git commit -m "speaking: teacher results display (audio + transcript + breakdown)"`

### Task 10: Docs

- [ ] **Step 1:** Update `src/components/test/CLAUDE.md` (new question type + its own grading track + `test_speaking_grades` + `test-recordings` bucket + Pro-gate/guardrails) and the memory file. Commit.

---

## Self-Review

- **Spec coverage:** rubric authoring (T8), per-criterion scoring (T4), any-language STT+judge (T4/T5 lang hint), exam-style no-feedback (T6), keep recording (T5 upload + T9 playback), grade-on-record (T5/T6), Pro-only+guardrails (T5/T8), separate score / objective untouched (T3 + T9). All covered.
- **Placeholders:** none — code given for the non-obvious pieces; UI tasks reference concrete existing patterns (`SpeakingMashq` recorder, `_shared` settings primitives, `audio-consumed` guard).
- **Type consistency:** `SpeakingOptions.rubric` / `SpeakingRubricCriterion` / `RubricResult` used consistently across T2/T4/T5/T8; answer value `{ recorded: true }` consistent across T3/T6/T7.
- **Risk note:** the only edit to existing scoring is T3 returning `null` for speaking — confirmed sufficient by how `summarizeSectionScores` + the responses total already drop `null`.
