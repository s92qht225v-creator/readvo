import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { KaraokeCatalog } from '@/components/catalog/KaraokeCatalog';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const meta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy qo\'shiqlari — KTV karaoke', description: 'Xitoycha qo\'shiqlar bilan o\'rganing: sinxron matn, pinyin va tarjima.' },
  ru: { title: 'Китайские песни — KTV караоке', description: 'Учите китайский по песням: синхронный текст, пиньинь и перевод.' },
  en: { title: 'Chinese Songs — KTV Karaoke', description: 'Learn Chinese with songs: synced lyrics, pinyin and translation.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/karaoke`,
      languages: {
        uz: '/uz/chinese/karaoke',
        ru: '/ru/chinese/karaoke',
        en: '/en/chinese/karaoke',
        'x-default': '/uz/chinese/karaoke',
      },
    },
  };
}

export default async function ChineseKaraokePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const sectionLabel = ({ uz: 'Qo\'shiqlar', ru: 'Песни', en: 'Songs' } as Record<string, string>)[locale] || 'Songs';
  const jsonLd = jsonLdScript([breadcrumbJsonLd([
    { name: homeLabel, path: `/${locale}` },
    { name: 'Chinese', path: `/${locale}/chinese` },
    { name: sectionLabel, path: `/${locale}/chinese/karaoke` },
  ])]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense><KaraokeCatalog /></Suspense>
    </>
  );
}
