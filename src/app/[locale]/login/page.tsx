import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LoginPage } from '@/components/LoginPage';

const pageMeta: Record<string, { title: string; description: string }> = {
  uz: { title: 'Kirish', description: 'Blim hisobingizga Google yoki Telegram orqali kiring va Xitoy tili darslarini davom ettiring: HSK dialoglari, fleshkartalar, yozish mashqlari va karaoke.' },
  ru: { title: 'Вход', description: 'Войдите в Blim через Google или Telegram и продолжайте уроки китайского: диалоги HSK, флешкарты, упражнения по письму и караоке.' },
  en: { title: 'Login', description: 'Sign in to Blim with Google or Telegram and continue your Chinese lessons: HSK dialogues, flashcards, character writing practice and karaoke.' },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
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
