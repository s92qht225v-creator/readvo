import type { Metadata } from 'next';
import { GrammarNengPage } from '@/components/GrammarNengPage';

export const metadata: Metadata = {
  title: '能 (néng) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 能 (néng) modal fe\'lini o\'rganing: sharoit va jismoniy imkoniyat, taqiqlash (不能), muloyim iltimos va 能 vs 会 vs 可以 taqqoslash.',
};

export default function NengPage() {
  return <GrammarNengPage />;
}
