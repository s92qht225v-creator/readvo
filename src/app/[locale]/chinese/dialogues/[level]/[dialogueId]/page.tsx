import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getDialogue, loadDialoguesForBook, resolveDialogueVocab } from '@/services';
import { buildDialoguePreview } from '@/services/dialoguePreview';
import { DialogueReader } from '@/components/DialogueReader';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';
import { stripPinyinTones } from '@/utils/rubyText';

export const revalidate = 3600; // hourly ISR refresh (glossary edits also revalidate via tag)

const LEVELS = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
const VALID_LEVELS = new Set(LEVELS);

interface PageParams {
  params: Promise<{ locale: string; level: string; dialogueId: string }>;
}

export async function generateStaticParams() {
  const out: { level: string; dialogueId: string }[] = [];
  for (const level of LEVELS) {
    const dialogues = await loadDialoguesForBook(level);
    for (const d of dialogues) out.push({ level, dialogueId: d.slug });
  }
  return out;
}

export async function generateMetadata({ params }: PageParams) {
  const { locale, level, dialogueId } = await params;
  if (!VALID_LEVELS.has(level)) return {};
  const num = level.replace('hsk', '');
  const dialogue = await getDialogue(level, dialogueId);

  const translation = dialogue
    ? locale === 'ru' ? dialogue.titleTranslation_ru
    : locale === 'en' ? (dialogue.titleTranslation_en || dialogue.titleTranslation)
    : dialogue.titleTranslation
    : '';
  const hanzi = dialogue ? dialogue.title.replace(/[？！。，、；：""''（）…—]+/g, '') : '';
  const flatPinyin = dialogue ? stripPinyinTones(dialogue.pinyin) : '';
  const dialogueLabel = ({ uz: 'Xitoy tili dialogi', ru: 'Диалог китайского языка', en: 'Chinese Dialogue' } as Record<string, string>)[locale] || 'Chinese Dialogue';
  // Prefer a hand-written SEO description for this dialogue when present.
  const customDescription = dialogue
    ? (locale === 'ru' ? dialogue.description_ru
      : locale === 'en' ? (dialogue.description_en || dialogue.description_uz)
      : dialogue.description_uz)
    : undefined;

  return {
    title: dialogue
      ? `${hanzi} ${flatPinyin} — "${translation}" ${dialogueLabel} | HSK ${num}`
      : ({ uz: `HSK ${num} xitoy tili dialogi`, ru: `Диалог HSK ${num} китайского языка`, en: `HSK ${num} Chinese Dialogue` } as Record<string, string>)[locale] || `HSK ${num} xitoy tili dialogi`,
    description: customDescription
      ? customDescription
      : dialogue
      ? ({
          uz: `HSK ${num} xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}. Pinyin va tarjima bilan o'qing.`,
          ru: `Диалог китайского языка HSK ${num}: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation_ru}. Читайте с пиньинь и переводом.`,
          en: `HSK ${num} Chinese dialogue: ${dialogue.title} (${dialogue.pinyin}) — ${translation}. Read with pinyin and translation.`,
        } as Record<string, string>)[locale] || `HSK ${num} xitoy tili dialogi: ${dialogue.title} (${dialogue.pinyin}) — ${dialogue.titleTranslation}.`
      : ({ uz: `HSK ${num} xitoy tili dialoglari — pinyin va tarjima bilan.`, ru: `Диалоги HSK ${num} с пиньинь и переводом.`, en: `HSK ${num} Chinese dialogues with pinyin and translation.` } as Record<string, string>)[locale] || `HSK ${num} xitoy tili dialoglari — pinyin va tarjima bilan.`,
    alternates: dialogue ? {
      canonical: `/${locale}/chinese/dialogues/${level}/${dialogueId}`,
      languages: {
        uz: `/uz/chinese/dialogues/${level}/${dialogueId}`,
        ru: `/ru/chinese/dialogues/${level}/${dialogueId}`,
        en: `/en/chinese/dialogues/${level}/${dialogueId}`,
        'x-default': `/uz/chinese/dialogues/${level}/${dialogueId}`,
      },
    } : undefined,
    openGraph: dialogue ? {
      title: `${hanzi} — ${translation}`,
      description: `HSK ${num} Chinese dialogue`,
      type: 'article',
      // Dialogue hero image when set; otherwise the root-layout default OG image applies.
      ...(dialogue.image ? { images: [{ url: dialogue.image }] } : {}),
    } : undefined,
  };
}

export default async function DialoguePage({ params }: PageParams) {
  const { locale, level, dialogueId } = await params;
  setRequestLocale(locale);
  if (!VALID_LEVELS.has(level)) notFound();
  const num = level.replace('hsk', '');

  const raw = await getDialogue(level, dialogueId);
  if (!raw) notFound();

  const resolved = await resolveDialogueVocab(raw);
  const preview = buildDialoguePreview(resolved);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';
  const translation = locale === 'ru' ? raw.titleTranslation_ru
    : locale === 'en' ? (raw.titleTranslation_en || raw.titleTranslation)
    : raw.titleTranslation;
  const dialoguesLabel = ({ uz: 'Dialoglar', ru: 'Диалоги', en: 'Dialogues' } as Record<string, string>)[locale] || 'Dialogues';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([
      { name: 'Blim', path: `/${locale}` },
      { name: 'Chinese', path: `/${locale}/chinese/dialogues` },
      { name: dialoguesLabel, path: `/${locale}/chinese/dialogues?dialhsk=${num}` },
      { name: `${raw.title} — ${translation}`, path: `/${locale}/chinese/dialogues/${level}/${dialogueId}` },
    ]),
    {
      '@type': 'LearningResource',
      name: `${raw.title} (${raw.pinyin}) — ${translation}`,
      description: `HSK ${num} Chinese dialogue: ${raw.title} — ${translation}`,
      educationalLevel: `HSK ${num}`,
      learningResourceType: 'Dialogue',
      inLanguage: 'zh',
      url: `${siteUrl}/${locale}/chinese/dialogues/${level}/${dialogueId}`,
      provider: { '@type': 'Organization', name: 'Blim' },
    },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <DialogueReader
        meta={{
          book: level,
          slug: dialogueId,
          level: raw.level,
          title: raw.title,
          pinyin: raw.pinyin,
          titleTranslation: raw.titleTranslation,
          titleTranslation_ru: raw.titleTranslation_ru,
          titleTranslation_en: raw.titleTranslation_en,
          dictationPinyin: raw.dictationPinyin,
          voices: raw.voices,
        }}
        bookPath={`/chinese/${level}`}
        listPath={`/chinese/dialogues?dialhsk=${num}`}
        preview={preview}
      />
    </>
  );
}
