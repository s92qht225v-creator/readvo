import type { Metadata } from 'next';
import { EnglishLanguagePage } from '@/components/EnglishLanguagePage';

export const metadata: Metadata = {
  title: 'Ingliz tili darsliklari',
  description: 'Ingliz tili grammatika darsliklari. Destination B1/B2 darajalar.',
};

export default function EnglishPage() {
  return <EnglishLanguagePage />;
}
