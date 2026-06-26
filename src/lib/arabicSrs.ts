/**
 * Arabic flashcard spaced-repetition scheduler (2-grade).
 *
 * Far simpler than the Chinese SM-2 (`src/lib/srs.ts`): there are only two
 * grades — the learner self-reports "I know" or "I don't know".
 *
 *   - "I don't know"  → always repeat in 1 day (reset).
 *   - "I know"        → first time (or right after a reset) repeat in 4 days,
 *                       then grow ×2.5 each subsequent "I know" (capped 365d).
 *
 * The third deck action ("move to back of the stack") is a session-only
 * re-queue and does NOT call this scheduler.
 */

export type ArabicGrade = 'know' | 'dontKnow';

export interface ArabicSchedule {
  intervalDays: number;
  reps: number;
  dueAt: string; // ISO
}

const DAY_MS = 86_400_000;
const MAX_DAYS = 365;
const KNOW_BASE = 4;
const KNOW_FACTOR = 2.5;

/** Compute the next schedule from the previous state (null = brand-new card). */
export function scheduleArabic(
  prev: { intervalDays: number; reps: number } | null,
  grade: ArabicGrade,
  now: Date,
): ArabicSchedule {
  let intervalDays: number;
  if (grade === 'dontKnow') {
    intervalDays = 1;
  } else if (!prev || prev.intervalDays < KNOW_BASE) {
    // New card, or one just reset by "I don't know" → first "I know" = 4 days.
    intervalDays = KNOW_BASE;
  } else {
    intervalDays = Math.min(MAX_DAYS, Math.round(prev.intervalDays * KNOW_FACTOR));
  }
  return {
    intervalDays,
    reps: (prev?.reps ?? 0) + 1,
    dueAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
  };
}
