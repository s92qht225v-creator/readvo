import type { Metadata } from 'next';
import { GrammarShiPage } from '@/components/GrammarShiPage';

export const metadata: Metadata = {
  title: '是 (shì) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 是 (shì) yuklamasini o\'rganing: tuzilma, misollar, inkor shakli va mashqlar.',
};

export default function ShiPage() {
  return <GrammarShiPage />;
}
