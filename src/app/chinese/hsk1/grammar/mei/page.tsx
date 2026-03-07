import type { Metadata } from 'next';
import { GrammarMeiPage } from '@/components/GrammarMeiPage';

export const metadata: Metadata = {
  title: '没 (méi) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 没 (méi) — o\'tgan zamondagi inkor shakli. Misollar va tushuntirishlar. | Грамматика китайского: 没 (méi) — отрицание в прошедшем времени. Примеры и объяснения.',
};

export default function MeiPage() {
  return <GrammarMeiPage />;
}
