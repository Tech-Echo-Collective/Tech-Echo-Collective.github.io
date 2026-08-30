import type { MetadataRoute } from 'next';
import { getPublicOrigin } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicOrigin();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/terms'],
        disallow: [
          '/auth/',
          '/api/',
          '/home',
          '/forum',
          '/member/',
          '/settings',
          '/onboarding',
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
