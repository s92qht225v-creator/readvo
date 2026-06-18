import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadArabicDialogue, listArabicDialogues } from '@/services/arabicContent';
import { ArabicDialogueReader } from '@/components/reader/ArabicDialogueReader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

// Green browser chrome (address bar) on Arabic pages, matching the banner.
export const viewport: Viewport = { themeColor: '#2E8B57' };

interface PageParams {
  params: Promise<{ locale: string; level: string; slug: string }>;
}

export async function generateStaticParams() {
  return listArabicDialogues();
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, level, slug } = await params;
  const d = loadArabicDialogue(level, slug);
  if (!d) return {};
  const tr = locale === 'ru' ? d.titleTranslation_ru : locale === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;
  return {
    title: `${d.title} (${d.translit}) — "${tr}" · ${level.toUpperCase()} Arabic`,
    description: ({
      uz: `Arab tili dialogi: ${d.title} — ${tr}. Harakat va transliteratsiya bilan o'qing.`,
      ru: `Диалог на арабском: ${d.title} — ${tr}. Читайте с огласовками и транслитерацией.`,
      en: `Arabic dialogue: ${d.title} — ${tr}. Read with harakat and transliteration.`,
    } as Record<string, string>)[locale],
    alternates: {
      canonical: `/${locale}/arabic/dialogues/${level}/${slug}`,
      languages: {
        uz: `/uz/arabic/dialogues/${level}/${slug}`,
        ru: `/ru/arabic/dialogues/${level}/${slug}`,
        en: `/en/arabic/dialogues/${level}/${slug}`,
        'x-default': `/uz/arabic/dialogues/${level}/${slug}`,
      },
    },
  };
}

export default async function ArabicDialoguePage({ params }: PageParams) {
  const { locale, level, slug } = await params;
  setRequestLocale(locale);
  const d = loadArabicDialogue(level, slug);
  if (!d) notFound();

  const tr = locale === 'ru' ? d.titleTranslation_ru : locale === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/dialogues` },
      { name: `${d.title} — ${tr}`, path: `/${locale}/arabic/dialogues/${level}/${slug}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ArabicDialogueReader
        meta={{
          level: d.level, slug: d.id,
          title: d.title, translit: d.translit,
          titleTranslation_uz: d.titleTranslation_uz,
          titleTranslation_ru: d.titleTranslation_ru,
          titleTranslation_en: d.titleTranslation_en,
        }}
      />
    </>
  );
}
