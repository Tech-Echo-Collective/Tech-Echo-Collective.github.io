import type { Metadata } from 'next';
import { PublicLegalPage } from '@/components/public-legal-page';
export const metadata: Metadata = { title: 'Privacy' };
export default function PrivacyPage() {
  return <PublicLegalPage type="privacy" />;
}
