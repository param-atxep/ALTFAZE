import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { generateBreadcrumbSchema, generateJsonLd, generateMetadata as generateSEOMetadata } from '@/lib/seo';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Grid } from 'lucide-react';

interface Props {
  params: {
    category: string;
  };
  searchParams: {
    page?: string;
    sort?: 'trending' | 'newest' | 'price-low' | 'price-high';
  };
}

export const revalidate = 3600; // ISR: 1 hour for category pages

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoryName = params.category.replace(/-/g, ' ').toUpperCase();

  return generateSEOMetadata({
    title: `${categoryName} Templates | ALTFaze`,
    description: `Browse and download ${categoryName} templates on ALTFaze. High-quality professional templates for your projects.`,
    url: `/categories/${params.category}`,
    type: 'article',
    keywords: [categoryName, 'templates', 'download'],
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/categories/${params.category}`,
  });
}

export async function generateStaticParams() {
  const categories = await prisma.project.findMany({
    select: { category: true },
    distinct: ['category'],
  });

  return categories.map(c => ({
    category: c.category.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const categoryName = params.category.replace(/-/g, ' ');
  const page = parseInt(searchParams.page || '1');
  const sort = searchParams.sort || 'trending';
  const limit = 12;
  const skip = (page - 1) * limit;

  let orderBy: Record<string, string> = { downloads: 'desc' };

  if (sort === 'newest') orderBy = { createdAt: 'desc' };
  if (sort === 'price-low') orderBy = { price: 'asc' };
  if (sort === 'price-high') orderBy = { price: 'desc' };

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where: {
        category: { contains: categoryName, mode: 'insensitive' },
        status: 'APPROVED',
      },
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        imageUrl: true,
        rating: true,
        downloads: true,
        creator: { select: { name: true } },
      },
      orderBy,
      take: limit,
      skip,
    }),

    prisma.template.count({
      where: {
        category: { contains: categoryName, mode: 'insensitive' },
        status: 'APPROVED',
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Categories', url: `${siteUrl}/categories` },
    { name: categoryName, url: `${siteUrl}/categories/${params.category}` },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateJsonLd(breadcrumbSchema) }} />
      {/* Category Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/categories" className="hover:opacity-80">
              Categories
            </Link>
            <span>/</span>
            <span className="font-semibold">{categoryName}</span>
          </div>

          <h1 className="text-4xl font-bold mb-2 capitalize">{categoryName} Templates</h1>
          <p className="text-blue-100">Discover {total} professional templates in this category</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid size={18} />
            <span className="text-slate-600">{total} templates</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Sort:</label>
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {templates.map(template => (
                <Link key={template.id} href={`/templates/${template.slug}`}>
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition group h-full">
                    {/* Thumbnail */}
                    {template.imageUrl && (
                      <div className="relative w-full h-48 bg-slate-200 overflow-hidden">
                        <Image
                          src={template.imageUrl}
                          alt={template.title}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                          sizes="(max-width: 1024px) 100vw, 33vw"
                        />
                      </div>
                    )}

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 mb-2">
                        {template.title}
                      </h3>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-slate-900">${template.price}</span>
                        <span className="text-xs text-slate-600">
                          ⭐ {template.rating ? parseFloat(template.rating).toFixed(1) : '0'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>By {template.creator.name}</span>
                        <span>{template.downloads} downloads</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link href={`/categories/${params.category}?page=${page - 1}&sort=${sort}`}>
                    <Button variant="outline">← Previous</Button>
                  </Link>
                )}

                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  if (pageNum > totalPages) return null;

                  return (
                    <Link key={pageNum} href={`/categories/${params.category}?page=${pageNum}&sort=${sort}`}>
                      <Button variant={pageNum === page ? 'default' : 'outline'}>{pageNum}</Button>
                    </Link>
                  );
                })}

                {page < totalPages && (
                  <Link href={`/categories/${params.category}?page=${page + 1}&sort=${sort}`}>
                    <Button variant="outline">Next →</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No templates found in this category.</p>
            <Link href="/templates">
              <Button>Browse all templates</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
