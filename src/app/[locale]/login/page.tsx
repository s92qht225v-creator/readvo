import type { Metadata } from 'next';
import { setRequestLocale, getLocale } from 'next-intl/server';
import { LoginPage } from '@/components/LoginPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Kirish', description: 'Blim platformasiga kirish — Google yoki Telegram orqali' },
  ru: { title: 'Вход', description: 'Войти в Blim — через Google или Telegram' },
  en: { title: 'Login', description: 'Sign in to Blim — via Google or Telegram' },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const m = pageMeta[locale] || pageMeta.uz;
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `/${locale}/login`,
      languages: { uz: '/uz/login', ru: '/ru/login', en: '/en/login', 'x-default': '/uz/login' },
    },
  };
}

export default async function Login({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginPage />;
}
