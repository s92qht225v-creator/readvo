import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadDialogue, loadDialoguesForBook, resolveDialogueVocab } from '@/services';
import { DialogueReader } from '@/components/DialogueReader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';
import { stripPinyinTones } from '@/utils/rubyText';

export const revalidate = 3600; // hourly ISR refresh (glossary edits also revalidate via tag)

interface PageParams {
  params: Promise<{
    locale: string;
    dialogueId: string;
  }>;
}

export async function generateStaticParams() {
  const dialogues = await loadDialoguesForBook('hsk5');
  return dialogues.map((d) => ({ dialogueId: d.slug }));
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, dialogueId } = await params;
  const dialogue = await loadDialogue('hsk5', dialogueId);

  const translation = dialogue
    ? locale === 'ru' ? dialogue.titleTranslation_ru
    : locale === 'en' ? (dialogue.titleTranslation_en || dialogue.titleTranslation)
    : dialogue.titleTranslation
    : '';

  const hanzi = dialogue ? dialogue.title.replace(/[？！。，、；：""''（）…—]+/g, '') : '';
  const flatPinyin = dialogue ? stripPinyinTones(dialogue.pinyin) : '';

  const dialogueLabel = ({ uz: 'Xitoy tili dialogi', ru: 'Диалог китайского языка', en: 'Chinese Dialogue' } as Record<string, string>)[locale] || 'Chinese Dialogue';

  return {
    title: dialogue
      ? `${hanzi} ${flatPinyin} — "${translation}" ${dialogueLabel} | HSK 5`
      : ({ uz: 'HSK 5 xitoy tili dialogi', ru: 'Диалог HSK 5 китайского языка', en: 'HSK 5 Chinese Dialogue' } as Record<string, string>)[locale] || 'HSK 5 xitoy tili dialogi',
    description: dialogue
      ? ({
          uz: `HSK 5 xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}. Pinyin va tarjima bilan o\'qing.`,
          ru: `Диалог китайского языка HSK 5: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation_ru}. Читайте с пиньинь и переводом.`,
          en: `HSK 5 Chinese dialogue: ${dialogue.title} (${dialogue.pinyin}) — ${translation}. Read with pinyin and translation.`,
        } as Record<string, string>)[locale] || `HSK 5 xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}.`
      : ({ uz: 'HSK 5 xitoy tili dialoglari — pinyin va tarjima bilan.', ru: 'Диалоги HSK 5 с пиньинь и переводом.', en: 'HSK 5 Chinese dialogues with pinyin and translation.' } as Record<string, string>)[locale] || 'HSK 5 xitoy tili dialoglari — pinyin va tarjima bilan.',
    alternates: dialogue ? {
      canonical: `/${locale}/chinese/hsk5/dialogues/${dialogueId}`,
      languages: {
        uz: `/uz/chinese/hsk5/dialogues/${dialogueId}`,
        ru: `/ru/chinese/hsk5/dialogues/${dialogueId}`,
        en: `/en/chinese/hsk5/dialogues/${dialogueId}`,
        'x-default': `/uz/chinese/hsk5/dialogues/${dialogueId}`,
      },
    } : undefined,
  };
}

export default async function DialoguePage({ params }: PageParams) {
  const { locale, dialogueId } = await params;
  setRequestLocale(locale);

  const raw = await loadDialogue('hsk5', dialogueId);

  if (!raw) {
    notFound();
  }
  const dialogue = await resolveDialogueVocab(raw);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';
  const translation = locale === 'ru' ? dialogue.titleTranslation_ru
    : locale === 'en' ? (dialogue.titleTranslation_en || dialogue.titleTranslation)
    : dialogue.titleTranslation;
  const dialoguesLabel = ({ uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' } as Record<string, string>)[locale] || 'Dialogues';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: dialoguesLabel, path: `/${locale}/chinese?tab=dialogues&dialhsk=5` },
      { name: `${dialogue.title} — ${translation}`, path: `/${locale}/chinese/hsk5/dialogues/${dialogueId}` },
    ]),
    {
      '@type': 'LearningResource',
      name: `${dialogue.title} (${dialogue.pinyin}) — ${translation}`,
      description: `HSK 5 Chinese dialogue: ${dialogue.title} — ${translation}`,
      educationalLevel: 'HSK 5',
      learningResourceType: 'Dialogue',
      inLanguage: 'zh',
      url: `${siteUrl}/${locale}/chinese/hsk5/dialogues/${dialogueId}`,
      provider: { '@type': 'Organization', name: 'Blim' },
    },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <DialogueReader dialogue={dialogue} bookPath="/chinese/hsk5" listPath="/chinese?tab=dialogues&dialhsk=5" />
    </>
  );
}
