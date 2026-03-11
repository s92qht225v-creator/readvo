import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarZaiPage } from '@/components/GrammarZaiPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '在 (zài) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 在 (zài) — joylashuv va davom etayotgan harakat. Misollar va tushuntirishlar.',
  },
  ru: {
    title: '在 (zài) — Грамматика китайского | HSK 1',
    description: 'Грамматика китайского: 在 (zài) — предлог места и продолженное действие. Примеры и объяснения.',
  },
  en: {
    title: '在 (zài) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 在 (zài) — location and ongoing actions. Examples and explanations.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/zai`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/zai',
        ru: '/ru/chinese/hsk1/grammar/zai',
        en: '/en/chinese/hsk1/grammar/zai',
        'x-default': '/uz/chinese/hsk1/grammar/zai',
      },
    },
  };
}

export default async function ZaiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarZaiPage />;
}
