import type { Metadata } from 'next';
import { getLessonsWithInfo } from '@/services';
import { BookPage } from '@/components/BookPage';

export const metadata: Metadata = {
  title: 'HSK 1 — Darslar',
  description: 'HSK 1 darajali xitoy tili darsliklari. 15 ta dars, har birida dialog, lug\'at, grammatika va mashqlar.',
};

/**
 * HSK 1 Book page - shows available lessons with visual cards.
 * Server component loads data, client BookPage handles UI + language toggle.
 */
export default async function HSK1BookPage() {
  const lessons = await getLessonsWithInfo();

  return <BookPage lessons={lessons} bookPath="/chinese/hsk1" languagePath="/chinese" />;
}
