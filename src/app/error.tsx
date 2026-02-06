'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="home">
      <header className="home__hero">
        <h1 className="home__logo">
          <span className="home__logo-icon">📖</span>
          Kitobee
        </h1>
        <p className="home__tagline">Xatolik yuz berdi</p>
      </header>

      <section className="home__content">
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Kechirasiz, kutilmagan xatolik yuz berdi.
        </p>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              color: 'white',
            }}
          >
            Qayta urinish
          </button>
        </div>
      </section>
    </main>
  );
}
