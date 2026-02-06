import Link from 'next/link';
import { getLessonsWithInfo } from '@/services';

/**
 * HSK 1 Book page - shows available lessons with visual cards.
 * Server component (default in App Router).
 */
export default async function HSK1BookPage() {
  const lessons = await getLessonsWithInfo();
  const hasContent = lessons.length > 0;

  return (
    <main className="home">
      {/* Hero Section */}
      <header className="home__hero">
        <Link href="/" className="home__back-link">← Bosh sahifa</Link>
        <h1 className="home__logo">
          <span className="home__logo-icon">🇨🇳</span>
          HSK 1
        </h1>
        <p className="home__tagline">Xitoy tili — Boshlang'ich daraja</p>
      </header>

      {!hasContent ? (
        <div className="home__empty">
          <div className="home__empty-icon">📚</div>
          <p>Kontent topilmadi.</p>
          <p>
            <code>content/</code> papkasiga JSON fayllarini qo'shing.
          </p>
        </div>
      ) : (
        <section className="home__content">
          <h2 className="home__section-title">Darslar</h2>
          <div className="home__lessons">
            {lessons.map((lesson) => (
              <article key={lesson.lessonId} className="lesson-card">
                <div className="lesson-card__header">
                  <div className="lesson-card__number">{lesson.lessonNumber}</div>
                  <div className="lesson-card__title-group">
                    <h3 className="lesson-card__title">{lesson.title}</h3>
                    <p className="lesson-card__pinyin">{lesson.pinyin}</p>
                    <p className="lesson-card__translation">{lesson.titleTranslation}</p>
                  </div>
                </div>
                <div className="lesson-card__pages">
                  {lesson.pages.map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/chinese/hsk1/lesson/${lesson.lessonId}/page/${pageNum}`}
                      className="lesson-card__page-link"
                    >
                      <span className="lesson-card__page-num">{pageNum}</span>
                      <span className="lesson-card__page-label">sahifa</span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Stats */}
          <div className="home__stats">
            <div className="home__stat">
              <span className="home__stat-value">{lessons.length}</span>
              <span className="home__stat-label">darslar</span>
            </div>
            <div className="home__stat">
              <span className="home__stat-value">
                {lessons.reduce((sum, l) => sum + l.pages.length, 0)}
              </span>
              <span className="home__stat-label">sahifalar</span>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="home__footer">
        <p>Kitobee — Interaktiv til darsliklari</p>
      </footer>
    </main>
  );
}
