import type { Metadata } from 'next';
import { GrammarLePage } from '@/components/GrammarLePage';

export const metadata: Metadata = {
  title: '了 (le) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 了 (le) — tugallangan harakat va o\'zgarish. Misollar va tushuntirishlar. | Грамматика китайского: 了 (le) — завершённое действие и изменение. Примеры и объяснения.',
};

export default function LePage() {
  return <GrammarLePage />;
}
