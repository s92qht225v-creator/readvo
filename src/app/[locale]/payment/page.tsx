import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import PaymentPage from '@/components/PaymentPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: "To'lov", description: "Blim obuna rejalarini tanlang va to'lovni amalga oshiring." },
  ru: { title: 'Оплата', description: 'Выберите план подписки Blim и оплатите.' },
  en: { title: 'Payment', description: 'Choose a Blim subscription plan and make a payment.' },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/payment`,
      languages: { uz: '/uz/payment', ru: '/ru/payment', en: '/en/payment', 'x-default': '/uz/payment' },
    },
  };
}

export default async function Payment({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaymentPage />;
}
