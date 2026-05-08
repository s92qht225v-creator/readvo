'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthErrorPage() {
  const [reason, setReason] = useState<string>('');
  useEffect(() => {
    const r = new URL(window.location.href).searchParams.get('reason') ?? '';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of URL param on mount
    setReason(r);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'system-ui, sans-serif',
      color: '#475569', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
          Sign-in failed
        </h1>
        <p style={{ marginBottom: 16 }}>
          We could not complete the sign-in. Please try again.
        </p>
        {reason ? (
          <p style={{ fontSize: 13, color: '#94a3b8', wordBreak: 'break-word' }}>
            {reason}
          </p>
        ) : null}
        <Link
          href="/"
          style={{
            display: 'inline-block', marginTop: 24, padding: '10px 18px',
            background: '#dc2626', color: '#fff', borderRadius: 8,
            textDecoration: 'none', fontWeight: 600,
          }}
        >
          Go back
        </Link>
      </div>
    </div>
  );
}
