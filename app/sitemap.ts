import type { MetadataRoute } from 'next';
import { getPublicOrigin } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getPublicOrigin();
  const lastModified = new Date('2026-09-04T00:00:00Z');
  return [
    { url: `${origin}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    {
      url: `${origin}/games/cradles-of-civilization/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    { url: `${origin}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${origin}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
