import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { generateBreadcrumbSchema, generateJsonLd, generateMetadata as generateSEOMetadata, generatePersonSchema } from '@/lib/seo';
import Image from 'next/image';
import { Star, MapPin, Globe, Award, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: {
    slug: string;
  };
}

export const revalidate = 7200; // ISR: revalidate every 2 hours

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const freelancer = await prisma.user.findUnique({
    where: { slug: params.slug },
  });

  if (!freelancer || freelancer.role !== 'FREELANCER') {
    return {
      title: 'Freelancer Not Found',
      description: 'This freelancer profile could not be found.',
    };
  }

  return generateSEOMetadata({
    title: `${freelancer.name} - Freelancer on ALTFaze`,
    description: freelancer.bio || `Hire ${freelancer.name} on ALTFaze marketplace`,
    image: freelancer.image || `${process.env.NEXT_PUBLIC_BASE_URL}/default-avatar.png`,
    url: `/freelancers/${freelancer.slug}`,
    type: 'profile',
    keywords: ['freelancer', freelancer.name, 'hire'],
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/freelancers/${freelancer.slug}`,
  });
}

export async function generateStaticParams() {
  // Pre-render top 100 freelancers by rating
  const freelancers = await prisma.user.findMany({
    where: { role: 'FREELANCER' },
    select: { slug: true },
    take: 100,
    orderBy: { rating: 'desc' },
  });

  return freelancers
    .filter(f => f.slug !== null)
    .map(freelancer => ({
      slug: freelancer.slug!,
    }));
}

export default async function FreelancerPage({ params }: Props) {
  const freelancer = await prisma.user.findUnique({
    where: { slug: params.slug },
    include: {
      templates: {
        where: { status: 'APPROVED' },
        take: 6,
        orderBy: { downloads: 'desc' },
      },
      _count: {
        select: { templates: true, projects: true },
      },
    },
  });

  if (!freelancer || freelancer.role !== 'FREELANCER') {
    notFound();
  }

  const averageRating = freelancer.rating ? parseFloat(freelancer.rating.toFixed(1)) : 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  const canonicalUrl = `${siteUrl}/freelancers/${freelancer.slug}`;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Freelancers', url: `${siteUrl}/freelancers` },
    { name: freelancer.name, url: canonicalUrl },
  ]);
  const personSchema = generatePersonSchema({
    name: freelancer.name,
    url: canonicalUrl,
    image: freelancer.image || undefined,
    description: freelancer.bio || undefined,
    title: 'Freelancer',
    rating: freelancer.rating,
    reviewCount: freelancer.reviewCount,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateJsonLd([breadcrumbSchema, personSchema]) }} />
      {/* Header Background */}
      <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 mb-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-4 border-white">
                <Image
                  src={freelancer.image || '/placeholder.png'}
                  alt={freelancer.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                  priority
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{freelancer.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600">({averageRating}) • {freelancer._count.templates} templates</span>
              </div>

              <p className="text-slate-700 mb-4">{freelancer.bio}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{freelancer._count.templates}</p>
                  <p className="text-xs text-slate-600">Templates</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{freelancer._count.projects}</p>
                  <p className="text-xs text-slate-600">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">✅</p>
                  <p className="text-xs text-slate-600">Verified</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">💬</p>
                  <p className="text-xs text-slate-600">Responsive</p>
                </div>
              </div>

              <Button className="gap-2">Contact Freelancer</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Skills & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Skills */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {freelancer.skills && freelancer.skills.length > 0 ? (
                freelancer.skills.map(skill => (
                  <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-slate-600 text-sm">No skills listed</span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin size={16} className="text-slate-400" />
                <span>Based worldwide</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Globe size={16} className="text-slate-400" />
                <span>Available for hire</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Award size={16} className="text-slate-400" />
                <span>Top Rated</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Member Since</h3>
            <p className="text-2xl font-bold text-slate-900 mb-2">
              {new Date(freelancer.createdAt).getFullYear()}
            </p>
            <p className="text-sm text-slate-600">Joined {new Date(freelancer.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Templates Section */}
        {freelancer.templates.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Featured Templates</h2>
              <Link href={`/freelancers/${freelancer.slug}/templates`} className="text-blue-600 hover:underline text-sm">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {freelancer.templates.map(template => (
                <Link key={template.id} href={`/templates/${template.slug}`}>
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer">
                    {template.imageUrl && (
                      <div className="relative w-full h-40 bg-slate-200 overflow-hidden">
                        <Image
                          src={template.imageUrl}
                          alt={template.title}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-slate-900 line-clamp-2">{template.title}</p>
                      <p className="text-lg font-bold text-slate-900 mt-2">${template.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
