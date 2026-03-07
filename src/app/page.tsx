import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'Xitoy tili o\'rganish — HSK 1-6 darslari, dialoglar, karaoke | Blim',
  description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul sinab ko\'ring! O\'zbekcha va ruscha tarjimalar. | Учите китайский язык онлайн: HSK 1-6 диалоги, флешкарты, караоке и грамматика. Бесплатный пробный период!',
};

export default function Page() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}
