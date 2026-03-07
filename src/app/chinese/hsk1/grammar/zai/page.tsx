import type { Metadata } from 'next';
import { GrammarZaiPage } from '@/components/GrammarZaiPage';

export const metadata: Metadata = {
  title: '在 (zài) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 在 (zài) — joylashuv va davom etayotgan harakat. Misollar va tushuntirishlar. | Грамматика китайского: 在 (zài) — предлог места и продолженное действие. Примеры и объяснения.',
};

export default function ZaiPage() {
  return <GrammarZaiPage />;
}
