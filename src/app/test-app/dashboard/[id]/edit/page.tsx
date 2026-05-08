'use client';

import { use } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { TestBuilder } from '@/components/test/TestBuilder';

export default function EditTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isLoading } = useRequireAuth({ redirectTo: '/login' });
  if (isLoading) return null;
  // The builder owns the entire viewport (its own toolbar + 3-pane layout).
  return <TestBuilder testId={id} />;
}
