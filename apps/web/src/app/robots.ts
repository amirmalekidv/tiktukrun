import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tiktakrun.ir';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/games', '/games/*', '/section/*', '/about', '/contact'],
        disallow: [
          '/api/',
          '/admin/',
          '/(auth)',
          '/(authenticated)',
          '/wallet/',
          '/profile/',
          '/bookings/',
          '/notifications/',
          '/settings/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
