import { getEnglishLessonsWithInfo } from '@/services/english-content';
import { BookPage } from '@/components/BookPage';

export const metadata = {
  title: 'Destination B1 - Blim',
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
