'use client';

import { Field } from './_shared';

export function LongAnswerSettings() {
  return (
    <Field label="Answer">
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        Long answer is collected for review. It is not auto-graded.
      </div>
    </Field>
  );
}
