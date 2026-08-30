import type { Metadata } from 'next';
import { PublicLegalPage } from '@/components/public-legal-page';
export const metadata: Metadata = { title: 'Terms' };
export default function TermsPage() {
  return <PublicLegalPage type="terms" />;
}
