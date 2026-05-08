import type {
  TestQuestion, AnswerSubmission,
  MultipleChoiceOptions, ShortTextOptions, PictureChoiceOptions,
  TrueFalseOptions, MatchOptions, OrderingOptions, FillBlanksOptions,
  LongAnswerOptions, NumberOptions, DropdownOptions, CheckboxOptions,
  OpinionScaleOptions, RatingOptions,
} from './types';
import { publicOptionId } from './sanitize';

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Grade a single answer against the canonical question. Returns null when
 * the question is not gradable (no correct answer set).
 */
export function gradeAnswer(question: TestQuestion, value: AnswerSubmission['value']): boolean | null {
  if (question.type === 'multiple_choice' || question.type === 'picture_choice') {
    const opts = question.options as MultipleChoiceOptions | PictureChoiceOptions;
    const correctIndexes = opts.allowMultiple
      ? (opts.correctIndexes ?? (opts.correctIndex != null ? [opts.correctIndex] : []))
      : (opts.correctIndex != null ? [opts.correctIndex] : []);
    if (correctIndexes.length === 0) return null;

    const submittedIndexes = submittedChoiceIndexes(question.id, value);
    if (submittedIndexes.length === 0) return false;
    if (!opts.allowMultiple) {
      return submittedIndexes.length === 1 && submittedIndexes[0] === correctIndexes[0];
    }

    const a = [...new Set(submittedIndexes)].sort((x, y) => x - y);
    const b = [...new Set(correctIndexes)].sort((x, y) => x - y);
    return a.length === b.length && a.every((idx, i) => idx === b[i]);
  }
  if (question.type === 'short_text') {
    const opts = question.options as ShortTextOptions;
    const corrects = opts.correctAnswers ?? [];
    if (corrects.length === 0) return null;
    const text = (value.text ?? '').toString();
    const submitted = norm(text);
    return corrects.some(c => norm(c) === submitted);
  }
  if (question.type === 'long_answer') {
    return null;
  }
  if (question.type === 'number') {
    const opts = question.options as NumberOptions;
    if (opts.correctValue == null || !Number.isFinite(opts.correctValue)) return null;
    const submitted = Number(value.text);
    if (!Number.isFinite(submitted)) return false;
    return submitted === opts.correctValue;
  }
  if (question.type === 'dropdown') {
    const opts = question.options as DropdownOptions;
    if (opts.correctIndex == null) return null;
    const submitted = submittedChoiceIndexes(question.id, value);
    return submitted.length === 1 && submitted[0] === opts.correctIndex;
  }
  if (question.type === 'checkbox') {
    const opts = question.options as CheckboxOptions;
    const correctIndexes = opts.correctIndexes ?? [];
    if (correctIndexes.length === 0) return null;
    const submitted = submittedChoiceIndexes(question.id, value);
    const a = [...new Set(submitted)].sort((x, y) => x - y);
    const b = [...new Set(correctIndexes)].sort((x, y) => x - y);
    return a.length === b.length && a.every((idx, i) => idx === b[i]);
  }
  if (question.type === 'opinion_scale' || question.type === 'rating') {
    return null;
  }
  if (question.type === 'true_false') {
    const opts = question.options as TrueFalseOptions;
    if (opts.correct == null) return null;
    return typeof value.bool === 'boolean' && value.bool === opts.correct;
  }
  if (question.type === 'match') {
    const opts = question.options as MatchOptions;
    const pairs = opts.pairs ?? [];
    if (pairs.length === 0) return null;
    const submitted = submittedMatchPairs(question.id, value, pairs.length);
    if (submitted.size !== pairs.length) return false;
    return pairs.every((_, i) => submitted.get(i) === publicOptionId(question.id, 'match-right', i));
  }
  if (question.type === 'ordering') {
    const opts = question.options as OrderingOptions;
    const items = opts.items ?? [];
    if (items.length === 0) return null;
    const order = value.order;
    if (!Array.isArray(order) || order.length !== items.length) return false;
    return order.every((v, i) => v === publicOptionId(question.id, 'ordering', i));
  }
  if (question.type === 'fill_blanks') {
    const opts = question.options as FillBlanksOptions;
    const blanks = opts.blanks ?? [];
    if (blanks.length === 0) return null;
    const submitted = value.blanks;
    if (!Array.isArray(submitted) || submitted.length !== blanks.length) return false;
    return submitted.every((s, i) => {
      const expected = blanks[i];
      if (!expected) return false;
      const subN = norm(s ?? '');
      if (norm(expected.answer) === subN) return true;
      return (expected.alternates ?? []).some(a => norm(a) === subN);
    });
  }
  return null;
}

