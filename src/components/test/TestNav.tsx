'use client';

import { useAuth } from '@/hooks/useAuth';
import { TestLink } from './TestLink';

export function TestNav() {
  const { user, logout } = useAuth();
  return (
    <nav style={{
      borderBottom: '1px solid #e2e8f0',
      background: '#fff',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    }}>
      <TestLink href="/dashboard" style={{
        fontWeight: 800, color: '#0f172a', textDecoration: 'none',
        fontSize: 18,
      }}>
        Blim Tests
      </TestLink>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: '#475569' }}>{user.email}</span>
            <button
              type="button"
              onClick={logout}
              style={{
                background: 'transparent', border: '1px solid #cbd5e1',
                padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <TestLink href="/login" style={{
            background: '#0f172a', color: '#fff',
            padding: '8px 14px', borderRadius: 8,
            textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>
            Sign in
          </TestLink>
        )}
      </div>
    </nav>
  );
}
