import type { Metadata } from 'next';
import { GrammarHuiPage } from '@/components/GrammarHuiPage';

export const metadata: Metadata = {
  title: '会 (huì) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 会 (huì) modal fe\'lini o\'rganing: o\'rganib olgan mahorat, kelajak taxmini, 不会 inkor, savol shakllari va 会 vs 能 vs 可以 taqqoslash.',
};

export default function HuiPage() {
  return <GrammarHuiPage />;
}
