import type { Metadata } from 'next';
import { GrammarYouPage } from '@/components/GrammarYouPage';

export const metadata: Metadata = {
  title: '有 (yǒu) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 有 (yǒu) yuklamasini o\'rganing: egalik, mavjudlik, inkor shakli va mashqlar.',
};

export default function YouPage() {
  return <GrammarYouPage />;
}
