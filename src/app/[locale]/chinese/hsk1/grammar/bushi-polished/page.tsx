import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarBushiPolishedPage } from '@/components/GrammarBushiPolishedPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '不是 bú shì "emas" (polished) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 不是 (bú shì) — «emas». Karta formatidagi yangi dizayn.',
  },
  ru: {
    title: '不是 bú shì «не быть» (polished) — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 不是 (bú shì) — отрицательная форма «быть». Новый карточный формат.',
  },
  en: {
    title: '不是 bú shì "is not" (polished) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 不是 (bú shì) — the negation of 是. New card-based lesson format.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/bushi-polished`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/bushi-polished',
        ru: '/ru/chinese/hsk1/grammar/bushi-polished',
        en: '/en/chinese/hsk1/grammar/bushi-polished',
        'x-default': '/uz/chinese/hsk1/grammar/bushi-polished',
      },
    },
  };
}

export default async function BushiPolishedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarBushiPolishedPage />;
}
