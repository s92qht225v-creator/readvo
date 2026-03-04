import type { Metadata } from 'next';
import { GrammarLePage } from '@/components/GrammarLePage';

export const metadata: Metadata = {
  title: '了 (le) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 了 (le) yuklamasini o\'rganing: tugallangan harakat, holat o\'zgarishi, 太...了 va mashqlar.',
};

export default function LePage() {
  return <GrammarLePage />;
}
