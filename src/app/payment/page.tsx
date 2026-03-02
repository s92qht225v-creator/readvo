import type { Metadata } from 'next';
import PaymentPage from '@/components/PaymentPage';

export const metadata: Metadata = {
  title: "To'lov",
  description: "Blim obuna rejalarini tanlang va to'lovni amalga oshiring.",
};

export default function Payment() {
  return <PaymentPage />;
}
