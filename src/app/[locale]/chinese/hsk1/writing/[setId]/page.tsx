import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { WRITING_SETS, getWritingSet } from '@/services/writing';
import { WritingPracticePage } from './WritingPracticePage';

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
      title: `Set ${set.id.replace('hsk1-set', '')} — Writing Practice`,
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
  return WRITING_SETS.map((s) => ({ setId: s.id }));
}

export default async function WritingSetPage({ params }: Props) {
  const { locale, setId } = await params;
  setRequestLocale(locale);

  const set = getWritingSet(setId);
  if (!set) notFound();

  return (
    <WritingPracticePage
      setId={set.id}
      title={set.title}
      title_ru={set.title_ru}
      words={set.words}
    />
  );
}
