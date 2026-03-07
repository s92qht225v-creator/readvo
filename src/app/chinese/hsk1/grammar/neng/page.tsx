import type { Metadata } from 'next';
import { GrammarNengPage } from '@/components/GrammarNengPage';

export const metadata: Metadata = {
  title: '能 (néng) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 能 (néng) — imkoniyat va ruxsat bildiruvchi modal fe\'l. Misollar va tushuntirishlar. | Грамматика китайского: 能 (néng) — модальный глагол "мочь". Примеры и объяснения.',
};

export default function NengPage() {
  return <GrammarNengPage />;
}
