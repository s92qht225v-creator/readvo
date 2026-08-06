import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { loadHskLessons, listHskBooks, listHskLevels } from '@/services/hsk';
import { HskLessonList } from '@/components/HskLessonList';

export const revalidate = 3600;

interface PageParams {
  params: Promise<{ locale: string; book: string; level: string }>;
}

export async function generateStaticParams() {
  const out: { book: string; level: string }[] = [];
  for (const book of listHskBooks()) {
    for (const level of listHskLevels(book)) out.push({ book, level });
  }
  return out;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, book, level } = await params;
  const lessons = loadHskLessons(book, level);
  if (lessons.length === 0) return {};
  const t = ({
    uz: `HSK ${level} — ${lessons[0].bookTitle} darslari o'zbek tilida`,
    ru: `HSK ${level} — уроки ${lessons[0].bookTitle} на русском`,
    en: `HSK ${level} — ${lessons[0].bookTitle} lessons`,
  } as Record<string, string>)[locale];
  return {
    title: t,
    description: ({
      uz: `HSK ${level} darsliklari: ${lessons.length} ta dars, matnlar, yangi so'zlar, audio va mashqlar bilan.`,
      ru: `Уроки HSK ${level}: ${lessons.length} уроков с текстами, новыми словами, аудио и упражнениями.`,
      en: `HSK ${level} lessons: ${lessons.length} units with texts, new words, audio and exercises.`,
    } as Record<string, string>)[locale],
    // Unlinked while the course is being authored — reviewable by URL, not
    // discoverable. Drop this (and add the sitemap entry) when it goes live.
    robots: { index: false, follow: false },
  };
}

export default async function HskLevelPage({ params }: PageParams) {
  const { locale, book, level } = await params;
  setRequestLocale(locale);
  const lessons = loadHskLessons(book, level);
  if (lessons.length === 0) notFound();
  return <HskLessonList lessons={lessons} book={book} level={level} />;
}
