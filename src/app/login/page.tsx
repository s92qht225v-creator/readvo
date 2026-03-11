import type { Metadata } from 'next';
import { LoginPage } from '@/components/LoginPage';

export const metadata: Metadata = {
  title: 'Kirish',
  description: 'Blim platformasiga kirish — Google yoki Telegram orqali',
};

export default function Login() {
  return <LoginPage />;
}
