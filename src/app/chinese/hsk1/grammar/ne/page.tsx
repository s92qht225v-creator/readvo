import type { Metadata } from 'next';
import { GrammarNePage } from '@/components/GrammarNePage';

export const metadata: Metadata = {
  title: '呢 (ne) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 呢 (ne) davom yuklamasini o\'rganing: savolni qaytarish, narsa/kishini qidirish, 呢 vs 吗 farqi va mashqlar.',
};

export default function NePage() {
  return <GrammarNePage />;
}
