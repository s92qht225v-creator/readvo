import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { WRITING_SETS, WRITING_SETS_HSK2, WRITING_SETS_HSK2_L2, WRITING_SETS_HSK3, getWritingSet } from '@/services/writing';
import { WritingPracticePage } from './WritingPracticePage';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

interface Props {
  params: Promise<{ locale: string; setId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale, setId } = await params;
  const set = getWritingSet(setId);
  if (!set) return {};
  const pageMeta: Record<string, { title: string; description: string }> = {
    uz: {
      title: `${set.title} — Yozish mashqi`,
      description: `${set.subtitle}. Xitoy ierogliflarini yozishni mashq qiling.`,
    },
    ru: {
      title: `${set.title_ru} — Практика письма`,
      description: `${set.subtitle_ru}. Практика написания китайских иероглифов.`,
    },
    en: {
      title: `Set ${set.id.replace(/hsk\d+-set/, '')} — Writing Practice`,
      description: `${set.subtitle.replace(/ta so'z/, 'words')}. Practice writing Chinese characters.`,
    },
  };
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/writing/${setId}`,
      languages: {
        uz: `/uz/chinese/hsk1/writing/${setId}`,
        ru: `/ru/chinese/hsk1/writing/${setId}`,
        en: `/en/chinese/hsk1/writing/${setId}`,
        'x-default': `/uz/chinese/hsk1/writing/${setId}`,
      },
    },
  };
}

export async function generateStaticParams() {
  return [...WRITING_SETS, ...WRITING_SETS_HSK2, ...WRITING_SETS_HSK2_L2, ...WRITING_SETS_HSK3].map((s) => ({ setId: s.id }));
}

export default async function WritingSetPage({ params }: Props) {
  const { locale, setId } = await params;
  setRequestLocale(locale);

  const set = getWritingSet(setId);
  if (!set) notFound();

  const writingLabel = ({ uz: 'Yozish', ru: 'Письмо', en: 'Writing' } as Record<string, string>)[locale] || 'Writing';
  const setTitle = locale === 'ru' ? set.title_ru : locale === 'en' ? `Set ${set.id.replace(/hsk\d+-set/, '')}` : set.title;
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: writingLabel, path: `/${locale}/chinese?tab=writing` },
      { name: setTitle, path: `/${locale}/chinese/hsk1/writing/${setId}` },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <WritingPracticePage
        setId={set.id}
        title={set.title}
        title_ru={set.title_ru}
        words={set.words}
      />
    </>
  );
}
