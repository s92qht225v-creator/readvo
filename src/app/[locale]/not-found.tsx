'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

const text: Record<string, { title: string; message: string; back: string }> = {
  uz: { title: 'Sahifa topilmadi', message: 'Kechirasiz, bu sahifa mavjud emas.', back: '← Bosh sahifaga qaytish' },
  ru: { title: 'Страница не найдена', message: 'Извините, эта страница не существует.', back: '← На главную' },
  en: { title: 'Page not found', message: 'Sorry, this page does not exist.', back: '← Back to home' },
};

export default function NotFound() {
  const locale = useLocale();
  const t = text[locale] || text.uz;

  return (
    <main className="home">
      <header className="home__hero">
        <h1 className="home__logo">
          <Image src="/logo.svg" alt="Blim" width={120} height={40} className="home__logo-img" priority />
        </h1>
        <p className="home__tagline">{t.title}</p>
      </header>

      <section className="home__content">
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {t.message}
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link href="/" className="book-card" style={{ display: 'inline-block' }}>
            {t.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
