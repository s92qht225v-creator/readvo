import { notFound } from 'next/navigation';
import { loadDialogue, loadDialoguesForBook } from '@/services';
import { DialogueReader } from '@/components/DialogueReader';

interface PageParams {
  params: Promise<{
    dialogueId: string;
  }>;
}

export async function generateStaticParams() {
  const dialogues = await loadDialoguesForBook('hsk1');
  return dialogues.map((d) => ({ dialogueId: d.slug }));
}

export async function generateMetadata({ params }: PageParams) {
  const { dialogueId } = await params;
  const dialogue = await loadDialogue('hsk1', dialogueId);

  return {
    title: dialogue
      ? `${dialogue.title} — ${dialogue.titleTranslation} | HSK 1 dialog`
      : 'HSK 1 xitoy tili dialogi',
    description: dialogue
      ? `HSK 1 xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}. Pinyin, audio va tarjima bilan tinglang va o'qing. | Диалог HSK 1: ${dialogue.titleTranslation_ru}. Слушайте и читайте с пиньинь и переводом.`
      : 'HSK 1 xitoy tili dialoglari — pinyin va tarjima bilan. | Диалоги HSK 1 с пиньинь и переводом.',
    alternates: dialogue ? { canonical: `/chinese/hsk1/dialogues/${dialogueId}` } : undefined,
  };
}

export default async function DialoguePage({ params }: PageParams) {
  const { dialogueId } = await params;
  const dialogue = await loadDialogue('hsk1', dialogueId);

  if (!dialogue) {
    notFound();
  }

  return <DialogueReader dialogue={dialogue} bookPath="/chinese/hsk1" listPath="/chinese?tab=dialogues" />;
}
