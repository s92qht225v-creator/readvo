import type { Metadata, Viewport } from 'next';
import { Noto_Sans } from 'next/font/google';
import '@/styles/reading.css';
import { AuthProvider } from '@/hooks/useAuth';

const font = Noto_Sans({ subsets: ['latin', 'cyrillic'] });

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
      <body className={font.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
