import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { VocabularyReview } from '@/components/VocabularyReview';

// Personal, per-user page — content is client-fetched and login-gated, so keep
// it out of the index.
export const metadata: Metadata = {
  title: 'My Vocabulary',
  robots: { index: false, follow: false },
};

export default async function VocabularyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <VocabularyReview />;
}