/** Whether a submission counts as "answered" for required-question checks. */
export function hasAnswer(question: TestQuestion, value: AnswerSubmission['value'] | undefined): boolean {
  if (!value) return false;
  if (question.type === 'multiple_choice' || question.type === 'picture_choice') {
    return typeof value.selected === 'number' && value.selected >= 0
      || typeof value.selectedId === 'string' && value.selectedId.length > 0
      || Array.isArray(value.selectedIds) && value.selectedIds.length > 0;
  }
  if (question.type === 'short_text' || question.type === 'long_answer' || question.type === 'number') {
    return !!value.text && value.text.trim().length > 0;
  }
  if (question.type === 'dropdown') {
    return typeof value.selectedId === 'string' && value.selectedId.length > 0;
  }
  if (question.type === 'checkbox') {
    return Array.isArray(value.selectedIds) && value.selectedIds.length > 0;
  }
  if (question.type === 'opinion_scale') {
    const opts = question.options as OpinionScaleOptions;
    return typeof value.selected === 'number' && value.selected >= opts.min && value.selected <= opts.max;
  }
  if (question.type === 'rating') {
    const opts = question.options as RatingOptions;
    return typeof value.selected === 'number' && value.selected >= 1 && value.selected <= opts.max;
  }
  if (question.type === 'true_false') {
    return typeof value.bool === 'boolean';
  }
  if (question.type === 'match') {
    const opts = question.options as MatchOptions;
    const need = (opts.pairs ?? []).length;
    return submittedMatchPairs(question.id, value, need).size === need;
  }
  if (question.type === 'ordering') {
    const opts = question.options as OrderingOptions;
    const need = (opts.items ?? []).length;
    return Array.isArray(value.order) && value.order.length === need
      && value.order.every(v => typeof v === 'string' && v.length > 0);
  }
  if (question.type === 'fill_blanks') {
    const opts = question.options as FillBlanksOptions;
    const need = (opts.blanks ?? []).length;
    return Array.isArray(value.blanks)
      && value.blanks.length === need
      && value.blanks.every(s => typeof s === 'string' && s.trim().length > 0);
  }
  return false;
}

function submittedChoiceIndexes(questionId: string, value: AnswerSubmission['value']): number[] {
  if (typeof value.selected === 'number') return [value.selected];
  if (typeof value.selectedId === 'string') {
    const idx = choiceIdToIndex(questionId, value.selectedId);
    return idx == null ? [] : [idx];
  }
  if (Array.isArray(value.selectedIds)) {
    return value.selectedIds.flatMap(id => {
      const idx = choiceIdToIndex(questionId, id);
      return idx == null ? [] : [idx];
    });
  }
  return [];
}

function choiceIdToIndex(questionId: string, id: string): number | null {
  for (let i = 0; i < 100; i++) {
    if (publicOptionId(questionId, 'choice', i) === id) return i;
  }
  return null;
}

function submittedMatchPairs(
  questionId: string,
  value: AnswerSubmission['value'],
  pairCount: number,
): Map<number, string> {
  const validRightIds = new Set(
    Array.from({ length: pairCount }, (_, i) => publicOptionId(questionId, 'match-right', i)),
  );
  const rawPairs = Array.isArray(value.pairs)
    ? value.pairs
    : (value.matches ?? []).map((rightId, leftIndex) => ({ leftIndex, rightId }));
  const submitted = new Map<number, string>();
  const usedRightIds = new Set<string>();

  for (const pair of rawPairs) {
    if (!Number.isInteger(pair.leftIndex) || pair.leftIndex < 0 || pair.leftIndex >= pairCount) continue;
    if (typeof pair.rightId !== 'string' || !validRightIds.has(pair.rightId)) continue;
    if (submitted.has(pair.leftIndex) || usedRightIds.has(pair.rightId)) continue;
    submitted.set(pair.leftIndex, pair.rightId);
    usedRightIds.add(pair.rightId);
  }

  return submitted;
}
