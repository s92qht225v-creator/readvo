import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'Xitoy tilini onlayn o\'rganing | Blim.uz',
  description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul boshlang! | Изучайте китайский: HSK 1-6, флешкарты, караоке.',
  alternates: { canonical: '/' },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Blim',
      url: siteUrl,
      description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika.',
      inLanguage: ['uz', 'ru'],
    },
    {
      '@type': 'Organization',
      name: 'Blim',
      url: siteUrl,
      logo: `${siteUrl}/logo.svg`,
    },
  ],
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
