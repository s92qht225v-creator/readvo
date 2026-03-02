import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'Blim — Interaktiv til o\'rganish',
  description: 'Xitoy va ingliz tillarini interaktiv darsliklar, fleshkartalar, hikoyalar va karaoke orqali o\'rganing. O\'zbek tilidagi tarjimalar bilan.',
};

export default function Page() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}
