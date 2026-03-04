import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LanguagePage } from '@/components/LanguagePage';
import { loadDialoguesForBook } from '@/services/dialogues';
import { loadStoriesForBook } from '@/services/stories';

export const metadata: Metadata = {
  title: 'Xitoy tili darsliklari',
  description: 'HSK 1-6 darajali xitoy tili darsliklari, fleshkartalar, hikoyalar, dialoglar va karaoke.',
};

export default async function ChinesePage() {
  const [dialogues, stories] = await Promise.all([
    loadDialoguesForBook('hsk1'),
    loadStoriesForBook('hsk2'),
  ]);

  return (
    <Suspense>
      <LanguagePage dialogues={dialogues} stories={stories} />
    </Suspense>
  );
}
