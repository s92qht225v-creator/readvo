import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { loadDialogue, loadDialoguesForBook } from '@/services';
import { DialogueReader } from '@/components/DialogueReader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';
import { stripPinyinTones } from '@/utils/rubyText';

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

  // Strip Chinese punctuation from title for cleaner display (e.g., 你叫什么名字？ → 你叫什么名字)
  const hanzi = dialogue ? dialogue.title.replace(/[？！。，、；：""''（）…—]+/g, '') : '';
  const flatPinyin = dialogue ? stripPinyinTones(dialogue.pinyin) : '';

  const dialogueLabel = ({ uz: 'Xitoy tili dialogi', ru: 'Диалог китайского языка', en: 'Chinese Dialogue' } as Record<string, string>)[locale] || 'Chinese Dialogue';

  return {
    title: dialogue
      ? `${hanzi} ${flatPinyin} — "${translation}" ${dialogueLabel} | HSK 1`
      : ({ uz: 'HSK 1 xitoy tili dialogi', ru: 'Диалог HSK 1 китайского языка', en: 'HSK 1 Chinese Dialogue' } as Record<string, string>)[locale] || 'HSK 1 xitoy tili dialogi',
    description: dialogue
      ? ({
          uz: `HSK 1 xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}. Pinyin, audio va tarjima bilan tinglang va o\'qing.`,
          ru: `Диалог китайского языка HSK 1: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation_ru}. Слушайте и читайте с пиньинь и переводом.`,
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';
  const translation = locale === 'ru' ? dialogue.titleTranslation_ru
    : locale === 'en' ? (dialogue.titleTranslation_en || dialogue.titleTranslation)
    : dialogue.titleTranslation;
  const dialoguesLabel = ({ uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' } as Record<string, string>)[locale] || 'Dialogues';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese` },
      { name: dialoguesLabel, path: `/${locale}/chinese?tab=dialogues` },
      { name: `${dialogue.title} — ${translation}`, path: `/${locale}/chinese/hsk1/dialogues/${dialogueId}` },
    ]),
    {
      '@type': 'LearningResource',
      name: `${dialogue.title} (${dialogue.pinyin}) — ${translation}`,
      description: `HSK 1 Chinese dialogue: ${dialogue.title} — ${translation}`,
      educationalLevel: 'HSK 1',
      learningResourceType: 'Dialogue',
      inLanguage: 'zh',
      url: `${siteUrl}/${locale}/chinese/hsk1/dialogues/${dialogueId}`,
      provider: { '@type': 'Organization', name: 'Blim' },
    },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <DialogueReader dialogue={dialogue} bookPath="/chinese/hsk1" listPath="/chinese?tab=dialogues" />
    </>
  );
}
