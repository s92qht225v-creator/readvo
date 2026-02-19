import { notFound } from 'next/navigation';
import { loadDialogue } from '@/services';
import { StoryReader } from '@/components/StoryReader';

interface PageParams {
  params: Promise<{
    dialogueId: string;
  }>;
}

export async function generateMetadata({ params }: PageParams) {
  const { dialogueId } = await params;
  const dialogue = await loadDialogue('hsk1', dialogueId);

  return {
    title: dialogue
      ? `${dialogue.title} - HSK 1 Dialoglar - Blim`
      : 'Dialog - Blim',
  };
}

export default async function DialoguePage({ params }: PageParams) {
  const { dialogueId } = await params;
  const dialogue = await loadDialogue('hsk1', dialogueId);

  if (!dialogue) {
    notFound();
  }

  return <StoryReader story={dialogue} bookPath="/chinese/hsk1" listPath="/chinese/hsk1/dialogues" />;
}
