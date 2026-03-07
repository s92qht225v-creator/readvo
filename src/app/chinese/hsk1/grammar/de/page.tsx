import type { Metadata } from 'next';
import { GrammarDePage } from '@/components/GrammarDePage';

export const metadata: Metadata = {
  title: '的 (de) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 的 (de) — egalik va sifat yasovchi yuklama. Misollar va tushuntirishlar. | Грамматика китайского: 的 (de) — притяжательная частица. Примеры и объяснения.',
};

export default function DePage() {
  return <GrammarDePage />;
}
