import { NextResponse } from "next/server";

export const revalidate = 86400; // Revalidate daily

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';

  const robotsTxt = `# ALTFaze Robots Configuration
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /api/
Disallow: /_next/
Disallow: /auth/

# Crawl delay
Crawl-delay: 1

# User agents
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Sitemaps
Sitemap: ${siteUrl}/sitemap.xml

# Contact
# For issues: support@altfaze.com
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
