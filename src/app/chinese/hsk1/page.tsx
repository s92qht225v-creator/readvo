import { getLessonsWithInfo } from '@/services';
import { BookPage } from '@/components/BookPage';

/**
 * HSK 1 Book page - shows available lessons with visual cards.
 * Server component loads data, client BookPage handles UI + language toggle.
 */
export default async function HSK1BookPage() {
  const lessons = await getLessonsWithInfo();

  return <BookPage lessons={lessons} bookPath="/chinese/hsk1" />;
}
