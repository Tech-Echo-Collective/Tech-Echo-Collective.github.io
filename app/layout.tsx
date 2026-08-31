import type { Metadata } from 'next';
import { getCurrentMember } from '@/lib/auth';
import { getPublicOrigin } from '@/lib/config';
import { getCookieLocale, getDictionary, htmlLanguage } from '@/lib/i18n';
import './globals.css';

const origin = getPublicOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: 'Tech Echo Collective',
    template: '%s · Tech Echo Collective',
  },
  description:
    'A loose science and engineering collective with one shared multilingual forum.',
  icons: { icon: '/assets/tech-echo-mark.svg' },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'Tech Echo Collective',
    title: 'Tech Echo Collective',
    description: 'A loose science and engineering collective.',
    images: [{ url: '/assets/og-image.png', width: 1730, height: 909 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tech Echo Collective',
    description: 'A loose science and engineering collective.',
    images: ['/assets/og-image.png'],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember();
  const locale = member?.preferredLocale ?? (await getCookieLocale());
  const dictionary = getDictionary(locale);
  return (
    <html lang={htmlLanguage(locale)}>
      <body>
        <a className="skip-link" href="#main-content">
          {dictionary['common.skip']}
        </a>
        {children}
      </body>
    </html>
  );
}
