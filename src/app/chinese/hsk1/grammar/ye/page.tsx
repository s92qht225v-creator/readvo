import type { Metadata } from 'next';
import { GrammarYePage } from '@/components/GrammarYePage';

export const metadata: Metadata = {
  title: '也 (yě) — Xitoy tili grammatikasi',
  description: 'Xitoy tilidagi 也 (yě) yuklamasini o\'rganing: ham, ikki sub\'ekt, ikki harakat, 也不 inkor va mashqlar.',
};

export default function YePage() {
  return <GrammarYePage />;
}
