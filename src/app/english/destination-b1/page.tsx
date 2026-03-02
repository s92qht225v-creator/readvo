import type { Metadata } from 'next';
import { getEnglishLessonsWithInfo } from '@/services/english-content';
import { BookPage } from '@/components/BookPage';

export const metadata: Metadata = {
  title: 'Destination B1 — Ingliz tili grammatikasi',
  description: 'Destination B1 ingliz tili grammatika darsligi. Unit-lar bo\'yicha mashqlar va tushuntirishlar.',
};

const tabConfig = [
  { id: 'destination-b1', label: 'B1', hasContent: true },
  { id: 'destination-b2', label: 'B2', hasContent: false },
];

export default async function DestinationB1Page() {
  const lessons = await getEnglishLessonsWithInfo('destination-b1');

  return (
    <BookPage
      lessons={lessons}
      bookPath="/english/destination-b1"
      languagePath="/english"
      tabConfig={tabConfig}
      unitLabel="Unit"
    />
  );
}
