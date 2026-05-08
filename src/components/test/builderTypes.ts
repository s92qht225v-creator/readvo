import type { QuestionOptions, QuestionType } from '@/lib/test/types';

export interface BuilderQuestion {
  clientId: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOptions;
  required: boolean;
}
