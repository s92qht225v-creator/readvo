import '@/components/test/test-builder-preview.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
});

/**
 * Standalone layout for the test creator at test.blim.uz. Deliberately does
 * NOT use NextIntlClientProvider or setRequestLocale — the test app is
 * English-only in v1 and shares no locale state with the main app.
 *
 * Note: this layout sits inside the `src/app/` root which already provides
 * the global <html>/<body>/font from `src/app/layout.tsx`. We only wrap the
 * subtree with AuthProvider so the existing useAuth hook works.
 */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className={inter.className} style={{ minHeight: '100vh', background: '#fff', color: '#1e293b' }}>
        {children}
      </div>
    </AuthProvider>
  );
}
