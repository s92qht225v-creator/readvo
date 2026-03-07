import type { Metadata } from 'next';
import { GrammarLiangciPage } from '@/components/GrammarLiangciPage';

export const metadata: Metadata = {
  title: '量词 (liàngcí) — Xitoy tili grammatikasi | HSK 1',
  description: 'Xitoy tili grammatikasi: 量词 (liàngcí) — sanash so\'zlari (measure words): 个、本、杯 va boshqalar. Misollar va tushuntirishlar. | Грамматика китайского: 量词 (liàngcí) — счётные слова (measure words): 个、本、杯 и другие. Примеры и объяснения.',
};

export default function LiangciPage() {
  return <GrammarLiangciPage />;
}
