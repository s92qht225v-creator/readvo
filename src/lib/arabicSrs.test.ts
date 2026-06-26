import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleArabic } from './arabicSrs';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const days = (from: Date, iso: string) => Math.round((new Date(iso).getTime() - from.getTime()) / 86_400_000);

test('new card: "I know" → 4 days', () => {
  const s = scheduleArabic(null, 'know', NOW);
  assert.equal(s.intervalDays, 4);
  assert.equal(days(NOW, s.dueAt), 4);
  assert.equal(s.reps, 1);
});

test('new card: "I don\'t know" → 1 day', () => {
  const s = scheduleArabic(null, 'dontKnow', NOW);
  assert.equal(s.intervalDays, 1);
  assert.equal(days(NOW, s.dueAt), 1);
});

test('"I know" grows ×2.5: 4 → 10 → 25', () => {
  const a = scheduleArabic({ intervalDays: 4, reps: 1 }, 'know', NOW);
  assert.equal(a.intervalDays, 10);
  const b = scheduleArabic({ intervalDays: 10, reps: 2 }, 'know', NOW);
  assert.equal(b.intervalDays, 25);
});

test('"I don\'t know" always resets to 1 day', () => {
  const s = scheduleArabic({ intervalDays: 25, reps: 3 }, 'dontKnow', NOW);
  assert.equal(s.intervalDays, 1);
});

test('"I know" right after a reset goes back to 4 days', () => {
  const s = scheduleArabic({ intervalDays: 1, reps: 4 }, 'know', NOW);
  assert.equal(s.intervalDays, 4);
});

test('interval is capped at 365 days', () => {
  const s = scheduleArabic({ intervalDays: 300, reps: 9 }, 'know', NOW);
  assert.equal(s.intervalDays, 365);
});
