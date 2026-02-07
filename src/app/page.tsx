import { HomePage } from '@/components/HomePage';

/**
 * Home page - shows available language categories and books.
 * Server component delegates rendering to client HomePage for language toggle.
 */
export default function Page() {
  return <HomePage />;
}
