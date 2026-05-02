import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma, isDatabaseUrlConfigured } from '@/lib/db';
import { buildProjectPath, generateBreadcrumbSchema, generateJsonLd, generateMetadata as generateSEOMetadata, slugify } from '@/lib/seo';
import Image from 'next/image';
import { Clock, MapPin, DollarSign, Users, CheckCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Props {
  params: {
    slug: string;
  };
}

export const revalidate = 1800; // ISR: revalidate every 30 min (projects update more frequently)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: params.slug }, { id: params.slug.split('-').at(-1) || params.slug }],
    },
  });

  if (!project) {
    return {
      title: 'Project Not Found',
      description: 'This project could not be found.',
    };
  }

  return generateSEOMetadata({
    title: project.title,
    description: project.description,
    url: buildProjectPath(project.title, project.id),
    type: 'article',
    keywords: [project.category, 'project', project.title],
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com'}${buildProjectPath(project.title, project.id)}`,
  });
}

export async function generateStaticParams() {
  if (!isDatabaseUrlConfigured) return [];

  // Pre-render top 50 active projects
  const projects = await prisma.project.findMany({
    where: {
      status: {
        in: ['OPEN', 'IN_PROGRESS'],
      },
    },
    select: { id: true, title: true },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  return projects.map(project => ({
    slug: `${slugify(project.title)}-${project.id}`,
  }));
}

export default async function ProjectPage({ params }: Props) {
  const project = await prisma.project.findFirst({
    where: {
      OR: [{ id: params.slug }, { id: params.slug.split('-').at(-1) || params.slug }],
    },
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
      _count: {
        select: { proposals: true },
      },
    },
  });

  if (!project || !['OPEN', 'IN_PROGRESS', 'COMPLETED'].includes(project.status)) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-slate-100 text-slate-800',
  };

  const daysRemaining = project.deadline
    ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  const canonicalUrl = `${siteUrl}${buildProjectPath(project.title, project.id)}`;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Projects', url: `${siteUrl}/projects` },
    { name: project.title, url: canonicalUrl },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateJsonLd(breadcrumbSchema) }} />
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-sm">
          <Link href="/projects" className="text-blue-600 hover:underline">
            Projects
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-medium">{project.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.title}</h1>
                  <p className="text-slate-600">{project.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                  {project.status === 'OPEN' ? '🟢 Open' : project.status === 'IN_PROGRESS' ? '🔵 In Progress' : '✅ Completed'}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-slate-600 text-sm">Budget</p>
                  <p className="text-xl font-bold text-slate-900">${project.budget}</p>
                </div>
                {daysRemaining !== null && (
                  <div>
                    <p className="text-slate-600 text-sm">Time Left</p>
                    <p className="text-xl font-bold text-slate-900">
                      {daysRemaining > 0 ? `${daysRemaining}d` : 'Ended'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-600 text-sm">Proposals</p>
                  <p className="text-xl font-bold text-slate-900">{project._count.proposals}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Skills</p>
                  <p className="text-xl font-bold text-slate-900">{project.skills?.join(', ') || 'Any'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Description</h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>

            {/* Skills & Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.skills && project.skills.length > 0 ? (
                  project.skills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-600 text-sm">No specific skills required</span>
                )}
              </div>

            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Action Card */}
            {project.status === 'OPEN' && (
              <div className="bg-white rounded-lg p-6 shadow-sm sticky top-20 mb-6">
                <h3 className="font-semibold text-lg mb-4">Interested?</h3>
                <Button size="lg" className="w-full mb-3 gap-2">
                  <MessageCircle size={18} />
                  Submit Proposal
                </Button>
                <p className="text-xs text-slate-600 text-center">
                  Stand out by personalizing your proposal for this client
                </p>
              </div>
            )}

            {/* Client Card */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <h3 className="font-semibold text-lg mb-4">About Client</h3>
              <Link href={`/freelancers/${project.creator.slug || project.creator.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition mb-4">
                  {project.creator.image && (
                    <Image
                      src={project.creator.image}
                      alt={project.creator.name ?? 'Client'}
                      width={48}
                      height={48}
                      className="rounded-full"
                      sizes="48px"
                    />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">{project.creator.name ?? 'Client'}</p>
                    <p className="text-sm text-slate-600">⭐ {project.creator.rating || 0}</p>
                  </div>
                </div>
              </Link>

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Verified Client</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <span>Quick Responder</span>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Project Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-slate-400" />
                  <span>Budget: ${project.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  <span>{project._count.proposals} proposals received</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
