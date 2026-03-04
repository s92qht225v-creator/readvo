import type { Metadata } from 'next';
import { GrammarMeiPage } from '@/components/GrammarMeiPage';

export const metadata: Metadata = {
  title: '没 (méi) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 没 (méi) inkor yuklamasini o\'rganing: o\'tgan zamon inkori, yo\'qlik bildirish, 没 vs 不 taqqoslash va 没有 qisqartmasi.',
};

export default function MeiPage() {
  return <GrammarMeiPage />;
}
