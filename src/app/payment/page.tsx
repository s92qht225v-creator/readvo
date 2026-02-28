import type { Metadata } from 'next';
import PaymentPage from '@/components/PaymentPage';

export const metadata: Metadata = {
  title: "To'lov - Blim",
};

export default function Payment() {
  return <PaymentPage />;
}
