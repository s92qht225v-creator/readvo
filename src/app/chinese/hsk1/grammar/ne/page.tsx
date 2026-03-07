import type { Metadata } from 'next';
import { GrammarNePage } from '@/components/GrammarNePage';

export const metadata: Metadata = {
  title: '呢 (ne) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 呢 (ne) — "...chi?" savol yuklamasi. Misollar va tushuntirishlar. | Грамматика китайского: 呢 (ne) — вопросительная частица "а...?". Примеры и объяснения.',
};

export default function NePage() {
  return <GrammarNePage />;
}
