import type { Metadata } from 'next';
import { GrammarShiPage } from '@/components/GrammarShiPage';

export const metadata: Metadata = {
  title: '是 (shì) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 是 (shì) — "bu" yordamchi fe\'li. Misollar va tushuntirishlar. | Грамматика китайского: 是 (shì) — глагол-связка "быть". Примеры и объяснения.',
};

export default function ShiPage() {
  return <GrammarShiPage />;
}
