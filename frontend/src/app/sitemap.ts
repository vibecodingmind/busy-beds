import { MetadataRoute } from 'next';
import { hotels } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://busybeds.com';
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/hotels`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/subscription`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  let hotelPages: MetadataRoute.Sitemap = [];
  try {
    const res = await hotels.list({ limit: 500 });
    hotelPages = res.hotels.map((h) => ({
      url: `${base}/hotels/${h.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // API may not be available at build time
  }

  return [...staticPages, ...hotelPages];
}
