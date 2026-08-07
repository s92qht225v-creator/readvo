import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getHskGrammar, loadHskLessons, listHskBooks, listHskLevels } from '@/services/hsk';
import { HskGrammar } from '@/components/HskGrammar';

export const revalidate = 3600;

interface PageParams {
  params: Promise<{ locale: string; book: string; level: string; lesson: string; point: string }>;
}

export async function generateStaticParams() {
  const out: { book: string; level: string; lesson: string; point: string }[] = [];
  for (const book of listHskBooks()) {
    for (const level of listHskLevels(book)) {
      for (const l of loadHskLessons(book, level)) {
        for (const g of l.grammar ?? []) out.push({ book, level, lesson: l.slug, point: g.slug });
      }
    }
  }
  return out;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, book, level, lesson, point } = await params;
  const found = getHskGrammar(book, level, lesson, point);
  if (!found) return {};
  // The point's own label — not every page under /grammar/ is 语法; 比一比
  // comparison sections live here too and shouldn't be titled "grammar".
  const label = (locale === 'ru' ? found.point.labelTranslation_ru
    : locale === 'en' ? found.point.labelTranslation_en
    : found.point.labelTranslation) || found.point.labelTranslation;
  return {
    title: `${found.point.title} — HSK ${level} ${label}`,
    description: `${found.lesson.bookTitle} HSK ${level}, ${found.lesson.unit}: ${found.point.title} (${found.point.pinyin})`,
    // Unlinked while the course is authored — see the level page.
    robots: { index: false, follow: false },
  };
}

export default async function HskGrammarPage({ params }: PageParams) {
  const { locale, book, level, lesson, point } = await params;
  setRequestLocale(locale);
  const found = getHskGrammar(book, level, lesson, point);
  if (!found) notFound();
  return (
    <HskGrammar
      lesson={found.lesson}
      point={found.point}
      backHref={`/hsk/${book}/${level}`}
    />
  );
}
