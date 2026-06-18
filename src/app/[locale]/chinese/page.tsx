import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { DialoguesCatalog } from '@/components/catalog/DialoguesCatalog';
import { loadDialoguesAll } from '@/services/catalogData';
import { breadcrumbJsonLd, jsonLdScript } from '@/utils/jsonLd';

export const revalidate = 3600;

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Xitoy tili dialoglari — HSK 1-6', description: 'HSK 1-6 xitoy tili dialoglari: audio, pinyin, tarjima. Bepul boshlang!' },
  ru: { title: 'Диалоги на китайском — HSK 1-6', description: 'Диалоги HSK 1-6: аудио, пиньинь, перевод. Начните бесплатно!' },
  en: { title: 'Chinese Dialogues — HSK 1-6', description: 'HSK 1-6 Chinese dialogues with audio, pinyin and translation. Start free!' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title, description: m.description,
    alternates: { canonical: `/${locale}/chinese`, languages: { uz: '/uz/chinese', ru: '/ru/chinese', en: '/en/chinese', 'x-default': '/uz/chinese' } },
  };
}

export default async function ChineseDialoguesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await loadDialoguesAll();
  const homeLabel = ({ uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' } as Record<string, string>)[locale] || 'Home';
  const jsonLd = jsonLdScript([
    breadcrumbJsonLd([{ name: homeLabel, path: `/${locale}` }, { name: 'Chinese', path: `/${locale}/chinese` }]),
    { '@type': 'Course', name: 'HSK 1 Chinese', description: (pageMeta[locale] || pageMeta.uz).description, provider: { '@type': 'Organization', name: 'Blim' }, inLanguage: 'zh', educationalLevel: 'Beginner' },
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Suspense>
        <DialoguesCatalog dialogues={d.dialogues} dialoguesHsk2={d.dialoguesHsk2} dialoguesHsk3={d.dialoguesHsk3} dialoguesHsk4={d.dialoguesHsk4} dialoguesHsk5={d.dialoguesHsk5} dialoguesHsk6={d.dialoguesHsk6} />
      </Suspense>
    </>
  );
}
