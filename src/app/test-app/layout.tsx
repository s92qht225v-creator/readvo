import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/reading.css';
import '@/components/test/test-builder-preview.css';
import { AuthProvider } from '@/hooks/useAuth';
import { AnalyticsScripts } from '@/components/AnalyticsScripts';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Blim Tests', template: '%s | Blim Tests' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * ROOT layout for the standalone test creator (test.blim.uz). English-only;
 * no next-intl. Owns its own <html> since the app has three root layouts
 * ([locale] main site, test-app, auth).
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ minHeight: '100vh', background: '#fff', color: '#1e293b' }}>
        <AnalyticsScripts />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
