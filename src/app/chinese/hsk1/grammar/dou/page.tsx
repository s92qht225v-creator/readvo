import type { Metadata } from 'next';
import { GrammarDouPage } from '@/components/GrammarDouPage';

export const metadata: Metadata = {
  title: '都 (dōu) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 都 (dōu) so\'zini o\'rganing: hammasi, barchasi, 都不 va 不都 farqi, savol so\'zlari bilan qo\'llanish va mashqlar.',
};

export default function DouPage() {
  return <GrammarDouPage />;
}
