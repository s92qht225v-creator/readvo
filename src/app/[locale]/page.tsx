import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: 'Xitoy tilini onlayn o\'rganing',
    description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul boshlang!',
  },
  ru: {
    title: 'Изучайте китайский онлайн',
    description: 'Изучайте китайский онлайн: HSK 1-6 диалоги, флешкарты, караоке и грамматика. Начните бесплатно!',
  },
  en: {
    title: 'Learn Chinese Online',
    description: 'Learn Chinese online: HSK 1-6 dialogues, flashcards, karaoke and grammar. Start for free!',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Blim',
      url: siteUrl,
      description: 'Learn Chinese online: HSK 1-6 dialogues, flashcards, karaoke and grammar.',
      inLanguage: ['uz', 'ru', 'en'],
    },
    {
      '@type': 'Organization',
      name: 'Blim',
      url: siteUrl,
      logo: `${siteUrl}/logo.svg`,
    },
  ],
};

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

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
