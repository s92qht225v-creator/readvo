import type { Metadata } from 'next';
import { GrammarHenPage } from '@/components/GrammarHenPage';

export const metadata: Metadata = {
  title: '很 (hěn) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 很 (hěn) — sifat oldidagi "juda" ravishi. Misollar va tushuntirishlar. | Грамматика китайского: 很 (hěn) — наречие "очень". Примеры и объяснения.',
};

export default function HenPage() {
  return <GrammarHenPage />;
}
