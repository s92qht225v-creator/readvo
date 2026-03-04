import type { Metadata } from 'next';
import { GrammarMaPage } from '@/components/GrammarMaPage';

export const metadata: Metadata = {
  title: '吗 (ma) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 吗 (ma) savol yuklamasini o\'rganing: savol tuzish, javob berish, savol so\'zlari bilan farqi va mashqlar.',
};

export default function MaPage() {
  return <GrammarMaPage />;
}
