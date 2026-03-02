import type { Metadata } from 'next';
import { loadStoriesForBook } from '@/services';
import { StoriesPage } from '@/components/StoriesPage';

export const metadata: Metadata = {
  title: 'HSK 2 — Hikoyalar',
  description: 'HSK 2 darajali xitoy tili hikoyalari. O\'qish va tinglash mashqlari.',
};

export default async function HSK2StoriesPage() {
  const stories = await loadStoriesForBook('hsk2');

  return (
    <StoriesPage
      stories={stories}
      bookPath="/chinese/hsk2"
      languagePath="/chinese?tab=stories"
    />
  );
}
