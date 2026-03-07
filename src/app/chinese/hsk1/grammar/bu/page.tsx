import type { Metadata } from 'next';
import { GrammarBuPage } from '@/components/GrammarBuPage';

export const metadata: Metadata = {
  title: '不 (bù) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 不 (bù) — inkor shakli. Misollar va tushuntirishlar. | Грамматика китайского: 不 (bù) — отрицательная частица. Примеры и объяснения.',
};

export default function BuPage() {
  return <GrammarBuPage />;
}
