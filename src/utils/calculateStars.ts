import type { Score } from '@/components/SpeakingMashq';

/**
 * Calculate star rating (0-3) from speaking quiz results.
 *
 * 3 stars: all correct on first attempt, no shadowing
 * 2 stars: max 1 wrong, no shadowing
 * 1 star:  completed (at least 1 correct)
 * 0 stars: no correct answers
 */
export function calculateStars(scores: Score[], shadowingUsed: boolean): number {
  const total = scores.length;
  const correct = scores.filter(s => s === 'correct').length;

  if (correct === total && !shadowingUsed) return 3;
  if (correct >= total - 1 && !shadowingUsed) return 2;
  if (correct > 0) return 1;
  return 0;
}
