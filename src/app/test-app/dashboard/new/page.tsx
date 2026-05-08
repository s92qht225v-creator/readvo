'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { TestNav } from '@/components/test/TestNav';
import { authHeaders } from '@/lib/test/clientFetch';
import { navigateToTestHref } from '@/lib/test/paths';

export default function NewTestPage() {
  const { isLoading } = useRequireAuth({ redirectTo: '/login' });
  const { getAccessToken } = useAuth();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (isLoading) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setErr(null);
    const tok = await getAccessToken();
    const res = await fetch('/api/tests', {
      method: 'POST',
      headers: authHeaders(tok, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: title.trim() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? 'Failed to create');
      setSubmitting(false);
      return;
    }
    const { test } = await res.json();
    navigateToTestHref(`/dashboard/${test.id}/edit`);
  };

  return (
    <>
      <TestNav />
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>New test</h1>
        <form onSubmit={submit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            placeholder="e.g. Chapter 3 Quiz"
            style={{
              width: '100%', padding: '10px 12px', fontSize: 15,
              border: '1px solid #cbd5e1', borderRadius: 8,
              boxSizing: 'border-box',
            }}
          />
          {err ? <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{err}</div> : null}
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            style={{
              marginTop: 16, padding: '10px 18px',
              background: '#0f172a', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600,
              cursor: title.trim() && !submitting ? 'pointer' : 'not-allowed',
              opacity: title.trim() && !submitting ? 1 : 0.5,
            }}
          >
            {submitting ? 'Creating…' : 'Create test'}
          </button>
        </form>
      </main>
    </>
  );
}
