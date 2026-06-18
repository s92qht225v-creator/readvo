import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { ArabicDialoguesCatalog } from '@/components/catalog/ArabicDialoguesCatalog';
import { loadArabicDialogueCatalog } from '@/services/arabicContent';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Arab tili dialoglari — A1-C2', description: 'Arab tili dialoglari: harakat, transliteratsiya, audio va tarjima. Bepul boshlang!' },
  ru: { title: 'Диалоги на арабском — A1-C2', description: 'Диалоги на арабском: огласовки, транслитерация, аудио и перевод. Начните бесплатно!' },
  en: { title: 'Arabic Dialogues — A1-C2', description: 'Arabic dialogues with harakat, transliteration, audio and translation. Start free!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/arabic/dialogues`,
      languages: {
        uz: '/uz/arabic/dialogues',
        ru: '/ru/arabic/dialogues',
        en: '/en/arabic/dialogues',
        'x-default': '/uz/arabic/dialogues',
      },
    },
  };
}

export default async function ArabicDialoguesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const catalog = loadArabicDialogueCatalog();
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const dialoguesLabel = ({ uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' } as Record<string, string>)[locale] || 'Dialogues';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: homeLabel, path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic` },
      { name: dialoguesLabel, path: `/${locale}/arabic/dialogues` },
    ]),
    {
      '@type': 'Course',
      name: 'Arabic (MSA)',
      description: (pageMeta[locale] || pageMeta.uz).description,
      provider: { '@type': 'Organization', name: 'Blim' },
      inLanguage: 'ar',
      educationalLevel: 'Beginner',
    },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense>
        <ArabicDialoguesCatalog catalog={catalog} />
      </Suspense>
    </>
  );
}
