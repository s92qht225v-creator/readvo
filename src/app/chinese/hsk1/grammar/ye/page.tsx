import type { Metadata } from 'next';
import { GrammarYePage } from '@/components/GrammarYePage';

export const metadata: Metadata = {
  title: '也 (yě) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 也 (yě) — "ham" ma\'nosidagi yuklama. Misollar va tushuntirishlar. | Грамматика китайского: 也 (yě) — частица "тоже". Примеры и объяснения.',
};

export default function YePage() {
  return <GrammarYePage />;
}
