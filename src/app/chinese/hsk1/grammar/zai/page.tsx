import type { Metadata } from 'next';
import { GrammarZaiPage } from '@/components/GrammarZaiPage';

export const metadata: Metadata = {
  title: '在 (zài) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 在 (zài) yuklamasini o\'rganing: joylashuv, harakat joyi, inkor shakli va mashqlar.',
};

export default function ZaiPage() {
  return <GrammarZaiPage />;
}
