import { db } from "@/lib/db";
import { buildProjectPath } from "@/lib/seo";

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function generateSitemapXML(): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  
  const [templates, freelancers, projects, blogs, categories] = await Promise.all([
    db.template.findMany({
      where: { status: 'APPROVED' },
      select: { slug: true, updatedAt: true },
      take: 50000,
    }),
    db.user.findMany({
      where: { role: 'FREELANCER' },
      select: { slug: true, updatedAt: true },
      take: 50000,
    }),
    db.project.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      select: { id: true, title: true, updatedAt: true },
      take: 50000,
    }),
    db.blog.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      take: 50000,
    }),
    db.project.findMany({
      select: { category: true },
      distinct: ['category'],
    }),
  ]);

  const uniqueCategories = [...new Set(categories.map(p => p.category))];

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/templates', priority: '0.9', changefreq: 'daily' },
    { url: '/freelancers', priority: '0.9', changefreq: 'daily' },
    { url: '/projects', priority: '0.9', changefreq: 'daily' },
    { url: '/categories', priority: '0.8', changefreq: 'weekly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    { url: '/hire', priority: '0.8', changefreq: 'daily' },
    { url: '/pricing', priority: '0.7', changefreq: 'monthly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
  ];

  const templateUrls = templates.map(t => ({
    url: `/templates/${t.slug}`,
    lastmod: t.updatedAt.toISOString(),
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const freelancerUrls = freelancers.map(f => ({
    url: `/freelancers/${f.slug}`,
    lastmod: f.updatedAt.toISOString(),
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const projectUrls = projects.map(p => ({
    url: buildProjectPath(p.title, p.id),
    lastmod: p.updatedAt.toISOString(),
    priority: '0.8',
    changefreq: 'daily',
  }));

  const blogUrls = blogs.map(post => ({
    url: `/blog/${post.slug}`,
    lastmod: post.updatedAt.toISOString(),
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const categoryUrls = uniqueCategories.map(cat => ({
    url: `/categories/${encodeURIComponent(cat)}`,
    priority: '0.7',
    changefreq: 'weekly',
  }));

  const allUrls = [
    ...staticPages,
    ...templateUrls,
    ...freelancerUrls,
    ...projectUrls,
    ...blogUrls,
    ...categoryUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
  ${allUrls
    .map(
      (item) => `
  <url>
    <loc>${escapeXml(`${siteUrl}${item.url}`)}</loc>
    ${item.lastmod ? `<lastmod>${item.lastmod}</lastmod>` : ''}
    <changefreq>${item.changefreq || 'weekly'}</changefreq>
    <priority>${item.priority || '0.5'}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return xml;
}

export async function generateSitemapIndex(): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap.xml</loc>
  </sitemap>
</sitemapindex>`;

  return xml;
}
