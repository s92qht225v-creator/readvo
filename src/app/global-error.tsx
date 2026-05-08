'use client';

// Keep this file tiny: it is loaded by Next's app error boundary in dev.

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f7f5f3',
          color: '#1c1626',
          padding: 24,
          fontFamily: 'sans-serif',
        }}>
          <section style={{
            width: '100%',
            maxWidth: 480,
            background: '#fff',
            border: '1px solid #e4ded8',
            borderRadius: 18,
            padding: 28,
            boxShadow: '0 24px 70px rgba(47,40,53,0.12)',
            textAlign: 'center',
          }}>
            <div style={{
              color: '#b91c1c',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Application error
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: 24, lineHeight: 1.1 }}>
              Something went wrong
            </h1>
            <p style={{ margin: '0 0 18px', color: '#6b6470', lineHeight: 1.45 }}>
              Reload the page or try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 'none',
                borderRadius: 10,
                background: '#2f2533',
                color: '#fff',
                padding: '10px 14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
