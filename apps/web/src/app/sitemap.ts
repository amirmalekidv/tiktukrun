import type { MetadataRoute } from 'next';

/**
 * Dynamic sitemap for TIK TAK RUN
 *
 * در production این از API لیست بازی‌ها را می‌گیرد و sitemap داینامیک می‌سازد.
 * در صورت در دسترس نبودن API، یک sitemap استاتیک از مسیرهای ثابت برمی‌گرداند.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tiktakrun.ir';

  // مسیرهای ثابت
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Section pages
    ...['horror', 'escape-room', 'laser-tag', 'paintball', 'vr', 'boardgame', 'cinema-horror']
      .map((slug) => ({
        url: `${baseUrl}/section/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
  ];

  // مسیرهای داینامیک از API (در صورت در دسترس بودن)
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/games?limit=500&isActive=true`, {
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (res.ok) {
      const data = await res.json();
      const games = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const gameRoutes: MetadataRoute.Sitemap = games.map((g: any) => ({
        url: `${baseUrl}/games/${g.slug}`,
        lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
      return [...staticRoutes, ...gameRoutes];
    }
  } catch (err) {
    console.warn('[sitemap] Failed to fetch games from API:', err);
  }

  return staticRoutes;
}
