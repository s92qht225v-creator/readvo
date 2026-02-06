import Link from 'next/link';

/**
 * Home page - shows available language categories and books.
 * Server component (default in App Router).
 */

// Book/language data - can be moved to a config file later
const languages = [
  {
    id: 'chinese',
    name: 'Xitoy tili',
    nameOriginal: '中文',
    flag: '🇨🇳',
    books: [
      {
        id: 'hsk1',
        title: 'HSK 1',
        subtitle: 'Boshlang\'ich daraja',
        description: 'Xitoy tilini o\'rganishni boshlang',
      },
    ],
  },
];

export default function HomePage() {
  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <h1 className="home__logo">
          <span className="home__logo-icon">📖</span>
          Kitobee
        </h1>
        <p className="home__tagline">Interaktiv til darsliklari</p>
      </header>

      {/* Language Categories */}
      <section className="home__content">
        <h2 className="home__section-title">Tillarni tanlang</h2>
        <div className="home__languages">
          {languages.map((lang) => (
            <div key={lang.id} className="language-group">
              <div className="language-group__header">
                <span className="language-group__flag">{lang.flag}</span>
                <div className="language-group__title">
                  <h3 className="language-group__name">{lang.name}</h3>
                  <span className="language-group__original">{lang.nameOriginal}</span>
                </div>
              </div>
              <div className="language-group__books">
                {lang.books.map((book) => (
                  <Link
                    key={book.id}
                    href={`/${lang.id}/${book.id}`}
                    className="book-card"
                  >
                    <div className="book-card__content">
                      <h4 className="book-card__title">{book.title}</h4>
                      <p className="book-card__subtitle">{book.subtitle}</p>
                      <p className="book-card__description">{book.description}</p>
                    </div>
                    <span className="book-card__arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home__footer">
        <p>Kitobee — Interaktiv til darsliklari</p>
      </footer>
    </main>
  );
}
