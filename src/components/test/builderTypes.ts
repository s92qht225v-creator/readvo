import type { QuestionOptions, QuestionType } from '@/lib/test/types';

export interface BuilderQuestion {
  clientId: string;
  type: QuestionType;
  prompt: string;
  options: QuestionOptions;
  required: boolean;
  /** Author-side toggle: hidden questions are kept in the builder
   *  but skipped in the public player. Defaults to false. */
  hidden?: boolean;
}
