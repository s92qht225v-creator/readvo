import { Suspense } from 'react';
import { LanguagePage } from '@/components/LanguagePage';

export default function ChinesePage() {
  return (
    <Suspense>
      <LanguagePage />
    </Suspense>
  );
}
