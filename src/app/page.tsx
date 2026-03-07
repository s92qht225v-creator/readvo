import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'Xitoy tili o\'rganish — HSK 1-6 darslari, dialoglar, karaoke | Blim',
  description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul boshlang! | Изучайте китайский: HSK 1-6, флешкарты, караоке.',
  alternates: { canonical: '/' },
};

export default function Page() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}
