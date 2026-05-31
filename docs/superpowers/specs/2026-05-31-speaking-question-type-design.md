# Speaking Question Type — Design Spec

**Date:** 2026-05-31
**Status:** Approved design, pending implementation plan
**Surface:** test-app (test.blim.uz)

## Summary

A new **`speaking`** question type for the test builder. A student reads
and/or hears a prompt, records an open-ended spoken reply, and the AI
transcribes it and scores it against a teacher-authored **rubric**. The
speaking score is reported **separately** from the test's objective score
(two scores side by side) — the existing objective scoring is untouched.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Grading model | **Open-ended reply** (not scripted "say this exact line") |
| Language | **Any** — the test's language (STT + judge get a language hint) |
| Grading basis | **Rubric** — teacher lists key-point criteria, each with a weight |
| Scoring | **Per-criterion** — AI marks each met / partial / none → points |
| Feedback timing | **Exam-style** — student records & moves on; no live feedback |
| Keep audio? | **Yes** — store the recording for review/appeals |
| Grading timing | **Grade-on-record (background)** — graded when the student finishes each recording, not at submit |
| Access | **Pro-only** owners + guardrails |
| **Score integration** | **Separate score** — speaking is NOT merged into the objective auto-total (this removes all risk to existing scoring) |

## Why "separate score" (the key simplification)

The only risky part of an integrated design was folding partial speaking
points into the test's objective total, which would mean rewriting the
boolean→points scoring rollup (`responses` route, `summarizeSectionScores`,
the done-screen total — all recently built). We avoid this entirely:

- `gradeAnswer()` returns `null` for `speaking` (not objective-gradable), so
  speaking is **automatically excluded** from the objective total and from
  `summarizeSectionScores` (which already drops `null`-graded questions).
- Speaking results live on their **own track** (a dedicated table) and are
  shown as their **own score** in results.

Result: a graded test reports e.g. "Objective: 8/10" and, per speaking
question, "Speaking: 4/5 + breakdown." The teacher combines them if they
want. Zero changes to existing scoring code.

## Data model

**Question type** (`src/lib/test/types.ts`): add `'speaking'` to the
Builder/Public question unions.
```ts
SpeakingOptions = {
  rubric: { id: string; text: string; weight: number }[]; // weight default 1
  maxRecordingSeconds: number;                              // default 30
}
// max speaking points = sum of rubric[].weight
```
Prompt text + optional audio reuse the existing per-question media — no new
authoring system.

**New table `test_speaking_grades`** (the speaking track):
```
response_id   uuid   (FK test_responses, cascade)
question_id   uuid   (FK test_questions)
audio_url     text   (private bucket path)
transcript    text
score         numeric
max_score     numeric
detail        jsonb  ({ criteria: [{ id, text, weight, verdict: 'full'|'partial'|'none', earned, note }], feedback })
created_at    timestamptz
PRIMARY KEY (response_id, question_id)   -- idempotent, one grading per question per respondent
+ RLS (owner reads for their tests; service-role writes)
```
No changes to `test_answers` or its scoring columns. Speaking answers do not
produce an objective `is_correct` row.

**New private bucket `test-recordings`** for the audio (voice data → private,
served to the owner via signed URL in results).

## Grading pipeline (server)

**New endpoint `POST /api/t/[slug]/speaking-grade`** — anonymous,
respondent-token gated (same pattern as `audio-consumed`/`session`). Body:
`{ respondent_token, response_id, question_id, audio (blob) }`.

Steps:
1. **Guardrails** (reject early): owner is Pro; per-test daily grading cap
   not exceeded; `(response_id, question_id)` not already graded (idempotent).
2. Upload the audio to `test-recordings` (private).
3. **STT** — reuse `src/lib/transcribe/whisper.ts`, passing the test's
   language as a hint (Chinese tuning only applies when language is Chinese).
