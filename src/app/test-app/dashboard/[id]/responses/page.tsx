'use client';

import { use } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { TestNav } from '@/components/test/TestNav';
import { ResponsesTable } from '@/components/test/ResponsesTable';
import { TestLink } from '@/components/test/TestLink';

export default function TestResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isLoading } = useRequireAuth({ redirectTo: '/login' });
  if (isLoading) return null;

  return (
    <>
      <TestNav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <TestLink href={`/dashboard/${id}/edit`} style={{
          fontSize: 13, color: '#475569', textDecoration: 'none',
          display: 'inline-block', marginBottom: 16,
        }}>
          ← Back to editor
        </TestLink>
        <ResponsesTable testId={id} />
      </main>
    </>
  );
}
