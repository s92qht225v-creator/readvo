import type { Metadata } from 'next';
import { GrammarDePage } from '@/components/GrammarDePage';

export const metadata: Metadata = {
  title: '的 (de) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 的 (de) yuklamasini o\'rganing: egalik, sifat bog\'lovchi, tushirish qoidalari va mashqlar.',
};

export default function DePage() {
  return <GrammarDePage />;
}
