import type { Metadata, Viewport } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { ArabicStoryCatalog } from '@/components/catalog/ArabicStoryCatalog';
import { loadArabicStoryCatalog } from '@/services/arabicContent';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

// Green browser chrome (address bar) on Arabic pages, matching the banner.
export const viewport: Viewport = { themeColor: '#2E8B57' };

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Arab tili hikoyalari — A1-C2', description: 'Arab tilida hikoyalar: harakat, transliteratsiya, audio va tarjima. Tez kunda!' },
  ru: { title: 'Истории на арабском — A1-C2', description: 'Истории на арабском: огласовки, транслитерация, аудио и перевод. Скоро!' },
  en: { title: 'Arabic Stories — A1-C2', description: 'Arabic stories with harakat, transliteration, audio and translation. Coming soon!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/arabic/story`,
      languages: {
        uz: '/uz/arabic/story',
        ru: '/ru/arabic/story',
        en: '/en/arabic/story',
        'x-default': '/uz/arabic/story',
      },
    },
  };
}

export default async function ArabicStoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const catalog = loadArabicStoryCatalog();
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const storiesLabel = ({ uz: 'Hikoyalar', ru: 'Истории', en: 'Stories' } as Record<string, string>)[locale] || 'Stories';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: homeLabel, path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic` },
      { name: storiesLabel, path: `/${locale}/arabic/story` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense>
        <ArabicStoryCatalog catalog={catalog} />
      </Suspense>
    </>
  );
}
