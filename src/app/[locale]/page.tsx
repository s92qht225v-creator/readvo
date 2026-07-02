import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';

export const revalidate = 3600; // re-render at most once per hour

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: 'Xitoy tilini onlayn o\'rganing',
    description: 'Xitoy va Arab tillarini onlayn o\'rganing: HSK 1-6 dialoglar, audio, pinyin, fleshkartalar, ieroglif yozish va karaoke. 7 kun bepul sinab ko\'ring!',
  },
  ru: {
    title: 'Изучайте китайский онлайн',
    description: 'Изучайте китайский и арабский онлайн: диалоги HSK 1-6 с аудио и пиньинь, флешкарты, написание иероглифов и караоке. 7 дней бесплатно!',
  },
  en: {
    title: 'Learn Chinese Online',
    description: 'Learn Chinese and Arabic online: HSK 1-6 dialogues with audio and pinyin, flashcards, character writing practice and karaoke. Try 7 days free!',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { uz: '/uz', ru: '/ru', en: '/en', 'x-default': '/uz' },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const m = pageMeta[locale] || pageMeta.uz;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Blim',
        url: siteUrl,
        description: m.description,
        inLanguage: locale,
      },
      {
        '@type': 'Organization',
        name: 'Blim',
        url: siteUrl,
        logo: `${siteUrl}/logo.svg`,
      },
    ],
  };

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
