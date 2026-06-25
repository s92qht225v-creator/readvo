import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCardState, schedule, isDue, DEFAULT_EASE } from './srs.ts';

const T0 = new Date('2026-01-01T00:00:00.000Z');
const daysBetween = (a: string, b: Date) => Math.round((new Date(a).getTime() - b.getTime()) / 86_400_000);

test('new card is due immediately', () => {
  const s = newCardState(T0);
  assert.equal(s.reps, 0);
  assert.equal(s.intervalDays, 0);
  assert.ok(isDue(s, T0));
});

test('good progression: 1 -> 3 -> 8 days', () => {
  let s = newCardState(T0);
  s = schedule(s, 'good', T0);
  assert.equal(s.reps, 1);
  assert.equal(s.intervalDays, 1);
  assert.equal(daysBetween(s.dueAt, T0), 1);

  s = schedule(s, 'good', T0);
  assert.equal(s.intervalDays, 3);

  s = schedule(s, 'good', T0);
  assert.equal(s.intervalDays, Math.round(3 * DEFAULT_EASE)); // 8
});

test('easy on a new card gives a longer first interval and raises ease', () => {
  const s = schedule(newCardState(T0), 'easy', T0);
  assert.equal(s.intervalDays, 4);
  assert.ok(s.ease > DEFAULT_EASE);
});

test('again on a learned card lapses, resets reps, lowers ease, due now', () => {
  let s = newCardState(T0);
  s = schedule(s, 'good', T0); // reps 1
  s = schedule(s, 'good', T0); // reps 2
  const before = s.ease;
  s = schedule(s, 'again', T0);
  assert.equal(s.reps, 0);
  assert.equal(s.lapses, 1);
  assert.ok(s.ease < before);
  assert.equal(s.intervalDays, 0);
  assert.ok(isDue(s, T0));
});

test('again on a brand-new card is not counted as a lapse', () => {
  const s = schedule(newCardState(T0), 'again', T0);
  assert.equal(s.lapses, 0);
  assert.equal(s.reps, 0);
});

test('ease never drops below the floor', () => {
  let s = newCardState(T0);
  for (let i = 0; i < 20; i++) s = schedule(s, 'again', T0);
  assert.ok(s.ease >= 1.3);
});

test('isDue is false before dueAt, true at/after', () => {
  const s = schedule(newCardState(T0), 'good', T0); // due +1 day
  assert.equal(isDue(s, T0), false);
  assert.equal(isDue(s, new Date('2026-01-02T00:00:00.000Z')), true);
});
