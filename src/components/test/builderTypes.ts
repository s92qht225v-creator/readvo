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
  /** Optional FK to `test_sections.id` — null/undefined = unsectioned.
   *  Sent back to the server on `PUT /api/tests/[id]/questions` so the
   *  question's section membership is preserved across saves. */
  section_id?: string | null;
}
