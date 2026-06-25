// Spaced-repetition scheduler (SM-2 variant) for flashcards.
//
// Pure and side-effect-free: every function takes the current card state + a
// `now` Date and returns the next state. No DB, no globals — so it's trivially
// testable and identical on server and client. Persistence lives in the API
// layer; the deck UI calls `schedule()` on each grade and saves the result.

export type Grade = 'again' | 'good' | 'easy';

export interface CardState {
  reps: number;          // consecutive successful reviews (resets to 0 on "again")
  lapses: number;        // times forgotten after having been learned
  ease: number;          // ease factor (higher = intervals grow faster)
  intervalDays: number;  // current interval in whole days
  dueAt: string;         // ISO timestamp the card next becomes due
}

export const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 2.7;
const MAX_INTERVAL = 365;
const DAY_MS = 86_400_000;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const addDays = (now: Date, days: number) => new Date(now.getTime() + days * DAY_MS).toISOString();

/** State for a card the learner has never seen — due immediately. */
export function newCardState(now: Date = new Date()): CardState {
  return { reps: 0, lapses: 0, ease: DEFAULT_EASE, intervalDays: 0, dueAt: now.toISOString() };
}

/** Apply a grade and return the next state (with a fresh dueAt). */
export function schedule(state: CardState, grade: Grade, now: Date = new Date()): CardState {
  let { reps, lapses, ease, intervalDays } = state;

  if (grade === 'again') {
    // Forgetting a learned card is a lapse; failing a brand-new card is not.
    if (reps > 0) lapses += 1;
    reps = 0;
    ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
    intervalDays = 0; // due again right away (re-queued this session, due today next time)
  } else {
    if (reps === 0) {
      intervalDays = grade === 'easy' ? 4 : 1;          // first success
    } else if (reps === 1) {
      intervalDays = grade === 'easy' ? 6 : 3;          // second success
    } else {
      const mult = grade === 'easy' ? ease * 1.3 : ease;
      intervalDays = Math.round(intervalDays * mult);   // mature card
    }
    if (grade === 'easy') ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
    intervalDays = Math.min(intervalDays, MAX_INTERVAL);
    reps += 1;
  }

  return { reps, lapses, ease, intervalDays, dueAt: addDays(now, intervalDays) };
}

/** Is the card due for review at `now`? */
export function isDue(state: CardState, now: Date = new Date()): boolean {
  return new Date(state.dueAt).getTime() <= now.getTime();
}
