import { notFound } from 'next/navigation';
import { loadStory } from '@/services';
import { StoryReader } from '@/components/StoryReader';

interface PageParams {
  params: Promise<{
    storyId: string;
  }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { storyId } = await params;
  const story = await loadStory('hsk2', storyId);

  return {
    title: story
      ? `${story.title} — HSK 2 hikoyalar`
      : 'Hikoya',
    description: story
      ? `HSK 2 xitoy tili hikoyasi: ${story.title}. O'qish va tinglash mashqi.`
      : 'HSK 2 xitoy tili hikoyasi.',
  };
}

export default async function StoryPage({ params }: PageParams) {
  const { storyId } = await params;
  const story = await loadStory('hsk2', storyId);

  if (!story) {
    notFound();
  }

  return <StoryReader story={story} bookPath="/chinese/hsk2" listPath="/chinese?tab=stories" />;
}
