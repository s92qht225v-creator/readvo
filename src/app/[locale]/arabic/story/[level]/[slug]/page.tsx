import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadArabicStory, listArabicStories } from '@/services/arabicContent';
import { ArabicDialogueReader } from '@/components/reader/ArabicDialogueReader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

// Green browser chrome (address bar) on Arabic pages, matching the banner.
export const viewport: Viewport = { themeColor: '#2E8B57' };

interface PageParams {
  params: Promise<{ locale: string; level: string; slug: string }>;
}

export async function generateStaticParams() {
  return listArabicStories();
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, level, slug } = await params;
  const d = loadArabicStory(level, slug);
  if (!d) return {};
  const tr = locale === 'ru' ? d.titleTranslation_ru : locale === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;
  return {
    title: `${d.title} (${d.translit}) — "${tr}" · ${level.toUpperCase()} Arabic`,
    description: ({
      uz: `Arab tili hikoyasi: ${d.title} — ${tr}. Harakat va transliteratsiya bilan o'qing.`,
      ru: `Рассказ на арабском: ${d.title} — ${tr}. Читайте с огласовками и транслитерацией.`,
      en: `Arabic story: ${d.title} — ${tr}. Read with harakat and transliteration.`,
    } as Record<string, string>)[locale],
    alternates: {
      canonical: `/${locale}/arabic/story/${level}/${slug}`,
      languages: {
        uz: `/uz/arabic/story/${level}/${slug}`,
        ru: `/ru/arabic/story/${level}/${slug}`,
        en: `/en/arabic/story/${level}/${slug}`,
        'x-default': `/uz/arabic/story/${level}/${slug}`,
      },
    },
  };
}

export default async function ArabicStoryPage({ params }: PageParams) {
  const { locale, level, slug } = await params;
  setRequestLocale(locale);
  const d = loadArabicStory(level, slug);
  if (!d) notFound();

  const tr = locale === 'ru' ? d.titleTranslation_ru : locale === 'en' ? d.titleTranslation_en : d.titleTranslation_uz;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Arabic', path: `/${locale}/arabic/story` },
      { name: `${d.title} — ${tr}`, path: `/${locale}/arabic/story/${level}/${slug}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ArabicDialogueReader
        meta={{
          kind: 'story',
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
