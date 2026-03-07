import type { Metadata } from 'next';
import { GrammarDouPage } from '@/components/GrammarDouPage';

export const metadata: Metadata = {
  title: '都 (dōu) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 都 (dōu) — "hammasi/barchasi" ma\'nosidagi yuklama. Misollar va tushuntirishlar. | Грамматика китайского: 都 (dōu) — частица "все/оба". Примеры и объяснения.',
};

export default function DouPage() {
  return <GrammarDouPage />;
}
