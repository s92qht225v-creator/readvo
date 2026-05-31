import OpenAI from 'openai';
import type { SpeakingRubricCriterion } from '@/lib/test/types';

/**
 * Rubric judge for the `speaking` question type. Takes a transcript of the
 * student's spoken reply and scores it against the teacher's rubric — one
 * verdict per criterion (full / partial / none → points). Separate from the
 * scripted `scorer.ts` (which matches against an exact expected answer).
 */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CriterionVerdict {
  id: string;
  verdict: 'full' | 'partial' | 'none';
  earned: number;
  note: string;
}

export interface RubricResult {
  criteria: CriterionVerdict[];
  score: number;
  maxScore: number;
  feedback: string;
}

/** Build the deterministic max score (sum of weights). Exported so callers
 *  can store/display max_score even when grading fails. */
export function rubricMaxScore(rubric: SpeakingRubricCriterion[]): number {
  return rubric.reduce((s, c) => s + (Number.isFinite(c.weight) ? c.weight : 1), 0);
}

/**
 * Grade `transcript` against `rubric`. `langLabel` is the human-readable
 * language name (e.g. "Chinese", "English") so notes + feedback come back in
 * the test's language. Never throws — on any failure returns a zero result
 * with a graceful feedback message.
 */
export async function judgeRubric(
  transcript: string,
  rubric: SpeakingRubricCriterion[],
  langLabel: string,
  question?: string,
): Promise<RubricResult> {
  const maxScore = rubricMaxScore(rubric);

  const sys =
    `You grade a student's spoken reply (given as a transcript) to a question, against a rubric. ` +
    `Judge the reply AS AN ANSWER TO THAT QUESTION: whether it is relevant/on-topic, and whether its ` +
    `grammar and tense fit what the question asks (e.g. a present-habit question like "What time do you ` +
    `usually get up?" should be answered in the present, so a past-tense reply is a grammar/relevance error). ` +
    `For each rubric criterion, decide whether the reply satisfies it: "full", "partial", or "none". ` +
    `Be fair: judge meaning, not exact wording. ` +
    `Respond with ONLY a JSON object of the shape ` +
    `{"criteria":[{"id":string,"verdict":"full"|"partial"|"none","note":string}],"feedback":string}. ` +
    `Each "note" briefly justifies the verdict for that criterion. ` +
    `IMPORTANT: write every "note" and the overall "feedback" in ${langLabel} only.`;
  const user = JSON.stringify({
    question: question ?? '',
    transcript,
    rubric: rubric.map(c => ({ id: c.id, text: c.text, weight: c.weight })),
  });

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}') as {
      criteria?: { id?: string; verdict?: string; note?: string }[];
      feedback?: string;
    };
    const byId = new Map((parsed.criteria ?? []).map(c => [c.id, c]));
    const criteria: CriterionVerdict[] = rubric.map(c => {
      const raw = byId.get(c.id);
      const verdict: CriterionVerdict['verdict'] =
        raw?.verdict === 'full' ? 'full' : raw?.verdict === 'partial' ? 'partial' : 'none';
      const w = Number.isFinite(c.weight) ? c.weight : 1;
      const earned = verdict === 'full' ? w : verdict === 'partial' ? w / 2 : 0;
      return { id: c.id, verdict, earned, note: String(raw?.note ?? '') };
    });
    const score = criteria.reduce((s, c) => s + c.earned, 0);
    return { criteria, score, maxScore, feedback: String(parsed.feedback ?? '') };
  } catch {
    return {
      criteria: rubric.map(c => ({ id: c.id, verdict: 'none' as const, earned: 0, note: '' })),
      score: 0,
      maxScore,
      feedback: 'Could not grade this answer automatically.',
    };
  }
}
