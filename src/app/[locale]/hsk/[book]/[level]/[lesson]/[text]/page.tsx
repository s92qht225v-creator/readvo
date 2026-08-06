import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getHskText, loadHskLessons, listHskBooks, listHskLevels } from '@/services/hsk';
import { resolveVocab } from '@/services/glossary';
import { DialogueReader } from '@/components/DialogueReader';
import type { DialoguePreviewData } from '@/components/dialoguePreview.types';

export const revalidate = 3600;

interface PageParams {
  params: Promise<{ locale: string; book: string; level: string; lesson: string; text: string }>;
}

export async function generateStaticParams() {
  const out: { book: string; level: string; lesson: string; text: string }[] = [];
  for (const book of listHskBooks()) {
    for (const level of listHskLevels(book)) {
      for (const l of loadHskLessons(book, level)) {
        for (const t of l.texts) out.push({ book, level, lesson: l.slug, text: t.slug });
      }
    }
  }
  return out;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { locale, book, level, lesson, text } = await params;
  const found = getHskText(book, level, lesson, text);
  if (!found) return {};
  const tr = locale === 'ru' ? found.lesson.titleTranslation_ru
    : locale === 'en' ? (found.lesson.titleTranslation_en || found.lesson.titleTranslation)
    : found.lesson.titleTranslation;
  return {
    title: `${found.lesson.title} — HSK ${level} ${found.text.label}`,
    description: `${found.lesson.bookTitle} HSK ${level}, ${found.lesson.unit}-dars: ${tr}`,
    // Unlinked while authoring — see the level page.
    robots: { index: false, follow: false },
  };
}

export default async function HskTextPage({ params }: PageParams) {
  const { locale, book, level, lesson, text } = await params;
  setRequestLocale(locale);
  const found = getHskText(book, level, lesson, text);
  if (!found) notFound();

  // Same public slice the dialogue reader expects. The teaser is the first two
  // lines; the rest sits behind the same gate as every other paid reader.
  const sentences = found.text.sections.flatMap((s) => s.sentences) as unknown as DialoguePreviewData['teaser'];
  const vocab = await resolveVocab((found.text.vocab ?? []) as Parameters<typeof resolveVocab>[0]);
  const preview: DialoguePreviewData = {
    teaser: sentences.slice(0, 2),
    hiddenCount: Math.max(0, sentences.length - 2),
    vocab,
    category_uz: `HSK ${level} · ${found.lesson.unit}-dars`,
    category_ru: `HSK ${level} · Урок ${found.lesson.unit}`,
    category_en: `HSK ${level} · Lesson ${found.lesson.unit}`,
  };

  return (
    <DialogueReader
      meta={{
        book,
        slug: `${lesson}/${text}`,
        level: found.text.level,
        title: found.lesson.title,
        pinyin: found.lesson.pinyin,
        titleTranslation: found.lesson.titleTranslation,
        titleTranslation_ru: found.lesson.titleTranslation_ru,
        titleTranslation_en: found.lesson.titleTranslation_en,
        dictationKeyboard: found.text.dictationKeyboard,
        dictationPinyin: found.text.dictationPinyin,
        voices: found.text.voices,
      }}
      bookPath={`/hsk/${book}/${level}`}
      listPath={`/hsk/${book}/${level}`}
      preview={preview}
      contentPath={`/api/content/hsk/${book}/${level}/${lesson}/${text}`}
    />
  );
}
