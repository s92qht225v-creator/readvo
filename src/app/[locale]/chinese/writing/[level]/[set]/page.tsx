import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { resolveWritingSet, WRITING_ROUTE_PARAMS } from '@/services/writing';
import { WritingPracticePage } from './WritingPracticePage';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface Props {
  params: Promise<{ locale: string; level: string; set: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return WRITING_ROUTE_PARAMS;
}

export async function generateMetadata({ params }: Props) {
  const { locale, level, set } = await params;
  const writingSet = resolveWritingSet(level, set);
  if (!writingSet) return {};
  const num = set.replace('set', '');
  const pageMeta: Record<string, { title: string; description: string }> = {
    uz: {
      title: `${writingSet.title} — Yozish mashqi`,
      description: `${writingSet.subtitle}. Xitoy ierogliflarini yozishni mashq qiling.`,
    },
    ru: {
      title: `${writingSet.title_ru} — Практика письма`,
      description: `${writingSet.subtitle_ru}. Практика написания китайских иероглифов.`,
    },
    en: {
      title: `Set ${num} — Writing Practice`,
      description: `${writingSet.subtitle.replace(/ta so'z/, 'words')}. Practice writing Chinese characters.`,
    },
  };
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/writing/${level}/${set}`,
      languages: {
        uz: `/uz/chinese/writing/${level}/${set}`,
        ru: `/ru/chinese/writing/${level}/${set}`,
        en: `/en/chinese/writing/${level}/${set}`,
        'x-default': `/uz/chinese/writing/${level}/${set}`,
      },
    },
  };
}

export default async function WritingSetPage({ params }: Props) {
  const { locale, level, set } = await params;
  setRequestLocale(locale);

  const writingSet = resolveWritingSet(level, set);
  if (!writingSet) notFound();

  const num = set.replace('set', '');
  const writingLabel = ({ uz: 'Yozish', ru: 'Письмо', en: 'Writing' } as Record<string, string>)[locale] || 'Writing';
  const setTitle = locale === 'ru' ? writingSet.title_ru : locale === 'en' ? `Set ${num}` : writingSet.title;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese/dialogues` },
      { name: writingLabel, path: `/${locale}/chinese/writing` },
      { name: setTitle, path: `/${locale}/chinese/writing/${level}/${set}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <WritingPracticePage
        setId={writingSet.id}
        level={level}
        title={writingSet.title}
        title_ru={writingSet.title_ru}
        words={writingSet.words}
      />
    </>
  );
}
