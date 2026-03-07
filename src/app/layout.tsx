import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import Script from 'next/script';
import '@/styles/reading.css';
import { AuthProvider } from '@/hooks/useAuth';
import { YandexPageView } from '@/components/YandexPageView';

const font = Noto_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '700'], variable: '--font-pinyin', display: 'swap', preload: true });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://blim.uz';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Xitoy tili o\'rganish — HSK darslari | Blim',
    template: '%s | Blim',
  },
  description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke, ieroglif yozish va grammatika. Bepul 7 kunlik sinov! | Учите китайский язык: HSK 1-6 диалоги, флешкарты, караоке и грамматика.',
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Blim',
    title: 'Xitoy tili o\'rganish — HSK darslari | Blim',
    description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul sinab ko\'ring!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xitoy tili o\'rganish — HSK darslari | Blim',
    description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika. Bepul sinab ko\'ring!',
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
  description: 'Xitoy tilini online o\'rganing: HSK 1-6 dialoglar, fleshkartalar, karaoke va grammatika.',
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
      <head>
        <meta name="google-site-verification" content="IOvKyDyZC0mR42xZeSCIVndhzKqnqhM9JVMlQvFiJT0" />
        <meta name="yandex-verification" content="a66bf653e2117240" />
        <meta name="msvalidate.01" content="1141CE3E734B8166DEA1C869556D38D1" />
      </head>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-1YH679LNRS" strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-1YH679LNRS');`}
      </Script>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) { return; }
          }
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],
          k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
        ym(107194604, "init", {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true
        });`}
      </Script>
      <body className={`${font.className} ${font.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/107194604" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
        <YandexPageView />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
