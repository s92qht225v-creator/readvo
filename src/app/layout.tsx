import type { Metadata, Viewport } from 'next';
import '@/styles/reading.css';

export const metadata: Metadata = {
  title: 'ReadVo - Interaktiv o\'qish',
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
      <body>{children}</body>
    </html>
  );
}
