import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'Xitoy tili o\'rganish — HSK 1-6 darslari, dialoglar, karaoke | Blim',
  description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul boshlang! | Изучайте китайский: HSK 1-6, флешкарты, караоке.',
  alternates: { canonical: '/' },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Blim',
  url: siteUrl,
  description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  inLanguage: ['uz', 'ru'],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <HomePage />
      </Suspense>
    </>
  );
}
