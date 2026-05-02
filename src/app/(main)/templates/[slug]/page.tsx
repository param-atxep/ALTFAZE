import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma, isDatabaseUrlConfigured } from '@/lib/db';
import { generateBreadcrumbSchema, generateJsonLd, generateMetadata as generateSEOMetadata, generateProductSchema } from '@/lib/seo';
import Image from 'next/image';
import { Star, Heart, ShoppingCart, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: {
    slug: string;
  };
}

export const revalidate = 3600; // ISR: revalidate every hour

// Dynamic metadata generation for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = await prisma.template.findUnique({
    where: { slug: params.slug },
    include: { creator: true },
  });

  if (!template) {
    return {
      title: 'Template Not Found',
      description: 'This template could not be found.',
    };
  }

  const imageUrl = template.imageUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/default-template.png`;

  return generateSEOMetadata({
    title: template.title,
    description: template.description,
    image: imageUrl,
    url: `/templates/${template.slug}`,
    type: 'product',
    keywords: [template.category, 'template', template.title],
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/templates/${template.slug}`,
  });
}

export async function generateStaticParams() {
  if (!isDatabaseUrlConfigured) return [];

  // Pre-render top 100 templates for performance
  const templates = await prisma.template.findMany({
    where: { status: 'APPROVED' },
    select: { slug: true },
    take: 100,
    orderBy: { downloads: 'desc' },
  });

  return templates.map(template => ({
    slug: template.slug,
  }));
}

export default async function TemplatePage({ params }: Props) {
  const template = await prisma.template.findUnique({
    where: { slug: params.slug },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          rating: true,
        },
      },
    },
  });

  if (!template || template.status !== 'APPROVED') {
    notFound();
  }

  const averageRating = template.rating ? parseFloat(template.rating.toFixed(1)) : 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  const canonicalUrl = `${siteUrl}/templates/${template.slug}`;
  const imageUrl = template.imageUrl || '/placeholder.png';
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Templates', url: `${siteUrl}/templates` },
    { name: template.category, url: `${siteUrl}/categories/${template.category.toLowerCase().replace(/\s+/g, '-')}` },
    { name: template.title, url: canonicalUrl },
  ]);
  const productSchema = generateProductSchema({
    name: template.title,
    description: template.description,
    image: imageUrl,
    price: template.price,
    currency: 'USD',
    rating: template.rating || undefined,
    reviewCount: template.downloads || undefined,
    url: canonicalUrl,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateJsonLd([breadcrumbSchema, productSchema]) }} />
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/templates" className="text-blue-600 hover:underline">
            Templates
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            href={`/categories/${template.category.toLowerCase()}`}
            className="text-blue-600 hover:underline"
          >
            {template.category}
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-medium">{template.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Preview Image */}
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-6 bg-slate-200">
              <Image
                src={imageUrl}
                alt={template.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </div>

            {/* Template Info */}
            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <h1 className="text-3xl font-bold mb-2">{template.title}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600">
                  ({averageRating}) · {template.downloads} downloads
                </span>
              </div>

              <p className="text-slate-700 leading-relaxed mb-6">{template.description}</p>

              {/* Features */}
              {template.features && template.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Features</h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {template.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-green-500 mt-1">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Creator Card */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Created by</h3>
                <Link href={`/freelancers/${template.creator.slug || template.creator.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition">
                    {template.creator.image && (
                      <Image
                        src={template.creator.image}
                        alt={template.creator.name ?? 'Creator'}
                        width={40}
                        height={40}
                        className="rounded-full"
                        sizes="40px"
                      />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{template.creator.name}</p>
                      <p className="text-sm text-slate-600">⭐ {template.creator.rating || 0}</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Purchase Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-20">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-slate-900">${template.price}</span>
                </div>
                <p className="text-sm text-slate-600">One-time purchase • Lifetime access</p>
              </div>

              <Button size="lg" className="w-full mb-3 gap-2">
                <ShoppingCart size={18} />
                Purchase Template
              </Button>

              <Button variant="outline" size="lg" className="w-full mb-4 gap-2">
                <Heart size={18} />
                Save
              </Button>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <ExternalLink size={16} className="text-slate-400" />
                  <span>Live Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📂</span>
                  <span>Category: {template.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📅</span>
                  <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Support Badge */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-slate-600 text-center">👋 Premium support included</p>
                <p className="text-xs text-slate-600 text-center mt-1">📚 Full documentation provided</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Templates Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Similar Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder - would fetch real related templates */}
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="w-full h-40 bg-slate-200" />
                <div className="p-4">
                  <p className="font-semibold text-slate-900">Related Template {i}</p>
                  <p className="text-sm text-slate-600">$49.99</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
