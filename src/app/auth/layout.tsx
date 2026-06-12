import { Noto_Sans } from 'next/font/google';
import '@/styles/reading.css';

const font = Noto_Sans({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '700'], display: 'swap' });

/** ROOT layout for /auth/* (Telegram completion + Supabase callback pages —
 *  all client components that redirect). Minimal shell, no analytics. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
