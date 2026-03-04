import type { Metadata } from 'next';
import { GrammarJiPage } from '@/components/GrammarJiPage';

export const metadata: Metadata = {
  title: '几/多少 (jǐ/duōshǎo) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 几 va 多少 savol so\'zlarini o\'rganing: necha? qancha? kichik va katta sonlar, o\'lchov so\'zlar, 多少钱 va 几点 kabi muhim iboralar.',
};

export default function JiPage() {
  return <GrammarJiPage />;
}
