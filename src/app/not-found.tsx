import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="home">
      <header className="home__hero">
        <h1 className="home__logo">
          <span className="home__logo-icon">📖</span>
          Kitobee
        </h1>
        <p className="home__tagline">Sahifa topilmadi</p>
      </header>

      <section className="home__content">
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Kechirasiz, bu sahifa mavjud emas.
        </p>
        <div style={{ textAlign: 'center' }}>
          <Link href="/" className="book-card" style={{ display: 'inline-block' }}>
            ← Bosh sahifaga qaytish
          </Link>
        </div>
      </section>
    </main>
  );
}
