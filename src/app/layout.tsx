import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import '@/styles/reading.css';
import { AuthProvider } from '@/hooks/useAuth';

const font = Noto_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '700'], variable: '--font-pinyin', display: 'swap', preload: true });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Blim — Interaktiv til o\'rganish',
    template: '%s | Blim',
  },
  description: 'Xitoy va ingliz tillarini interaktiv darsliklar, fleshkartalar, hikoyalar va karaoke orqali o\'rganing. O\'zbek tilidagi tarjimalar bilan.',
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Blim',
    title: 'Blim — Interaktiv til o\'rganish',
    description: 'Xitoy va ingliz tillarini interaktiv darsliklar, fleshkartalar, hikoyalar va karaoke orqali o\'rganing.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blim — Interaktiv til o\'rganish',
    description: 'Xitoy va ingliz tillarini interaktiv darsliklar, fleshkartalar, hikoyalar va karaoke orqali o\'rganing.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#dc2626',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Blim',
  url: siteUrl,
  description: 'Xitoy va ingliz tillarini interaktiv darsliklar, fleshkartalar, hikoyalar va karaoke orqali o\'rganing.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  inLanguage: ['uz', 'ru'],
  offers: {
    '@type': 'Offer',
    price: '50000',
    priceCurrency: 'UZS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className={`${font.className} ${font.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