4. **Rubric judge** — NEW `src/lib/transcribe/rubricJudge.ts`: GPT-4o-mini,
   temperature 0, JSON output. Input: transcript, rubric criteria, language.
   Output: per-criterion `{ verdict: full|partial|none, earned, note }`,
   total earned score, overall feedback (in the test's language).
5. Write the `test_speaking_grades` row.

This is **separate** from the existing scripted `scorer.ts`.

## Player

New `QuestionRenderer` branch for `speaking`:
- Renders the prompt (text + optional audio via existing media block).
- A **mic record button** (reuse the MediaRecorder pattern from
  `SpeakingMashq`), a max-`maxRecordingSeconds` countdown, **one attempt**
  (button locks after recording).
- On stop → POST to `/api/t/[slug]/speaking-grade` (audio) → background; UI
  shows **"Recorded ✓"**. No score/feedback shown (exam-style).
- The answer value stored in the normal answer flow is minimal
  (`{ recorded: true }`); the real result lives in `test_speaking_grades`.
- **Required-question guard**: a speaking question counts as "answered" once
  a recording has been made — `hasAnswer()` (`grade.ts`) recognizes
  `{ recorded: true }` for `speaking`, so a `required` speaking question
  blocks submit until recorded, like any other required question.

## Builder

- `settings/SpeakingSettings.tsx`: rubric editor (add/remove criteria rows,
  each `text` + `weight`) + max-seconds field.
- Wire into `SettingsPanel` dispatch + `questionTypeMeta` (icon/label) +
  `addQuestion` default.
- **Pro-gate**: adding a speaking question and publishing a test containing
  one require an active subscription (reuse the existing subscription check +
  `PaywallNotice` pattern).

## Results (teacher) — two scores side by side

In `ResponsesTable.tsx`:
- The existing objective summary/score is unchanged.
- New: per response, each speaking question shows an **audio player** (signed
  URL to the recording), the **transcript**, the **per-criterion breakdown**
  (✓ full / ~ partial / ✗ none + note), and **"earned / max"**.
- Optional summary card: average speaking score across responses (separate
  from the objective average).

**Student done screen:** unchanged (objective score only if revealed;
speaking is exam-style, not shown to the student).

## Guardrails (cost/abuse)

- **Pro-only** (builder add + publish check).
- **Recording cap** (`maxRecordingSeconds`, default 30) enforced client +
  server.
- **One graded attempt** per question per respondent (idempotent PK on
  `test_speaking_grades`; player locks after recording).
- **Per-test daily grading cap** (count `test_speaking_grades` per test per
  day; reject over cap with a friendly "try later" message).

## Question-type recipe touch points (per test/CLAUDE.md)

1. `lib/test/types.ts` — `SpeakingOptions`/`PublicSpeakingOptions` + union.
2. `settings/SpeakingSettings.tsx` — rubric editor.
3. `SettingsPanel.tsx` — dispatch line.
4. `QuestionRenderer.tsx` — `speaking` branch (the recorder).
5. `tq-options.css` — `--speaking-*` tokens for the recorder UI.
6. `questionTypeMeta.ts` + `TestBuilder.addQuestion` default.
Plus: `grade.ts` (`gradeAnswer` returns `null` for speaking), migration
(`test_speaking_grades` + `test-recordings` bucket), `speaking-grade` route,
`rubricJudge.ts`, `ResponsesTable` speaking display, Pro-gate.

## Suggested phases (for the implementation plan)

1. **Data + grading core**: migration (table + bucket), `rubricJudge.ts`,
   `speaking-grade` endpoint + guardrails. Verifiable via the API directly.
2. **Player**: the recorder question type (record → upload → background grade).
3. **Builder**: rubric editor + Pro-gate.
4. **Results**: teacher-side speaking display (audio + transcript + breakdown).

## Out of scope (v1)

- Merging speaking points into one blended test total (possible contained v2
  later, on top of a proven v1).
- Async job queue for grading (grade-on-record is sufficient at expected
  volumes; revisit only if tests carry many speaking questions).
- Languages beyond what Whisper/GPT-4o-transcribe support out of the box.
