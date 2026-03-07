import type { Metadata } from 'next';
import { GrammarXiangPage } from '@/components/GrammarXiangPage';

export const metadata: Metadata = {
  title: '想 (xiǎng) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 想 (xiǎng) — xohish va niyat bildiruvchi fe\'l. Misollar va tushuntirishlar. | Грамматика китайского: 想 (xiǎng) — глагол "хотеть". Примеры и объяснения.',
};

export default function XiangPage() {
  return <GrammarXiangPage />;
}
