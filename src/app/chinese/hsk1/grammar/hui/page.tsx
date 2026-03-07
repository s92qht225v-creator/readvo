import type { Metadata } from 'next';
import { GrammarHuiPage } from '@/components/GrammarHuiPage';

export const metadata: Metadata = {
  title: '会 (huì) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 会 (huì) — qobiliyat va kelajak bildiruvchi modal fe\'l. Misollar va tushuntirishlar. | Грамматика китайского: 会 (huì) — модальный глагол "уметь/мочь". Примеры и объяснения.',
};

export default function HuiPage() {
  return <GrammarHuiPage />;
}
