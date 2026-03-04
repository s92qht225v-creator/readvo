import type { Metadata } from 'next';
import { GrammarXiangPage } from '@/components/GrammarXiangPage';

export const metadata: Metadata = {
  title: '想 (xiǎng) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 想 (xiǎng) fe\'lini o\'rganing: xohlamoq (+ fe\'l), sog\'inmoq (+ inson), o\'ylamoq; 想 vs 要 farqi va mashqlar.',
};

export default function XiangPage() {
  return <GrammarXiangPage />;
}
