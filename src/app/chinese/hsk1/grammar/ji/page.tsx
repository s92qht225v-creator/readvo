import type { Metadata } from 'next';
import { GrammarJiPage } from '@/components/GrammarJiPage';

export const metadata: Metadata = {
  title: '几 (jǐ) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 几 (jǐ) — son so\'rash uchun savol so\'zi. Misollar va tushuntirishlar. | Грамматика китайского: 几 (jǐ) — вопросительное слово "сколько". Примеры и объяснения.',
};

export default function JiPage() {
  return <GrammarJiPage />;
}
