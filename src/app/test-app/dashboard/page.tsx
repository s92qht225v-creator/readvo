'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { TestNav } from '@/components/test/TestNav';
import { TestList } from '@/components/test/TestList';

export default function DashboardPage() {
  const { isLoading } = useRequireAuth({ redirectTo: '/login' });
  if (isLoading) return null;

  return (
    <>
      <TestNav />
      <TestList />
    </>
  );
}
