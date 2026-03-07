import { notFound } from 'next/navigation';
import { WRITING_SETS, getWritingSet } from '@/services/writing';
import { WritingPracticePage } from './WritingPracticePage';

interface Props {
  params: { setId: string };
}

export async function generateMetadata({ params }: Props) {
  const set = getWritingSet(params.setId);
  if (!set) return {};
  return {
    title: `${set.title} — Yozish mashqi`,
    description: `${set.subtitle}. Xitoy ierogliflarini yozishni mashq qiling. | ${set.subtitle_ru}. Практика написания китайских иероглифов.`,
  };
}

export async function generateStaticParams() {
  return WRITING_SETS.map((s) => ({ setId: s.id }));
}

export default async function WritingSetPage({ params }: Props) {
  const set = getWritingSet(params.setId);
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
