import type { Metadata } from 'next';
import { GrammarHenPage } from '@/components/GrammarHenPage';

export const metadata: Metadata = {
  title: '很 (hěn) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 很 (hěn) ravishini o\'rganing: neytral bog\'lovchi, «juda» ma\'nosi, inkor va savol gaplarda qo\'llanish, 非常 va 太 bilan taqqoslash.',
};

export default function HenPage() {
  return <GrammarHenPage />;
}
