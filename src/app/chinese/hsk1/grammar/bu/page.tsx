import type { Metadata } from 'next';
import { GrammarBuPage } from '@/components/GrammarBuPage';

export const metadata: Metadata = {
  title: '不 (bù) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 不 (bù) inkor yuklamasini o\'rganing: fe\'l va sifat inkori, ton o\'zgarishi, kundalik iboralar va mashqlar.',
};

export default function BuPage() {
  return <GrammarBuPage />;
}
