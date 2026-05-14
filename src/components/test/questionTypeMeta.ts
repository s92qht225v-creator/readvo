import type { QuestionType } from '@/lib/test/types';

export const typePalette: Record<QuestionType, { bg: string; color: string }> = {
  multiple_choice: { bg: '#ede9fe', color: '#7c3aed' },
  picture_choice: { bg: '#dcfce7', color: '#15803d' },
  short_text: { bg: '#dbeafe', color: '#1d4ed8' },
  long_answer: { bg: '#e0f2fe', color: '#0369a1' },
  number: { bg: '#fef3c7', color: '#a16207' },
  dropdown: { bg: '#ede9fe', color: '#6d28d9' },
  checkbox: { bg: '#f3e8ff', color: '#7e22ce' },
  opinion_scale: { bg: '#ecfccb', color: '#4d7c0f' },
  rating: { bg: '#fef9c3', color: '#ca8a04' },
  true_false: { bg: '#fee2e2', color: '#b91c1c' },
  match: { bg: '#fef3c7', color: '#b45309' },
  ordering: { bg: '#cffafe', color: '#0e7490' },
  fill_blanks: { bg: '#fce7f3', color: '#be185d' },
  scramble: { bg: '#e0e7ff', color: '#4338ca' },
};
