import type { Metadata } from 'next';
import { GrammarMaPage } from '@/components/GrammarMaPage';

export const metadata: Metadata = {
  title: '吗 (ma) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 吗 (ma) — ha/yo\'q savol yasash. Misollar va tushuntirishlar. | Грамматика китайского: 吗 (ma) — вопросительная частица. Примеры и объяснения.',
};

export default function MaPage() {
  return <GrammarMaPage />;
}
