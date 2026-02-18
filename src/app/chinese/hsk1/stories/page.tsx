import { loadStoriesForBook } from '@/services';
import { StoriesPage } from '@/components/StoriesPage';

export default async function HSK1StoriesPage() {
  const stories = await loadStoriesForBook('hsk1');

  return (
    <StoriesPage
      stories={stories}
      bookPath="/chinese/hsk1"
      languagePath="/chinese?tab=stories"
    />
  );
}
