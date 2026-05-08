'use client';

import { useEffect } from 'react';

export default function TestAppError({
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
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#f3f0ec',
      color: '#2f2835',
      padding: 24,
    }}>
      <section style={{
        width: '100%',
        maxWidth: 520,
        background: '#fff',
        border: '1px solid #e4ded8',
        borderRadius: 18,
        padding: 28,
        boxShadow: '0 24px 70px rgba(47,40,53,0.12)',
      }}>
        <div style={{
          color: '#b91c1c',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          Test app error
        </div>
        <h1 style={{ margin: '0 0 10px', fontSize: 24, lineHeight: 1.1 }}>
          Something broke in this screen
        </h1>
        <p style={{ margin: '0 0 18px', color: '#6b6470', lineHeight: 1.45 }}>
          {error.message || 'The test creator could not render this route.'}
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
  );
}
