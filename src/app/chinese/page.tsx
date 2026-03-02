import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LanguagePage } from '@/components/LanguagePage';

export const metadata: Metadata = {
  title: 'Xitoy tili darsliklari',
  description: 'HSK 1-6 darajali xitoy tili darsliklari, fleshkartalar, hikoyalar, dialoglar va karaoke.',
};

export default function ChinesePage() {
  return (
    <Suspense>
      <LanguagePage />
    </Suspense>
  );
}
