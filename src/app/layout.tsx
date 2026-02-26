import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import '@/styles/reading.css';
import { AuthProvider } from '@/hooks/useAuth';

const font = Manrope({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-pinyin' });

export const metadata: Metadata = {
  title: 'Blim - Interaktiv o\'qish',
  description: 'Interaktiv til darsligi o\'quvchisi',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${font.className} ${font.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
