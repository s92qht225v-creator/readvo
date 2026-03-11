import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadDialogue, loadDialoguesForBook } from '@/services';
import { DialogueReader } from '@/components/DialogueReader';

interface PageParams {
  params: Promise<{
    locale: string;
    dialogueId: string;
  }>;
}

export async function generateStaticParams() {
  const dialogues = await loadDialoguesForBook('hsk1');
  return dialogues.map((d) => ({ dialogueId: d.slug }));
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, dialogueId } = await params;
  const dialogue = await loadDialogue('hsk1', dialogueId);

  const translation = dialogue
    ? locale === 'ru' ? dialogue.titleTranslation_ru
    : locale === 'en' ? (dialogue.titleTranslation_en || dialogue.titleTranslation)
    : dialogue.titleTranslation
    : '';

  const titleLabel = ({ uz: 'dialog', ru: 'диалог', en: 'dialogue' } as Record<string, string>)[locale] || 'dialog';

  return {
    title: dialogue
      ? `${dialogue.title} — ${translation} | HSK 1 ${titleLabel}`
      : ({ uz: 'HSK 1 xitoy tili dialogi', ru: 'Диалог HSK 1 китайского языка', en: 'HSK 1 Chinese Dialogue' } as Record<string, string>)[locale] || 'HSK 1 xitoy tili dialogi',
    description: dialogue
      ? ({
          uz: `HSK 1 xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}. Pinyin, audio va tarjima bilan tinglang va o'qing.`,
          ru: `Диалог HSK 1: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation_ru}. Слушайте и читайте с пиньинь и переводом.`,
          en: `HSK 1 Chinese dialogue: ${dialogue.title} (${dialogue.pinyin}) — ${translation}. Listen and read with pinyin and translation.`,
        } as Record<string, string>)[locale] || `HSK 1 xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}.`
      : ({ uz: 'HSK 1 xitoy tili dialoglari — pinyin va tarjima bilan.', ru: 'Диалоги HSK 1 с пиньинь и переводом.', en: 'HSK 1 Chinese dialogues with pinyin and translation.' } as Record<string, string>)[locale] || 'HSK 1 xitoy tili dialoglari — pinyin va tarjima bilan.',
    alternates: dialogue ? {
      canonical: `/${locale}/chinese/hsk1/dialogues/${dialogueId}`,
      languages: {
        uz: `/uz/chinese/hsk1/dialogues/${dialogueId}`,
        ru: `/ru/chinese/hsk1/dialogues/${dialogueId}`,
        en: `/en/chinese/hsk1/dialogues/${dialogueId}`,
        'x-default': `/uz/chinese/hsk1/dialogues/${dialogueId}`,
      },
    } : undefined,
  };
}

export default async function DialoguePage({ params }: PageParams) {
  const { locale, dialogueId } = await params;
  setRequestLocale(locale);

  const dialogue = await loadDialogue('hsk1', dialogueId);

  if (!dialogue) {
    notFound();
  }

  return <DialogueReader dialogue={dialogue} bookPath="/chinese/hsk1" listPath="/chinese?tab=dialogues" />;
}
