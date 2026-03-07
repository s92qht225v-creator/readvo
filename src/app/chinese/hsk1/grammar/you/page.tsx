import type { Metadata } from 'next';
import { GrammarYouPage } from '@/components/GrammarYouPage';

export const metadata: Metadata = {
  title: '有 (yǒu) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 有 (yǒu) — "bor" fe\'li — egalik va mavjudlik. Misollar va tushuntirishlar. | Грамматика китайского: 有 (yǒu) — глагол "иметь". Примеры и объяснения.',
};

export default function YouPage() {
  return <GrammarYouPage />;
}
