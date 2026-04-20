import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { GrammarShiPolishedPage } from '@/components/GrammarShiPolishedPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: {
    title: '是 shì "…dir" (polished) — Xitoy tili grammatikasi | HSK 1',
    description: 'Xitoy tili grammatikasi: 是 (shì) — «…dir» bog\'lovchi fe\'li. Karta formatidagi yangi dizayn.',
  },
  ru: {
    title: '是 shì «быть» (polished) — Грамматика китайского языка | HSK 1',
    description: 'Грамматика китайского языка: 是 (shì) — глагол-связка «быть». Новый карточный формат.',
  },
  en: {
    title: '是 shì "to be" (polished) — Chinese Grammar | HSK 1',
    description: 'Chinese grammar: 是 (shì) — the verb "to be". New card-based lesson format.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/chinese/hsk1/grammar/shi-polished`,
      languages: {
        uz: '/uz/chinese/hsk1/grammar/shi-polished',
        ru: '/ru/chinese/hsk1/grammar/shi-polished',
        en: '/en/chinese/hsk1/grammar/shi-polished',
        'x-default': '/uz/chinese/hsk1/grammar/shi-polished',
      },
    },
  };
}

export default async function ShiPolishedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <GrammarShiPolishedPage />;
}
