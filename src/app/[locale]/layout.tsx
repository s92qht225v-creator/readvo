import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import '@/styles/reading.css';
import { routing } from '@/i18n/routing';
import { AuthProvider } from '@/hooks/useAuth';
import { TelegramFAB } from '@/components/TelegramFAB';
import { AnalyticsScripts } from '@/components/AnalyticsScripts';

const font = Noto_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '700'], variable: '--font-pinyin', display: 'swap', preload: true });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.blim.uz';

const meta: Record<string, { title: string; description: string; ogLocale: string }> = {
  uz: {
    title: 'Xitoy tili o\'rganish — HSK darslari | Blim',
    description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul boshlang!',
    ogLocale: 'uz_UZ',
  },
  ru: {
    title: 'Изучайте китайский язык — уроки HSK | Blim',
    description: 'Изучайте китайский онлайн: HSK 1-6 диалоги, флешкарты, караоке и грамматика. Начните бесплатно!',
    ogLocale: 'ru_RU',
  },
  en: {
    title: 'Learn Chinese — HSK Lessons | Blim',
    description: 'Learn Chinese online: HSK 1-6 dialogues, flashcards, karaoke and grammar. Start for free!',
    ogLocale: 'en_US',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const m = meta[locale] || meta.uz;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: m.title, template: '%s | Blim' },
    description: m.description,
    openGraph: { type: 'website', locale: m.ogLocale, siteName: 'Blim' },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      ],
      apple: '/apple-icon.png',
    },
    other: {
      'google-site-verification': 'IOvKyDyZC0mR42xZeSCIVndhzKqnqhM9JVMlQvFiJT0',
      'yandex-verification': 'a66bf653e2117240',
      'msvalidate.01': '1141CE3E734B8166DEA1C869556D38D1',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#dc2626',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${font.className} ${font.variable}`}>
        <AnalyticsScripts />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
            <TelegramFAB />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
