import { loadStoriesForBook } from '@/services';
import { StoriesPage } from '@/components/StoriesPage';

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
