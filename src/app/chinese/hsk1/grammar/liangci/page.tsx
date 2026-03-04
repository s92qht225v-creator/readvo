import type { Metadata } from 'next';
import { GrammarLiangciPage } from '@/components/GrammarLiangciPage';

export const metadata: Metadata = {
  title: '量词 (liàngcí) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 量词 (sanash so\'zlari, measure words) ni o\'rganing: 个、本、杯、块、只、件、辆 va boshqa asosiy measure wordlar, formulalar va misollar.',
};

export default function LiangciPage() {
  return <GrammarLiangciPage />;
}
